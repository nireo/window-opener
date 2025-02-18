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

  const handleOpen = () => {
    if (isError) return;
    setIsMoving(true);
    setTimeout(() => {
      setIsOpen(true);
      setIsMoving(false);
    }, 2000);
  };

  const handleClose = () => {
    if (isError) return;
    setIsMoving(true);
    setTimeout(() => {
      setIsOpen(false);
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
      <div className="grid grid-cols-2 gap-4 mb-4">
        <button
          onClick={handleOpen}
          disabled={isOpen || isMoving || isError}
          className="flex items-center justify-center gap-2 p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Avaa
        </button>
        <button
          onClick={handleClose}
          disabled={!isOpen || isMoving || isError}
          className="flex items-center justify-center gap-2 p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sulje
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
