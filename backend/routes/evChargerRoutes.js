import express from "express";
import { getAllEvChargers } from "../controllers/evChargerController.js";
const router = express.Router();

router.get("/", getAllEvChargers);

export default router;
