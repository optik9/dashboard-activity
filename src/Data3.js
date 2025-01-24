import React, { useState, useEffect } from "react";
import axios from "axios";
import { collection, getDocs } from "firebase/firestore";
import db from "./firebaseConfig"; // Importa tu configuración de Firebase

const Data3 = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timesheets, setTimesheets] = useState([]);
  const [uploadedEmployees, setUploadedEmployees] = useState([]); // Lista completa de usuarios
  const [mandatoryEmployees, setMandatoryEmployees] = useState([]); // Lista de usuarios con Mandatory = 1
  const [usersWithoutRecords, setUsersWithoutRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Función para obtener los empleados de la colección "uploadedDataEmployee"
  const fetchUploadedEmployees = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "uploadedDataEmployee"));
      const employees = querySnapshot.docs.map((doc) => doc.data().User); // Campo "User" en Firebase
      const mandatoryUsers = querySnapshot.docs
        .filter((doc) => doc.data().Mandatory === 1) // Filtra solo los usuarios con Mandatory = 1
        .map((doc) => doc.data().User); // Campo "User" en Firebase

      setUploadedEmployees(employees); // Lista completa de usuarios
      setMandatoryEmployees(mandatoryUsers); // Lista de usuarios con Mandatory = 1
    } catch (err) {
      setError("Error fetching uploaded employees. Please try again.");
      console.error(err); // Mostrar el error en la consola para depuración
    }
  };

  // Llama a la función para obtener los empleados al cargar el componente
  useEffect(() => {
    fetchUploadedEmployees();
  }, []);

  const fetchTimesheets = async () => {
    if (!startDate || !endDate) {
      setError("Both start date and end date are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await axios.get(
        `https://outcode-api-trackify.vercel.app/api/timesheets?startDate=${startDate}&endDate=${endDate}`
      );
      const allTimesheets = response.data.data;

      // Filtrar los timesheets según los empleados de la colección "uploadedDataEmployee"
      const filteredTimesheets = allTimesheets.filter((item) =>
        uploadedEmployees.includes(item.user_name)
      );

      // Determinar usuarios sin registros en Trackify (solo aquellos con Mandatory = 1)
      const usersWithoutRecords = mandatoryEmployees.filter(
        (user) => !filteredTimesheets.some((item) => item.user_name === user)
      );

      setTimesheets(filteredTimesheets);
      setUsersWithoutRecords(usersWithoutRecords);
    } catch (err) {
      setError("Error fetching timesheets. Please try again.");
      console.error(err); // Mostrar el error en la consola para depuración
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
        Timesheets Viewer
      </h1>

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
        <button
          className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
          onClick={fetchTimesheets}
        >
          Fetch Timesheets
        </button>
      </div>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      {loading ? (
        <p className="text-center text-gray-700">Loading...</p>
      ) : (
        <>
          {/* Tabla principal */}
          <div className="overflow-x-auto mb-6">
            <h2 className="text-xl font-bold text-gray-700 mb-4">Timesheets</h2>
            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="px-4 py-2">User Name</th>
                  <th className="px-4 py-2">Project Name</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Start Time</th>
                  <th className="px-4 py-2">End Time</th>
                  <th className="px-4 py-2">CreatedA</th>
                  <th className="px-4 py-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {timesheets.length > 0 ? (
                  timesheets.map((item, index) => (
                    <tr
                      key={index}
                      className={`border-b ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } ${
                        !item.duration ? "bg-yellow-200" : "" // Resaltar filas con Duration vacío o null
                      }`}
                    >
                      <td className="px-4 py-2 text-gray-700">
                        {item.user_name}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.project_name}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.description}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {new Date(item.time_from).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {new Date(item.time_to).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-gray-700">{item.duration}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center px-4 py-2 text-gray-500"
                    >
                      No data available. Please adjust the date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tabla de usuarios sin registros */}
          <div className="overflow-x-auto">
            <h2 className="text-xl font-bold text-gray-700 mb-4">
              Users Without Records in Trackify (Mandatory = 1)
            </h2>
            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-red-500 text-white">
                <tr>
                  <th className="px-4 py-2">User Name</th>
                </tr>
              </thead>
              <tbody>
                {usersWithoutRecords.length > 0 ? (
                  usersWithoutRecords.map((user, index) => (
                    <tr
                      key={index}
                      className={`border-b ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <td className="px-4 py-2 text-gray-700">{user}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="1"
                      className="text-center px-4 py-2 text-gray-500"
                    >
                      All mandatory users have records in Trackify.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Data3;