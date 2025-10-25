import { fetchParkingData } from "../services/dataService.js";

export const getAllParkings = async (req, res) => {
  try {
    const data = await fetchParkingData();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "데이터 조회 실패", error: error.message });
  }
};

export const getParkingById = async (req, res) => {
  try {
    const data = await fetchParkingData();
    const parking = data.find((p) => p.parking_id === parseInt(req.params.id));
    res.status(200).json(parking);
  } catch (error) {
    res.status(500).json({ message: "상세 조회 실패", error: error.message });
  }
};
