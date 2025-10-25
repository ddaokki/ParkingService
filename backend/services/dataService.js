import axios from "axios";

const SEOUL_API_URL = process.env.SEOUL_API_URL; // 예: https://openapi.seoul.go.kr:8088/{KEY}/json/GetParkInfo/1/1000/

export const fetchParkingData = async () => {
  try {
    const response = await axios.get(SEOUL_API_URL);
    return response.data.GetParkInfo.row.map((item, idx) => ({
      parking_id: idx,
      name: item.PARKING_NAME,
      address: item.ADDR,
      lat: parseFloat(item.LAT),
      lon: parseFloat(item.LNG),
      type: item.PARKING_TYPE_NM,
      pay_type: item.PAY_YN,
      base_fee: item.RATES,
      add_fee: item.ADD_RATES,
    }));
  } catch (error) {
    console.error("API 호출 실패:", error);
    return [];
  }
};
