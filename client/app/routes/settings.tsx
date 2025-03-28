import type { Route } from "./+types/home";
import { useState, useEffect, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router";
import { setTimer, getTimers, deleteTimer } from "~/api/api";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Automaattisen avaajan asetukset" },
    { name: "description", content: "Automaattisen avaajan asetukset" },
  ];
}

export default function Settings() {
  const [timers, setTimers] = useState<any[]>([]);
  const fetchTimers = async () => {
    const timers = await getTimers();
    setTimers(timers);
  };

  useEffect(() => {
    fetchTimers(); // Initial fetch

    // Set up polling every second
    const intervalId = setInterval(() => {
      fetchTimers();
    }, 1000);

    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  const [targetTemp, setTargetTemp] = useState<number>(22);
  const navigate = useNavigate();

  // Hae tallennettu arvo, kun komponentti ladataan
  useEffect(() => {
    const savedTemp = localStorage.getItem("targetTemp");
    if (savedTemp !== null) {
      setTargetTemp(Number(savedTemp));
    }
  }, []);

  const handleAddTimer = () => {
    const time = document.getElementById("time") as HTMLInputElement;
    const angle = document.getElementById("angle-input") as HTMLInputElement;

    const currentTime = new Date();
    const inputTime = new Date();
    const [hours, minutes] = time.value.split(":").map(Number);
    inputTime.setHours(hours, minutes, 0, 0);

    if (inputTime <= currentTime) {
      inputTime.setDate(inputTime.getDate() + 1);
    }

    const angleValue = Math.max(0, Math.min(100, Number(angle.value)));

    setTimer(inputTime, angleValue);
  }

  const handleTempChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTargetTemp(Number(e.target.value));
  };

  const handleSave = () => {
    localStorage.setItem('targetTemp', targetTemp.toString());
    navigate("/"); // Navigoi takaisin kotiruutuun
  };

  const handleIncrement = () => {
    const angleInput = document.getElementById("angle-input") as HTMLInputElement;
    let value = parseInt(angleInput.value) || 0;
    value = Math.min(100, value + 10);
    angleInput.value = value.toString();
  };

  const handleDecrement = () => {
    const angleInput = document.getElementById("angle-input") as HTMLInputElement;
    let value = parseInt(angleInput.value) || 0;
    value = Math.max(0, value - 10);
    angleInput.value = value.toString();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6">
            <h1 className="text-2xl font-bold text-white text-center">Ikkunan ajastimet</h1>
          </div>

          {/* Timers Section */}
          <div className="px-6 py-5">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Ajastetut toiminnot</h2>
            
            {timers && timers.length > 0 ? (
              <div className="mb-6 bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between text-sm font-medium text-blue-700 mb-2 px-2">
                  <p>Aika</p>
                  <p>Tila</p>
                  <p>Toiminto</p>
                </div>
                <ul className="divide-y divide-blue-100">
                  {timers.map((timer, index) => (
                    <li key={index} className="py-3 flex justify-between items-center px-2">
                      <span className="font-medium">{`${(new Date(timer.time)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</span>
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold py-1 px-2 rounded-full fixed left-48/100">{`${timer.display_angle}%`}</span>
                      <button
                        onClick={() => {
                          deleteTimer(timer.id);
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mb-6 text-center py-8 bg-gray-50 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">Ei aktiivisia ajastimia</p>
              </div>
            )}

            {/* Add Timer Section */}
            <div className="border-t border-gray-100 pt-5 pb-3">
              <h3 className="text-md font-medium text-gray-700 mb-3">Lisää uusi ajastin</h3>
              <div className="grid grid-cols-3 gap-3">
                {/* Time Input */}
                <div className="relative">
                  <label htmlFor="time" className="block text-xs font-medium text-gray-500 mb-1">
                    Aika
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" aria-hidden="false" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input 
                      type="time" 
                      id="time" 
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-7 pe-4 py-2.5"
                      required 
                    />
                  </div>
                </div>
                
                {/* Angle Input */}
                <div>
                  <label htmlFor="angle-input" className="block text-xs font-medium text-gray-500 mb-1">
                    Tila %
                  </label>
                  <div className="relative flex items-center">
                    <button 
                      type="button" 
                      id="decrement-button" 
                      onClick={handleDecrement}
                      className="bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-s-lg p-2 h-10 focus:ring-blue-500 focus:ring-1 focus:outline-none"
                    >
                      <svg className="w-3 h-3 text-gray-900" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h16" />
                      </svg>
                    </button>
                    <input 
                      type="text" 
                      id="angle-input" 
                      className="bg-gray-50 border-y border-gray-300 h-10 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5"
                      placeholder="0" 
                      defaultValue="0"
                      required 
                    />
                    <button 
                      type="button" 
                      id="increment-button"
                      onClick={handleIncrement}
                      className="bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-e-lg p-2 h-10 focus:ring-blue-500 focus:ring-1 focus:outline-none"
                    >
                      <svg className="w-3 h-3 text-gray-900" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Add Timer Button */}
                <div>
                  <label className="invisible block text-xs font-medium text-gray-500 mb-1">
                    Toiminto
                  </label>
                  <button
                    onClick={handleAddTimer}
                    className="w-full h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-300"
                  >
                    Lisää
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Button */}
          <div className="px-6 pb-6">
            <Link
              to="/"
              className="block w-full p-3 bg-gray-100 text-gray-700 text-center rounded-lg font-medium hover:bg-gray-200 transition-colors hover:shadow-sm"
            >
              Takaisin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
