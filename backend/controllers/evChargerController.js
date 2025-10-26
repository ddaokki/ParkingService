import { findEvCharger} from "../services/evChargerService.js";

export const getAllEvChargers = async (req, res) => {
  try {
    const data = await findEvCharger();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "데이터 조회 실패", error: error.message });
  }
};
