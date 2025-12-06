// backend/server.js
// Local development entrypoint (not used by AWS Lambda)
import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";
import startScheduler from "./utils/scheduler.js";

dotenv.config();

const PORT = process.env.PORT || 8080;

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("💾 MongoDB Connected successfully (local server)");

    // Scheduler only makes sense on a long-running server
    try {
      startScheduler();
      console.log("⏰ Scheduler started");
    } catch (err) {
      console.error("Scheduler start error:", err);
    }

    app.listen(PORT, () => {
      console.log(`🚗 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("🔥 MongoDB connection error:", err);
  }
};

start();
