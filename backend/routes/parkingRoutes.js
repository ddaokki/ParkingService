import express from "express";
import { getAllParkings, getParkingById, getNearbyParkings } from "../controllers/parkingController.js";
const router = express.Router();

router.get("/", getAllParkings);
router.get("/:code", getParkingById);
router.get("/nearby", getNearbyParkings);

export default router;
