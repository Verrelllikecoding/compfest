import { Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage.jsx";
import LoginPage from "./LoginPage.jsx";
import SignUpPage from "./SignUpPage.jsx";
import DashboardPage from "./DashboardPage.jsx";
import SmartSchedulingPage from "./SmartSchedulingPage.jsx";
import WarehouseManagementPage from "./WarehouseManagementPage.jsx";
import RouteOptimizationPage from "./RouteOptimizationPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/scheduling" element={<SmartSchedulingPage />} />
      <Route path="/warehouse" element={<WarehouseManagementPage />} />
      <Route path="/routes" element={<RouteOptimizationPage />} />
    </Routes>
  );
}

export default App;