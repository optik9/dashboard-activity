import React, { useState, useEffect } from "react";
import axios from "axios";
import { collection, getDocs } from "firebase/firestore";
import db from "./firebaseConfig"; // Importa tu configuración de Firebase

const Data2 = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [standupData, setStandupData] = useState([]);
  const [trackifyData, setTrackifyData] = useState([]);
  const [softwareEngineeringEmployees, setSoftwareEngineeringEmployees] = useState([]); // Usuarios con Department = "Software Engineering"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Función para obtener los empleados de la colección "uploadedDataEmployee" con Department = "Software Engineering"
  const fetchUploadedEmployees = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "uploadedDataEmployee"));
      const employees = querySnapshot.docs
        .filter((doc) => doc.data().Department === "Software Engineering") // Filtra solo los usuarios con Department = "Software Engineering"
        .map((doc) => doc.data().User); // Campo "User" en Firebase
      setSoftwareEngineeringEmployees(employees);
    } catch (err) {
      setError("Error fetching uploaded employees. Please try again.");
      console.error(err);
    }
  };

  // Función para obtener los datos de Standup
  const fetchStandupData = async () => {
    try {
      const response = await axios.get(
        `https://outcode-api-standup.vercel.app/api/standups`,
        {
          params: {
            startDate: startDate || "2025-01-17",
            endDate: endDate || "2025-01-17",
            location: "Peru", // Ubicación fija
          },
        }
      );
      setStandupData(response.data.data);
    } catch (error) {
      setError("Error fetching Standup data. Please try again.");
      console.error("Error fetching Standup data:", error);
    }
  };

  // Función para obtener los datos de Trackify
  const fetchTrackifyData = async () => {
    try {
      const response = await axios.get(
        `https://outcode-api-trackify.vercel.app/api/timesheets`,
        {
          params: {
            startDate: startDate || "2025-01-22",
            endDate: endDate || "2025-01-22",
          },
        }
      );
      setTrackifyData(response.data.data);
    } catch (error) {
      setError("Error fetching Trackify data. Please try again.");
      console.error("Error fetching Trackify data:", error);
    }
  };

  // Llama a las funciones para obtener los datos al cargar el componente o cambiar las fechas
  useEffect(() => {
    if (startDate && endDate) {
      setLoading(true);
      Promise.all([fetchUploadedEmployees(), fetchStandupData(), fetchTrackifyData()])
        .finally(() => setLoading(false));
    }
  }, [startDate, endDate]);

  // Función para contar registros por usuario
  const countRecords = () => {
    const userRecords = softwareEngineeringEmployees.map((user) => {
      const standupCount = standupData.filter((item) => item.user_name === user).length > 0 ? 1 : 0;
      const trackifyCount = trackifyData.filter((item) => item.user_name === user).length > 0 ? 1 : 0;
      return {
        user,
        standup: standupCount,
        trackify: trackifyCount,
      };
    });

    // Ordenar alfabéticamente por nombre de usuario
    userRecords.sort((a, b) => a.user.localeCompare(b.user));

    return userRecords;
  };

  // Obtener el número total de registros de Standup y Trackify
  const totalStandupRecords = new Set(
    standupData
      .filter((item) => softwareEngineeringEmployees.includes(item.user_name))
      .map((item) => item.user_name)
  ).size;

  const totalTrackifyRecords = new Set(
    trackifyData
      .filter((item) => softwareEngineeringEmployees.includes(item.user_name))
      .map((item) => item.user_name)
  ).size;

  // Calcular porcentajes de cumplimiento
  const totalUsers = softwareEngineeringEmployees.length;
  const standupPercentage = totalUsers > 0 ? ((totalStandupRecords * 100) / totalUsers).toFixed(2) : 0;
  const trackifyPercentage = totalUsers > 0 ? ((totalTrackifyRecords * 100) / totalUsers).toFixed(2) : 0;

  // Función para determinar el color del porcentaje
  const getPercentageColor = (percentage) => {
    if (percentage >= 97) return "text-green-600";
    if (percentage >= 90) return "text-yellow-500";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
        Employee Records Viewer
      </h1>

      {/* Filtro de fechas */}
      <div className="flex flex-col items-center gap-4 mb-6">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tarjetas de registros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700">Standup Records</h2>
          <p className="text-3xl font-bold text-blue-600">{totalStandupRecords}</p>
          <p className={`text-lg ${getPercentageColor(standupPercentage)}`}>
            {standupPercentage}% Compliance
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700">Trackify Records</h2>
          <p className="text-3xl font-bold text-blue-600">{totalTrackifyRecords}</p>
          <p className={`text-lg ${getPercentageColor(trackifyPercentage)}`}>
            {trackifyPercentage}% Compliance
          </p>
        </div>
      </div>

      {/* Tabla de usuarios y registros */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">#</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">User Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Standup Records</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Trackify Records</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {countRecords().map((record, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-700">{index + 1}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{record.user}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{record.standup}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{record.trackify}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mensajes de carga y error */}
      {loading && <p className="text-center text-gray-700 mt-4">Loading...</p>}
      {error && <p className="text-center text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default Data2;