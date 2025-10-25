import express from "express";
import { getAllParkings, getParkingById } from "../controllers/parkingController.js";
const router = express.Router();

router.get("/", getAllParkings);
router.get("/:id", getParkingById);

export default router;
