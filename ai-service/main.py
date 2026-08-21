import logging

from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Stock Forecast AI API",
    version="1.0.0"
)

model = joblib.load("model/stock_forecast_model.pkl")


class ForecastInput(BaseModel):
    day: int
    dow: int
    month: int

    lag_1: float
    lag_7: float
    lag_14: float
    lag_30: float

    rolling_7: float
    rolling_30: float

    category_code: int
    product_code: int
    warehouse_code: int


@app.get("/")
def root():
    return {
        "message": "Stock Forecast AI API is running"
    }


@app.post("/predict")
def predict(data: ForecastInput):
    try:
        raw_features = {
            "day": data.day,
            "dow": data.dow,
            "month": data.month,

            "lag_1": data.lag_1,
            "lag_7": data.lag_7,
            "lag_14": data.lag_14,
            "lag_30": data.lag_30,

            "rolling_7": data.rolling_7,
            "rolling_30": data.rolling_30,

            "category_code": data.category_code,
            "product_code": data.product_code,
            "warehouse_code": data.warehouse_code
        }

        expected_features = list(model.feature_names_in_)

        features = pd.DataFrame(
            [[raw_features[name] for name in expected_features]],
            columns=expected_features
        )

        prediction = model.predict(features)[0]

        return {
            "predicted_demand": round(float(prediction), 2)
        }

    except Exception:
        logger.exception("Stock forecast prediction failed")

        return {
            "error": "Prediction failed"
        }
