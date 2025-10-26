import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import parkingRoutes from "./routes/parkingRoutes.js";
import evChargerRoutes from "./routes/evChargerRoutes.js";
import startScheduler from "./utils/scheduler.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// 몽고 DB 연결하고
// 각 데이터 API 를 통한 DB에 데이터 업로드 및
// 주기적 Fetch 기능
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("💾 MongoDB Connected successfully");
    startScheduler(); 
  })
  .catch(err => console.error("- MongoDB connection error:", err));

// 라우트 연결
app.use("/api/parkings", parkingRoutes);
//app.use("/api/update");
app.use("/api/evchargers", evChargerRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.send('🚗 Seoul Smart Parking API Server is running!');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚗 Server running on port ${PORT}`));
