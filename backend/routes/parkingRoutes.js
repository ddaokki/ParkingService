import express from "express";
import { getAllParkings, getParkingById } from "../controllers/parkingController.js";
const router = express.Router();

router.get("/", getAllParkings);
router.get("/:code", getParkingById);
router.get("/nearby", getNearbyParkings);

export default router;
