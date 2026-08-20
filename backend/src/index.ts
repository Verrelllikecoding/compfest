import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.routes";
import { userRouter } from "./routes/user.routes";
import { warehouseRouter, productRouter } from "./routes/warehouse.routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true, // wajib true supaya cookie refresh token bisa dikirim
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ success: true, message: "OK" }));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/warehouses", warehouseRouter);
app.use("/api/v1/products", productRouter);

// selalu paling akhir
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Opsera backend jalan di http://localhost:${PORT}`);
});
