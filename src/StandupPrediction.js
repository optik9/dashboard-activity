import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, subDays } from "date-fns";
import { collection, getDocs } from "firebase/firestore";
import db from "./firebaseConfig";

const StandupPrediction = () => {
  const [data, setData] = useState([]);
  const [softwareEngineeringEmployees, setSoftwareEngineeringEmployees] = useState([]);
  const [usersAtRisk, setUsersAtRisk] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState("Peru");

  // Función para obtener los empleados de Firebase
  const fetchUploadedEmployees = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "uploadedDataEmployee"));
      if (querySnapshot.empty) {
        setError("No employees found in Firebase.");
        return;
      }

      const softwareEngineeringUsers = querySnapshot.docs
        .filter((doc) => doc.data().Department === "Software Engineering")
        .map((doc) => doc.data().User);

      if (softwareEngineeringUsers.length === 0) {
        setError("No Software Engineering employees found.");
        return;
      }

      setSoftwareEngineeringEmployees(softwareEngineeringUsers);
    } catch (err) {
      setError("Error fetching employees from Firebase. Please check your connection.");
      console.error("Firebase Error:", err);
    }
  };

  // Función para obtener los datos de Standup de la API
  const fetchStandupData = async () => {
    try {
      setLoading(true);

      // Asegúrate de que los parámetros estén definidos y en el formato correcto
      const startDate = format(subDays(new Date(), 30), "yyyy-MM-dd"); // Últimos 30 días
      const endDate = format(new Date(), "yyyy-MM-dd");

      const response = await axios.get(
        `https://outcode-api-standup.vercel.app/api/standups`,
        {
          params: {
            startDate, // Formato YYYY-MM-DD
            endDate,   // Formato YYYY-MM-DD
            location,  // Asegúrate de que location esté definido
          },
        }
      );

      if (!response.data || !response.data.data) {
        setError("No standup data found in the API response.");
        return;
      }

      console.log("API Data:", response.data.data); // Depuración: Ver datos de la API
      setData(response.data.data);

      // Calcular métricas para predecir usuarios en riesgo
      const userMetrics = calculateUserMetrics(response.data.data, softwareEngineeringEmployees);
      console.log("User Metrics:", userMetrics); // Depuración: Ver métricas calculadas
      const atRiskUsers = predictUsersAtRisk(userMetrics);
      setUsersAtRisk(atRiskUsers);
    } catch (error) {
      setError("Error fetching standup data. Please check the API or try again later.");
      console.error("API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para calcular métricas de los usuarios
  const calculateUserMetrics = (standupData, users) => {
    return users.map((user) => {
      // Filtrar los registros de standup para el usuario actual
      const userStandups = standupData.filter((item) => item.user_name === user);

      // Obtener la fecha del último standup
      const lastStandupDate = userStandups.length > 0 ? new Date(userStandups[userStandups.length - 1].date) : null;

      // Calcular días desde el último standup
      const daysSinceLastStandup = lastStandupDate ? Math.floor((new Date() - lastStandupDate) / (1000 * 60 * 60 * 24)) : Infinity;

      return {
        user,
        daysSinceLastStandup,
      };
    });
  };

  // Función para predecir usuarios en riesgo
  const predictUsersAtRisk = (userMetrics) => {
    const thresholdDays = 7; // Umbral de días sin registro para considerar en riesgo
    return userMetrics
      .filter((metric) => metric.daysSinceLastStandup > thresholdDays)
      .map((metric) => ({
        user: metric.user,
        status: "En Riesgo", // Indicador binario
      }));
  };

  // Llama a las funciones para obtener los empleados y los datos de Standup al cargar el componente
  useEffect(() => {
    fetchUploadedEmployees();
  }, []);

  useEffect(() => {
    if (softwareEngineeringEmployees.length > 0) {
      fetchStandupData();
    }
  }, [softwareEngineeringEmployees, location]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Standup Prediction</h1>
      
      {loading && <p className="text-gray-600">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Selector de ubicación */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Location:</label>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
        >
          <option value="Peru">Peru</option>
          <option value="Nepal">Nepal</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <h2 className="text-xl font-bold text-gray-700 mb-4">
          Users at Risk of Missing Standup (Last 7 Days)
        </h2>
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-red-500 text-white">
            <tr>
              <th className="px-4 py-2">User Name</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {usersAtRisk.length > 0 ? (
              usersAtRisk.map((user, index) => (
                <tr
                  key={index}
                  className={`border-b ${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <td className="px-4 py-2 text-gray-700">{user.user}</td>
                  <td className="px-4 py-2 text-gray-700">{user.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="2"
                  className="text-center px-4 py-2 text-gray-500"
                >
                  No users are at risk of missing their standup.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StandupPrediction;