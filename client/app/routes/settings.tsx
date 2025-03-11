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
  // Example timers for testing
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
    <div className="max-w-md mx-auto p-6 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Ikkunan ajastimet</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Ajastimet</h2>
        <div className="space-y-4">
          <div>
            {timers && timers.length > 0 ? (
              <div className="mb-4">
                <div className="flex justify-between">
                  <p className="text-left">Aika:</p>
                  <p className="text-center ml-10">Tila:</p>
                  <span className="invisible">Placeholder</span>
                </div>
                <ul className="divide-y divide-gray-200">
                  {timers.map((timer, index) => (
                    <li key={index} className="py-2 flex justify-between items-center">
                      <span>{`${(new Date(timer.time)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</span>
                      <span>{`${timer.display_angle}%`}</span>
                      <button
                        onClick={() => {
                          deleteTimer(timer.id);
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

            <div className="grid grid-cols-3 gap-4 mb-4">
              <form className="flex items-center">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input type="time" id="time" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    required />
                </div>
              </form>
              <form className="max-w-xs mx-auto">
                <div className="relative flex items-center max-w-[8rem]">
                  <button type="button" id="decrement-button" data-input-counter-decrement="angle-input" className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                    onClick={handleDecrement}>
                    <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h16" />
                    </svg>
                  </button>
                  <input type="text" id="angle-input" data-input-counter aria-describedby="helper-text-explanation" className="bg-gray-50 border-x-0 border-gray-300 h-11 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Tila %" required />
                  <button type="button" id="increment-button" data-input-counter-increment="angle-input" className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                    onClick={handleIncrement}>
                    <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 1v16M1 9h16" />
                    </svg>
                  </button>
                </div>
              </form>
              <button
                onClick={handleAddTimer}
                className="flex items-center justify-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 p-2.5">
                Lisää ajastin
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-4 flex">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 p-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
          Takaisin
        </Link>
      </div>
    </div>
  );
}
