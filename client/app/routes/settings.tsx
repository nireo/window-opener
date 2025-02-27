import type { Route } from "./+types/home";
import { useState, useEffect, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Automaattisen avaajan asetukset" },
    { name: "description", content: "Automaattisen avaajan asetukset" },
  ];
}

export default function Settings() {
  const [targetTemp, setTargetTemp] = useState<number>(22);
  const navigate = useNavigate();

  // Hae tallennettu arvo, kun komponentti ladataan
  useEffect(() => {
    const savedTemp = localStorage.getItem("targetTemp");
    if (savedTemp !== null) {
      setTargetTemp(Number(savedTemp));
    }
  }, []);

  const handleTempChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTargetTemp(Number(e.target.value));
  };

  const handleSave = () => {
    localStorage.setItem('targetTemp', targetTemp.toString());
    navigate("/"); // Navigoi takaisin kotiruutuun
  };

  return (
    <div className="max-w-md mx-auto p-6 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Ikkunan asetukset</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Lämpötila-asetukset</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tavoitelämpötila (°C)
            </label>
            <input
              type="number"
              value={targetTemp}
              onChange={handleTempChange}
              className="w-full p-2 border rounded-lg"
              min="-20"
              max="40"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 p-4 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Tallenna asetukset
        </button>
        <Link
          to="/"
          className="flex items-center justify-center gap-2 p-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Takaisin
        </Link>
      </div>
    </div>
  );
}
