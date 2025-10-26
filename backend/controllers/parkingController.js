import { findParkingByCode, findParkings } from "../services/parkingService.js";

export const getAllParkings = async (req, res) => {
  
  const { chgd_free_se } = req.query;
  const filters = {};

  // 유료여부
  if(chgd_free_se) {
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
