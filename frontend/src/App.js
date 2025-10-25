import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [parkings, setParkings] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:3000/api/parkings")
      .then((res) => setParkings(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">서울시 주차장 정보</h1>
      <ul>
        {parkings.map((p) => (
          <li key={p.parking_id}>
            <strong>{p.name}</strong> — {p.address}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
