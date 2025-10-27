import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// 기존 라우트
import parkingRoutes from "./routes/parkingRoutes.js";
import evChargerRoutes from "./routes/evChargerRoutes.js";

// [ 1. 신규 라우트 3개 import ]
import authRoutes from "./routes/authRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

// 스케줄러
import startScheduler from "./utils/scheduler.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// 몽고 DB 연결
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("💾 MongoDB Connected successfully");
    // DB 연결 성공 시 스케줄러 시작
    startScheduler(); 
  })
  .catch(err => console.error("- MongoDB connection error:", err));

// [ 2. 신규 라우트 3개 등록 ]
app.use("/api/auth", authRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/reviews", reviewRoutes);

// 기존 라우트 연결
app.use("/api/parkings", parkingRoutes); // 주차장
app.use("/api/evchargers", evChargerRoutes); // 전기차 충전소

// 기본 라우트
app.get('/', (req, res) => {
  res.send('🚗 Seoul Smart Parking API Server is running!');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚗 Server running on port ${PORT}`));