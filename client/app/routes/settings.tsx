import type { Route } from "./+types/home";
import { useState, useEffect, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router";
import { setTimer, getTimers } from "~/api/api";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Automaattisen avaajan asetukset" },
    { name: "description", content: "Automaattisen avaajan asetukset" },
  ];
}

export default function Settings() {
  // Example timers for testing
  const [timers, setTimers] = useState([
    { id: 1, time: "08:00", angle: 100 },
    { id: 2, time: "17:30", angle: 0 },
    { id: 3, time: "10:00", angle: 50 },
  ]);
  const [targetTemp, setTargetTemp] = useState<number>(22);
  const navigate = useNavigate();

  // Hae tallennettu arvo, kun komponentti ladataan
  useEffect(() => {
    const savedTemp = localStorage.getItem("targetTemp");
    if (savedTemp !== null) {
      setTargetTemp(Number(savedTemp));
    }
  }, []);

  const updateTimers = async () => { }

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
        <h2 className="text-xl font-semibold mb-4">Ajastimet</h2>
        <div className="space-y-4">
          <div>
            {timers && timers.length > 0 ? (
              <div className="mb-4">
                <div className="flex justify-between">
                  <p>Aika:</p>
                  <p className="text-center">Tila:</p>
                </div>
                <ul className="divide-y divide-gray-200">
                  {timers.flat().map((timer, index) => (
                    <li key={index} className="py-2 flex justify-between items-center">
                      <span>{`${timer.time}`}</span>
                      <span>{`${timer.angle}%`}</span>
                      <button 
                        onClick={() => {
                          const newTimers = [...timers];
                          newTimers.splice(index, 1);
                          setTimers(newTimers);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        Poista
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500 mb-3">Ei aktiivisia ajastimia</p>
            )}
            <input
              type="number"
              className="w-full p-2 border rounded-lg"
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
