import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { collection, getDocs } from "firebase/firestore";
import db from "./firebaseConfig"; // Importa tu configuración de Firebase
import { Helmet } from "react-helmet";
import { Link } from 'react-router-dom';

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
  const [totalMandatoryUsers, setTotalMandatoryUsers] = useState(0); // Nuevo estado para total de usuarios mandatorios
  const [usersWithMissingStandup, setUsersWithMissingStandup] = useState([]);

  const locations = ["Peru", "Nepal"];

 // Helper function to get weekday dates in range
 const getWeekdayDatesInRange = (start, end) => {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  const dates = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const day = currentDate.getDay();
    if (day !== 0 && day !== 6) { // Exclude Sunday and Saturday
      dates.push(format(currentDate, 'yyyy-MM-dd'));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

  // Modifica la función fetchUploadedEmployees para obtener el total
const fetchUploadedEmployees = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "uploadedDataEmployee"));
    const softwareEngineeringUsers = querySnapshot.docs
      .filter((doc) => doc.data()["Standup Mandatory"] === 1)
      .map((doc) => doc.data().User);
      
    setSoftwareEngineeringEmployees(softwareEngineeringUsers);
    setTotalMandatoryUsers(softwareEngineeringUsers.length); // Guardar el total de usuarios mandatorios
  } catch (err) {
    setError("Error fetching uploaded employees. Please try again.");
    console.error(err);
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

        // New logic for detailed missing dates
        const startRange = startDate || "2025-01-17";
        const endRange = endDate || "2025-01-17";
        const allWeekdays = getWeekdayDatesInRange(startRange, endRange);
        
        const userStandupDates = {};
        response.data.data.forEach(item => {
          const user = item.user_name;
          const date = formatDate(item.date);
          if (!userStandupDates[user]) {
            userStandupDates[user] = new Set();
          }
          userStandupDates[user].add(date);
        });

        const detailedMissing = [];
        softwareEngineeringEmployees.forEach(user => {
          const userDates = userStandupDates[user] || new Set();
          const missingDates = allWeekdays.filter(date => !userDates.has(date));
          if (missingDates.length > 0) {
            detailedMissing.push({
              user,
              missingDates,
              count: missingDates.length
            });
          }
        });

        setUsersWithMissingStandup(detailedMissing);

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
   
   
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
       <Link to="/data4" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>

         <Helmet>
        <meta charSet="utf-8" />
        <title>Standup Dashboard</title>
      </Helmet>
      <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
        Standup Compliance Dashboard
      </h1>

      <div className="flex flex-col items-center gap-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-4xl">
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-semibold text-gray-600">Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-semibold text-gray-600">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
          
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-semibold text-gray-600">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
        </div>
        <button
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          onClick={handleFilter}
        >
          Generate Report
        </button>
      </div>

      {error && (
        <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
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
                    {totalMandatoryUsers > 0 ? 
                      ((usersWithoutStandupRecords.length / totalMandatoryUsers) * 100).toFixed(2) + '%' 
                      : '0.00%'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {usersWithoutStandupRecords.length} of {totalMandatoryUsers} mandatory users
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
                    {totalMandatoryUsers > 0 ? 
                      (((totalMandatoryUsers - usersWithoutStandupRecords.length) / totalMandatoryUsers) * 100).toFixed(2) + '%' 
                      : '0.00%'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {(totalMandatoryUsers - usersWithoutStandupRecords.length)} compliant users
              </p>
            </div>
          </div>

          <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-500">📋</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700">
                Total Records:{" "}
                <span className="text-blue-600">{filteredData.length}</span>
              </h3>
            </div>
          </div>

          <div className="mb-8 bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-cyan-500">
              <h2 className="text-xl font-semibold text-white">Standups Records</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">#</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Project</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Task Update</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Upcoming Tasks</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Satisfaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.project_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.user_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {item.task_update}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.upcoming_tasks}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.satisfaction}
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
                  {usersWithoutStandupRecords.map((user, index) => (
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
      {/* New Detailed Missing Standups Table */}
      <div className="mt-8 bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-500">
          <h2 className="text-xl font-semibold text-white">
          Detailed Missing Days Breakdown (Weekdays Only)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">#</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">User</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Missing Dates</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Days Missing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usersWithMissingStandup.map((userData, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                  <td className="px-6 py-4 text-sm font-medium text-red-600">{userData.user}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
              <div className="flex flex-wrap gap-2">
                {userData.missingDates.map((date, dateIndex) => {
                  const parsedDate = parseISO(date);
                  return (
                    <div 
                      key={`${index}-${dateIndex}`}
                      className="bg-gray-50 p-2 rounded-lg border border-gray-200 shadow-sm"
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                          {format(parsedDate, 'EEEE')}
                        </span>
                        <span className="text-sm text-gray-600">
                          {format(parsedDate, 'MM/dd/yyyy')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </td>
                  <td className="px-6 py-4 text-sm font-medium text-red-600">{userData.count} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {usersWithMissingStandup.length === 0 && !loading && (
          <div className="p-6 text-center text-gray-500">
            All mandatory users have complete standup records for the selected period 🎉
          </div>
        )}
      </div>
    </div>
  );
};

export default Data;