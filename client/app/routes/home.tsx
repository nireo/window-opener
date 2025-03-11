import type { Route } from "./+types/home";
import { useState, useEffect, type ChangeEvent } from 'react';
import { Link } from 'react-router';
import { setAngle } from "~/api/api";

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
  const [targetTemp, setTargetTemp] = useState<number | ''>('');

  useEffect(() => {
    const savedTemp = localStorage.getItem("targetTemp");
    const savedSliderValue = localStorage.getItem("sliderValue");
    const savedIsOpen = localStorage.getItem("isOpen");
    const savedIsAuto = localStorage.getItem("isAuto");
    if (savedTemp !== null) {
      setTargetTemp(savedTemp === '' ? '' : Number(savedTemp));
    }
    if (savedSliderValue !== null) {
      const value = Number(savedSliderValue);
      setSliderValue(value);
      setIsOpen(value > 0);
    }
    if (savedIsOpen !== null) {
      setIsOpen(savedIsOpen === 'true');
    }
    if (savedIsAuto !== null && savedIsAuto === 'true' && savedTemp !== null && savedTemp !== '') {
      setIsAuto(true);
    }
  }, []);


  const handleOpen = () => {
    if (isError) return;
    setIsAuto(false);
    setSliderValue(100);
    setAngle(100);
    setIsOpen(true);
    localStorage.setItem("sliderValue", "100");
    localStorage.setItem("isOpen", "true");
    localStorage.setItem("isAuto", "false");
  };

  const handleClose = () => {
    if (isError) return;
    setIsAuto(false);
    setIsOpen(false);
    //setIsMoving(true);
    setSliderValue(0);
    setAngle(0)
    localStorage.setItem("sliderValue", "0");
    localStorage.setItem("isOpen", "false");
    localStorage.setItem("isAuto", "false");
  };

  const snapToValue = (value: number) => {
    const snapPoints = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    return snapPoints.reduce((prev, curr) => Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev);
  };  

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAuto(false);
    const snapped = snapToValue(Number(e.target.value));
    setSliderValue(snapped);
  };

  const handleSliderRelease = () => {
    if (isError) return;
    setIsAuto(false);
    //setIsMoving(true);
    setAngle(sliderValue);
    setIsOpen(sliderValue > 0);
    localStorage.setItem("sliderValue", sliderValue.toString());
    localStorage.setItem("isOpen", (sliderValue > 0).toString());
    localStorage.setItem("isAuto", "false");
  };

  const handleAutoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAuto(e.target.checked);
    localStorage.setItem("isAuto", e.target.checked.toString());
  };

  const handleTempChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty input
    if (inputValue === '') {
      setTargetTemp('');
      setIsAuto(false);
      localStorage.setItem("targetTemp", '');
      return;
    }
    
    const value = Math.round(Number(inputValue) * 10) / 10;
    if (value < -20) {
      setTargetTemp(-20);
    }
    else if (value > 40) {
      setTargetTemp(40);
    }
    else {
      setTargetTemp(value);
    }
    localStorage.setItem("targetTemp", inputValue === '' ? '' : value.toString());
  };

  const handleTempBlur = () => {
    // Skip validation for empty values
    if (targetTemp === '') {
      localStorage.setItem("targetTemp", '');
      return;
    }
    
    // Enforce limits when user finishes input
    if (targetTemp < -20) setTargetTemp(-20);
    if (targetTemp > 40) setTargetTemp(40);
    localStorage.setItem("targetTemp", targetTemp.toString());
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
            isAuto ? `Automaattinen ohjaus (${targetTemp === '' ? 'ei asetettu' : `${targetTemp}°C`})` :
            isOpen ? 'Auki' :
                  'Suljettu'
          }
        </span>
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
          className="flex items-center justify-center gap-2 p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sulje
        </button>
        <button
          onClick={handleOpen}
          className="flex items-center justify-center gap-2 p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Avaa
        </button>
      </div>
      <h2 className="text-xl font-semibold mb-4">Lämpötila-asetukset</h2>
        <div className="space-y-4 mb-8">
          <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tavoitelämpötila (°C)
        </label>
        <input
          type="number"
          value={targetTemp}
          onChange={handleTempChange}
          onBlur={handleTempBlur}
          className="w-full p-2 border rounded-lg"
          min={-20}
          max={40}
          step="0.5"
          placeholder="Syötä lämpötila"
        />
          </div>
        </div>
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-10 mb-4">
          <span className="text-sm font-medium text-gray-700">
            Automaattinen ohjaus ({targetTemp === '' ? 'ei asetettu' : `${targetTemp}°C`})
          </span>
          <label className="inline-flex items-center cursor-pointer">
            <input 
              id="auto-control"
              type="checkbox"
              checked={isAuto}
              onChange={handleAutoChange}
              disabled={isMoving || targetTemp === ''}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
          </label>
        </div>
      </div>
      <div className="mb-6 text-center">
        <Link
          to="/settings"
          className={`block w-full p-4 bg-gray-500 text-white text-center rounded-lg hover:bg-gray-600 transition-colors"
          ${isMoving ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
          aria-disabled={isMoving}
          >
          Ajastimet
          
        </Link>
        </div>
        {/* <div className="mb-6 text-center">
          <img
            src="/window.jpg"
            alt="Window"
            className="mx-auto w-48 h-48 object-contain"
          />
        </div> */}
    </div>
  );
}
