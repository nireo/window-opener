import type { Route } from "./+types/home";
import { useState } from 'react';
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

  const handleOpen = () => {
    if (isError) return;
    setIsMoving(true);
    setSliderValue(100);
    setTimeout(() => {
      setIsOpen(true);
      setIsMoving(false);
    }, 2000);
  };

  const handleClose = () => {
    if (isError) return;
    setIsMoving(true);
    setSliderValue(0);
    setTimeout(() => {
      setIsOpen(false);
      setIsMoving(false);
    }, 2000);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderValue(Number(e.target.value));
  };

  const handleSliderRelease = () => {
    if (isError) return;
    setIsMoving(true);
    setTimeout(() => {
      setIsOpen(sliderValue > 0);
      setIsMoving(false);
    }, 2000);
  };


  return (
    <div className="max-w-md mx-auto p-6 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Ikkuna 1</h1>
      <div className="mb-6 text-center">
        <span className={`inline-block px-4 py-2 rounded-full ${isError ? 'bg-red-100 text-red-800' :
          isMoving ? 'bg-yellow-100 text-yellow-800' :
            isOpen ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
          }`}>
          Status: {
            isError ? 'Error' :
              isMoving ? 'Liikkuu' :
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
          disabled={isOpen || isMoving || isError}
          className="flex items-center justify-center gap-2 p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Avaa
        </button>
      </div>
      <Link
        to="/settings"
        className="block w-full p-4 bg-gray-500 text-white text-center rounded-lg hover:bg-gray-600 transition-colors"
      >
        Asetukset
      </Link>
    </div>
  );
}
