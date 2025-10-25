import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import parkingRoutes from "./routes/parkingRoutes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// 라우트 연결
app.use("/api/parkings", parkingRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚗 Server running on port ${PORT}`));
