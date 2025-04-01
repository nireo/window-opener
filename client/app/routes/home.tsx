import type { Route } from "./+types/home";
import { useState, useEffect, type ChangeEvent } from 'react';
import { Link } from 'react-router';
import { setAngle, getAngle } from "~/api/api";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Ikkunan kontrollit" },
    { name: "description", content: "Ikkunan kontrollit" },
  ];
}

const OUTSIDE_TEMP = 12;
const MAX_INSIDE_TEMP = 30;

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isError, setIsError] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [isAuto, setIsAuto] = useState(false);
  const [targetTemp, setTargetTemp] = useState<number | ''>('');

  const [insideTemp, setInsideTemp] = useState<number>(30);

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

  useEffect(() => {
    const interval = setInterval(() => {
      getAngle().then((angle) => {
        setSliderValue(angle);
        setIsOpen(angle > 0);
      });
    }, 500);
    return () => clearInterval(interval);
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

  useEffect(() => {
    if(!isAuto) return
    if (targetTemp === '') return

    const diff = insideTemp - targetTemp;
    const sliderValue = Math.max(0, Math.min(100, (diff) * 50));
    setSliderValue(sliderValue);
    setAngle(sliderValue);
    setIsOpen(sliderValue > 0);

  }, [insideTemp, isAuto, targetTemp]);

  useEffect(() => {
    const interval = setInterval(() => {
      const mult = (sliderValue || 100) / 100;
      if (isOpen) setInsideTemp((prev) => prev - mult * (prev - OUTSIDE_TEMP) / 100);
      else setInsideTemp((prev) => prev + (MAX_INSIDE_TEMP - prev) / 200);
    }, 250)
    
    return () => clearInterval(interval);
  }, [isOpen, sliderValue, setInsideTemp])
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6">
            <h1 className="text-2xl font-bold text-white text-center">Ikkuna 1</h1>
          </div>

          {/* Temperature Display */}
          <div className="flex justify-between items-center p-4 bg-blue-50">
            <div className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm">
              <span className="text-xs font-semibold text-blue-500">ULKONA</span>
              <span className="text-2xl font-bold">{OUTSIDE_TEMP}°C</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm">
              <span className="text-xs font-semibold text-blue-500">CO₂-taso</span>
              <span className="text-2xl font-bold">450 PPM</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm">
              <span className="text-xs font-semibold text-blue-500">SISÄLLÄ</span>
              <span className="text-2xl font-bold w-22 flex"><span className="flex-1">{insideTemp.toPrecision(3)}</span><span>°C</span></span>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="px-6 pt-4">
            <div className={`rounded-full py-2 px-4 text-center font-medium text-sm shadow-sm ${
              isError ? 'bg-red-100 text-red-800' :
              isMoving ? 'bg-amber-100 text-amber-800' :
              isAuto ? 'bg-blue-100 text-blue-800' :
              isOpen ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              <div className="flex items-center justify-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  isError ? 'bg-red-500' :
                  isMoving ? 'bg-amber-500' :
                  isAuto ? 'bg-blue-500' :
                  isOpen ? 'bg-green-500' :
                  'bg-gray-500'
                }`}></div>
                {isError ? 'Error' :
                 isMoving ? 'Liikkuu' :
                 isAuto ? `Automaattinen ohjaus (${targetTemp === '' ? 'ei asetettu' : `${targetTemp}°C`})` :
                 isOpen ? 'Auki' : 'Suljettu'}
              </div>
            </div>
          </div>

          {/* Slider Control */}
          <div className="px-6 py-5">
            <label htmlFor="window-slider" className="block text-sm font-medium text-gray-700 mb-2">
              Ikkunan aukinaisuus
            </label>
            <div className="relative mt-1">
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
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-500">0%</span>
                <span className="text-sm font-medium text-blue-600">{sliderValue.toFixed(0)}%</span>
                <span className="text-xs text-gray-500">100%</span>
              </div>
            </div>
          </div>

          {/* Temperature Settings */}
          <div className="px-6 py-4 border-t border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Lämpötila-asetukset</h2>
            <div className="space-y-4 mb-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Tavoitelämpötila (°C)
                </label>
                <input
                  type="number"
                  value={targetTemp}
                  onChange={handleTempChange}
                  onBlur={handleTempBlur}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  min={-20}
                  max={40}
                  step="0.5"
                  placeholder="Syötä lämpötila"
                />
              </div>
              
              {/* Auto Control Toggle */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  Automaattinen ohjaus {targetTemp === '' ? '(ei asetettu)' : `(${targetTemp}°C)`}
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
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Navigation and Control Buttons */}
          <div className="px-6 pb-6">
            <Link
              to="/settings"
              className="block w-full p-3 mb-4 bg-gray-100 text-gray-700 text-center rounded-lg font-medium hover:bg-gray-200 transition-colors hover:shadow-sm"
            >
              Ajastimet
            </Link>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleClose}
                className="flex items-center justify-center gap-2 p-3 bg-white border border-red-500 text-red-500 font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                disabled={isMoving || (!isOpen && sliderValue === 0)}
              >
                Sulje
              </button>
              <button
                onClick={handleOpen}
                className="flex items-center justify-center gap-2 p-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                disabled={isMoving || (isOpen && sliderValue === 100)}
              >
                Avaa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
