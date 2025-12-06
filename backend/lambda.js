import * as dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import serverlessExpress from "@vendia/serverless-express";
import app from "./app.js";

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.warn("⚠️ MONGO_URI is not set. Lambda may fail to connect to MongoDB.");
} else {
  try {
    await mongoose.connect(mongoUri);
    console.log("💾 MongoDB Connected successfully (Lambda)");
  } catch (err) {
    console.error("🔥 MongoDB connection error in Lambda:", err);
  }
}

export const handler = serverlessExpress({ app });
