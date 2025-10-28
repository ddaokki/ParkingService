import { findParkingByCode, findParkings } from "../services/parkingService.js";
import Parking from "../models/parking.js";

export const getAllParkings = async (req, res) => {

  const { chgd_free_se } = req.query;
  const filters = {};

  // 유료여부
  if (chgd_free_se) {
    filters.CHGD_FREE_SE = chgd_free_se;
  }

  try {
    const data = await findParkings(filters);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "데이터 조회 실패", error: error.message });
  }
};

export const getParkingById = async (req, res) => {
  const { code } = req.params;
  try {
    const data = await findParkingByCode(code);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "상세 조회 실패", error: error.message });
  }
};

export const getNearbyParkings = async (req, res) => {
  try {
    const { lat, lon, maxDistance = 2000 } = req.query; // 2000m = 2km

    if (!lat || !lon) {
      return res.status(400).json({ error: "lat, lon 쿼리 파라미터 필요" });
    }

    const nearby = await Parking.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [parseFloat(lon), parseFloat(lat)] },
          distanceField: "distance",
          maxDistance: parseInt(maxDistance), // m 단위
          spherical: true,
        },
      },
      { $limit: 10 },
    ]);

    res.json(nearby);
  } catch (err) {
    console.error("❌ 근처 주차장 조회 오류:", err);
    res.status(500).json({ error: "서버 내부 오류" });
  }
};