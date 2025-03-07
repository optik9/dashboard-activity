import React, { useState, useEffect } from "react";
import axios from "axios";
import { collection, getDocs } from "firebase/firestore";
import db from "./firebaseConfig"; // Importa tu configuración de Firebase
import { Helmet } from "react-helmet";

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
      
      // Filtrar usuarios donde "Trackify Mandatory" sea igual a 1
      const mandatoryUsers = querySnapshot.docs
        .filter((doc) => doc.data()["Trackify Mandatory"] === 1) // Campo con espacio en el nombre
        .map((doc) => doc.data().User);
  
      // Obtener todos los usuarios (para mantener la funcionalidad existente si es necesario)
      const allEmployees = querySnapshot.docs.map((doc) => doc.data().User);
  
      setUploadedEmployees(allEmployees);
      setMandatoryEmployees(mandatoryUsers); // Ahora basado en "Trackify Mandatory"
  
    } catch (err) {
      setError("Error fetching uploaded employees. Please try again.");
      console.error("Error detallado:", err);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
       <Helmet>
        <meta charSet="utf-8" />
        <title>Trackify Dashboard</title>
      </Helmet>
      <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
        Trackify Compliance Dashboard
      </h1>

      <div className="flex flex-col items-center gap-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl">
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-semibold text-gray-600">
              Start Date
            </label>
            <input
              type="date"
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-semibold text-gray-600">
              End Date
            </label>
            <input
              type="date"
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <button
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          onClick={fetchTimesheets}
        >
          Generate Report
        </button>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-600">Non-compliance</h3>
                  <p className="text-3xl font-bold text-red-600">
                    {((usersWithoutRecords.length / mandatoryEmployees.length) * 100 || 0).toFixed(2)}%
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {usersWithoutRecords.length} of {mandatoryEmployees.length} mandatory users
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-600">Compliance Rate</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {(((mandatoryEmployees.length - usersWithoutRecords.length) /
                      mandatoryEmployees.length) * 100 || 0).toFixed(2)}%
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {mandatoryEmployees.length - usersWithoutRecords.length} compliant users
              </p>
            </div>
          </div>

          <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-500">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700">
                Total Records:{" "}
                <span className="text-blue-600">{timesheets.length}</span>
              </h3>
            </div>
          </div>

          <div className="mb-8 bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700">Timesheets</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">#</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Project</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Start</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">End</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {timesheets.map((item, index) => (
                    <tr 
                      key={index}
                      className={`hover:bg-gray-50 transition-colors ${
                        !item.duration ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.user_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.project_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(item.time_from).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(item.time_to).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(item.time_from).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.duration}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-600 to-orange-500">
              <h2 className="text-xl font-semibold text-white">
                Missing Records (Mandatory Users)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">#</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">User Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {usersWithoutRecords.map((user, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-red-600">
                        {user}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Data3;