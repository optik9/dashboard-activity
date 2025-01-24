import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { collection, getDocs } from "firebase/firestore";
import db from "./firebaseConfig"; // Importa tu configuración de Firebase

const Data = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [location, setLocation] = useState("Peru");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [softwareEngineeringEmployees, setSoftwareEngineeringEmployees] = useState([]); // Lista de usuarios con Department = "Software Engineering"
  const [usersWithoutStandupRecords, setUsersWithoutStandupRecords] = useState([]); // Usuarios sin registros en Standup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const locations = ["Peru", "Nepal"];

  // Función para obtener los empleados de la colección "uploadedDataEmployee" con Department = "Software Engineering"
  const fetchUploadedEmployees = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "uploadedDataEmployee"));
      const softwareEngineeringUsers = querySnapshot.docs
        .filter((doc) => doc.data().Department === "Software Engineering") // Filtra solo los usuarios con Department = "Software Engineering"
        .map((doc) => doc.data().User); // Campo "User" en Firebase
      setSoftwareEngineeringEmployees(softwareEngineeringUsers);
    } catch (err) {
      setError("Error fetching uploaded employees. Please try again.");
      console.error(err); // Mostrar el error en la consola para depuración
    }
  };

  // Llama a la función para obtener los empleados al cargar el componente
  useEffect(() => {
    fetchUploadedEmployees();
  }, []);

  // Función para obtener los datos de Standup
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://outcode-api-standup.vercel.app/api/standups`,
          {
            params: {
              startDate: startDate || "2025-01-17",
              endDate: endDate || "2025-01-17",
              location: location || "Peru",
            },
          }
        );
        setData(response.data.data);
        setFilteredData(response.data.data);

        // Determinar usuarios sin registros en Standup (solo aquellos con Department = "Software Engineering")
        const usersWithoutRecords = softwareEngineeringEmployees.filter(
          (user) => !response.data.data.some((item) => item.user_name === user)
        );
        setUsersWithoutStandupRecords(usersWithoutRecords);
      } catch (error) {
        setError("Error fetching data. Please try again.");
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [startDate, endDate, location, softwareEngineeringEmployees]);

  const handleFilter = () => {
    const filtered = data.filter((item) => {
      const itemDate = parseISO(item.date);
      const start = startDate ? parseISO(startDate) : null;
      const end = endDate ? parseISO(endDate) : null;
      return (
        (!start || itemDate >= start) &&
        (!end || itemDate <= end) &&
        (location === "" || item.user_name.includes(location))
      );
    });
    setFilteredData(filtered);
  };

  // Función para formatear la fecha correctamente
  const formatDate = (dateString) => {
    return dateString.split('T')[0]; // Extraer solo la fecha (YYYY-MM-DD)
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Standups Data Viewer</h1>
      
      <div className="space-y-6">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Location:</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button 
          onClick={handleFilter}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Apply Filters
        </button>

        {/* Tabla de Standups */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-gray-700">Project Name</th>
                <th className="p-3 text-left text-sm font-medium text-gray-700">User Name</th>
                <th className="p-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="p-3 text-left text-sm font-medium text-gray-700">Task Update</th>
                <th className="p-3 text-left text-sm font-medium text-gray-700">Upcoming Tasks</th>
                <th className="p-3 text-left text-sm font-medium text-gray-700">Satisfaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3 text-sm text-gray-700">{item.project_name}</td>
                  <td className="p-3 text-sm text-gray-700">{item.user_name}</td>
                  <td className="p-3 text-sm text-gray-700">
                    {formatDate(item.date)}
                  </td>
                  <td className="p-3 text-sm text-gray-700">{item.task_update}</td>
                  <td className="p-3 text-sm text-gray-700">{item.upcoming_tasks}</td>
                  <td className="p-3 text-sm text-gray-700">{item.satisfaction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabla de usuarios sin registros en Standup */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-700 mb-4">
            Users Without Records in Standup (Department = "Software Engineering")
          </h2>
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-red-500 text-white">
              <tr>
                <th className="px-4 py-2">User Name</th>
              </tr>
            </thead>
            <tbody>
              {usersWithoutStandupRecords.length > 0 ? (
                usersWithoutStandupRecords.map((user, index) => (
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
                    All users in the Software Engineering department have records in Standup.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Data;