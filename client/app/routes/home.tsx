import type { Route } from "./+types/home";
import { useState, useEffect } from 'react';
import { Link } from 'react-router';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Ikkunan kontrollit" },
    { name: "description", content: "Ikkunan kontrollit" },
  ];
}

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isError, setIsError] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [isAuto, setIsAuto] = useState(false);
  const [targetTemp, setTargetTemp] = useState<number>(22);

  useEffect(() => {
    const savedTemp = localStorage.getItem("targetTemp");
    const savedSliderValue = localStorage.getItem("sliderValue");
    const savedIsOpen = localStorage.getItem("isOpen");
    const savedIsAuto = localStorage.getItem("isAuto");
    if (savedTemp !== null) {
      setTargetTemp(Number(savedTemp));
    }
    if (savedSliderValue !== null) {
      const value = Number(savedSliderValue);
      setSliderValue(value);
      setIsOpen(value > 0);
    }
    if (savedIsOpen !== null) {
      setIsOpen(savedIsOpen === 'true');
    }
    if (savedIsAuto !== null && savedIsAuto === 'true') {
      setIsAuto(true);
    }
  }, []);

  const handleOpen = () => {
    if (isError) return;
    setIsAuto(false);
    setIsMoving(true);
    setSliderValue(100);
    setTimeout(() => {
      setIsOpen(true);
      setIsMoving(false);
      localStorage.setItem("sliderValue", "100");
      localStorage.setItem("isOpen", "true");
    }, 2000);
  };

  const handleClose = () => {
    if (isError) return;
    setIsAuto(false);
    setIsMoving(true);
    setSliderValue(0);
    setTimeout(() => {
      setIsOpen(false);
      setIsMoving(false);
      localStorage.setItem("sliderValue", "0");
      localStorage.setItem("isOpen", "false");
    }, 2000);
  };

  const snapToValue = (value: number) => {
    const snapPoints = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    return snapPoints.reduce((prev, curr) => Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev);
  };  

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAuto(false);
    const snapped = snapToValue(Number(e.target.value));
    setSliderValue(snapped);
    //setSliderValue(Number(e.target.value));
  };

  const handleSliderRelease = () => {
    if (isError) return;
    setIsAuto(false);
    setIsMoving(true);
    setTimeout(() => {
      setIsOpen(sliderValue > 0);
      setIsMoving(false);
      localStorage.setItem("sliderValue", sliderValue.toString());
      localStorage.setItem("isOpen", (sliderValue > 0).toString());
    }, 2000);
  };

  const handleAutoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAuto(e.target.checked);
    localStorage.setItem("isAuto", e.target.checked.toString());
  };

  return (
    <div className="max-w-md mx-auto p-6 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Ikkuna 1</h1>
      <div className="mb-6 text-center">
        <span className={`inline-block px-4 py-2 rounded-full ${isError ? 'bg-red-100 text-red-800' :
          isMoving ? 'bg-yellow-100 text-yellow-800' :
            isAuto ? 'bg-blue-100 text-blue-800' :
            isOpen ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
          }`}>
          Status: {
            isError ? 'Error' :
            isMoving ? 'Liikkuu' :
            isAuto ? `Automaattinen ohjaus (${targetTemp}°C)` :
            isOpen ? 'Auki' :
                  'Suljettu'
          }
        </span>
      </div>
      <div className="mb-6 text-center">
        <img src="../public/window.jpg" alt="Window" className="mx-auto mb-4" />
      </div>
      <div className="mb-6 text-center">
        <label htmlFor="window-slider" className="block text-sm font-medium text-gray-700 mb-1">
          Ikkunan aukinaisuus:
        </label>
        <input 
          id="window-slider"
          aria-label="Ikkunan avaaminen"
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          disabled={isMoving || isError}
          onChange={handleSliderChange}
          onMouseUp={handleSliderRelease}
          onTouchEnd={handleSliderRelease}
          className="w-full"
        />
        <span className="block text-sm font-medium text-gray-700 mt-2">
          {sliderValue}%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <button
          onClick={handleClose}
          disabled={!isOpen || isMoving || isError}
          className="flex items-center justify-center gap-2 p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sulje
        </button>
        <button
          onClick={handleOpen}
          disabled={sliderValue === 100 || isMoving || isError}
          className="flex items-center justify-center gap-2 p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Avaa
        </button>
      </div>
      <div className="flex items-center justify-between">
        <Link
          to="/settings"
          className={`block w-full p-4 bg-gray-500 text-white text-center rounded-lg hover:bg-gray-600 transition-colors"
          ${isMoving ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
          aria-disabled={isMoving}
          >
          Asetukset
          
        </Link>
        <div className="ml-4">
          <label htmlFor="auto-control" className="block text-sm font-medium text-gray-700 mb-1">
            Automaattinen ohjaus ({targetTemp}°C):
          </label>
          <input 
            id="auto-control"
            type="checkbox"
            checked={isAuto}
            onChange={handleAutoChange}
            disabled={isMoving}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
