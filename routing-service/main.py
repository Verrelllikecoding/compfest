from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from ortools.constraint_solver import pywrapcp, routing_enums_pb2
from math import radians, sin, cos, asin, sqrt
from typing import List

app = FastAPI(title="OPSERA Route Optimizer")

class Point(BaseModel):
    lat: float
    lng: float

class OrderPoint(Point):
    id: str
    priority: str = "medium"
    weightKg: float = Field(default=1, ge=0)

class OptimizeRequest(BaseModel):
    depot: Point
    vehicleCapacityKg: float = Field(gt=0)
    orders: List[OrderPoint] = Field(min_length=1, max_length=50)

def km(a: Point, b: Point):
    lon1, lat1, lon2, lat2 = map(radians, [a.lng, a.lat, b.lng, b.lat])
    dlon, dlat = lon2-lon1, lat2-lat1
    x = sin(dlat/2)**2 + cos(lat1)*cos(lat2)*sin(dlon/2)**2
    return 6371 * 2 * asin(sqrt(x))

@app.get("/health")
def health():
    return {"success": True, "message": "routing ai ready"}

@app.post("/optimize-route")
def optimize(req: OptimizeRequest):
    if sum(o.weightKg for o in req.orders) > req.vehicleCapacityKg:
        raise HTTPException(400, "vehicle capacity exceeded")

    points = [req.depot] + req.orders
    n = len(points)
    matrix = [[int(km(points[i], points[j]) * 1000) for j in range(n)] for i in range(n)]
    manager = pywrapcp.RoutingIndexManager(n, 1, 0)
    routing = pywrapcp.RoutingModel(manager)

    def distance_cb(from_index, to_index):
        return matrix[manager.IndexToNode(from_index)][manager.IndexToNode(to_index)]
    transit = routing.RegisterTransitCallback(distance_cb)
    routing.SetArcCostEvaluatorOfAllVehicles(transit)

    demands = [0] + [int(round(o.weightKg * 10)) for o in req.orders]
    capacity = [int(round(req.vehicleCapacityKg * 10))]
    def demand_cb(index):
        return demands[manager.IndexToNode(index)]
    demand_idx = routing.RegisterUnaryTransitCallback(demand_cb)
    routing.AddDimensionWithVehicleCapacity(demand_idx, 0, capacity, True, "Capacity")

    # High-priority nodes receive a larger drop penalty, encouraging them to remain in route.
    penalties = {"high": 10_000_000, "medium": 5_000_000, "low": 2_000_000}
    for node, order in enumerate(req.orders, start=1):
        routing.AddDisjunction([manager.NodeToIndex(node)], penalties.get(order.priority, 5_000_000))

    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    params.time_limit.seconds = 3
    solution = routing.SolveWithParameters(params)
    if not solution:
        raise HTTPException(422, "No feasible route")

    index = routing.Start(0)
    order_ids = []
    total_m = 0
    while not routing.IsEnd(index):
        next_index = solution.Value(routing.NextVar(index))
        from_node = manager.IndexToNode(index)
        to_node = manager.IndexToNode(next_index)
        total_m += matrix[from_node][to_node]
        if to_node != 0:
            order_ids.append(req.orders[to_node - 1].id)
        index = next_index

    total_km = total_m / 1000
    duration_min = max(10, round((total_km / 28) * 60 + len(order_ids) * 10))
    return {"orderIds": order_ids, "totalDistanceKm": round(total_km, 2), "totalDurationMin": duration_min, "engine": "ortools"}
