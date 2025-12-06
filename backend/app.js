// backend/app.js
import express from "express";
import cors from "cors";

// Routes
import parkingRoutes from "./routes/parkingRoutes.js";
import evChargerRoutes from "./routes/evChargerRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

const app = express();

// Global middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/parkings", parkingRoutes);
app.use("/api/evchargers", evChargerRoutes);

// Health check / root
app.get("/", (req, res) => {
  res.send("🚗 Seoul Smart Parking API Server is running! (Lambda / Express)");
});

export default app;
