import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import db from "./firebaseConfig";
import { Medal, X, Check } from "lucide-react";

const UserActivity = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [combinedData, setCombinedData] = useState([]);
  const [inactiveUsers, setInactiveUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const trackifySnapshot = await getDocs(collection(db, "uploadedDataUploadTrackify"));
      const standupSnapshot = await getDocs(collection(db, "uploadedDataStandup"));
      const employeeSnapshot = await getDocs(collection(db, "uploadedDataEmployee"));

      const trackifyList = trackifySnapshot.docs.map((doc) => doc.data());
      const standupList = standupSnapshot.docs.map((doc) => doc.data());
      const employeeList = employeeSnapshot.docs.map((doc) => doc.data());

      processAndCombineData(trackifyList, standupList);
      findInactiveUsers(trackifyList, standupList, employeeList);
    };

    fetchData();
  }, [startDate, endDate]);

  // Existing data processing functions remain the same
  const processAndCombineData = (trackifyData, standupData) => {
    const countUniqueDays = (data, dateField, userField) => {
      const daySet = {};
      data.forEach((entry) => {
        const user = entry[userField];
        const date = new Date(entry[dateField]).toDateString();
        if (!daySet[user]) daySet[user] = new Set();
        daySet[user].add(date);
      });
      return Object.keys(daySet).reduce((acc, user) => {
        acc[user] = daySet[user].size;
        return acc;
      }, {});
    };

    const filteredTrackifyData = trackifyData.filter((entry) => {
      const entryDate = new Date(entry["Start Date"]);
      return startDate && endDate
        ? entryDate >= new Date(startDate) && entryDate <= new Date(endDate)
        : true;
    });

    const filteredStandupData = standupData.filter((entry) => {
      const entryDate = new Date(entry.standup_date);
      return startDate && endDate
        ? entryDate >= new Date(startDate) && entryDate <= new Date(endDate)
        : true;
    });

    const trackifyCounts = countUniqueDays(filteredTrackifyData, "Start Date", "User");
    const standupCounts = countUniqueDays(filteredStandupData, "standup_date", "User");

    const allUsers = new Set([...Object.keys(trackifyCounts), ...Object.keys(standupCounts)]);

    const combined = Array.from(allUsers).map((user) => {
      const trackifyCount = trackifyCounts[user] || 0;
      const standupCount = standupCounts[user] || 0;

      const points =
        (trackifyCount > 0 ? trackifyCount * 5 : -1) +
        (standupCount > 0 ? standupCount * 5 : -1);

      return {
        user,
        trackifyCount,
        standupCount,
        points,
      };
    });

    combined.sort((a, b) => b.points - a.points);
    setCombinedData(combined);
  };

  const findInactiveUsers = (trackifyData, standupData, employeeData) => {
    // Función para filtrar datos por el rango de fechas
    const filterByDateRange = (data, dateField) => {
      return data.filter((entry) => {
        const entryDate = new Date(entry[dateField]);
        return startDate && endDate
          ? entryDate >= new Date(startDate) && entryDate <= new Date(endDate)
          : true; // Si no hay fechas seleccionadas, no se filtra
      });
    };
  
    // Filtrar los datos de Trackify y Standup por el rango de fechas
    const filteredTrackifyData = filterByDateRange(trackifyData, "Start Date");
    const filteredStandupData = filterByDateRange(standupData, "standup_date");
  
    // Obtener los usuarios activos a partir de los datos filtrados
    const trackifyUsers = new Set(filteredTrackifyData.map((entry) => entry.User));
    const standupUsers = new Set(filteredStandupData.map((entry) => entry.User));
  
    // Filtrar empleados inactivos
    const inactive = employeeData
      .filter((employee) => employee.Mandatory === 1) // Solo empleados obligatorios
      .filter((employee) => employee.Department === "Software Engineering") // Solo del departamento indicado
      .filter(
        (employee) =>
          !trackifyUsers.has(employee.User) || !standupUsers.has(employee.User)
      ) // Usuarios sin actividad en Trackify o Standup
      .map((employee) => ({
        user: employee.User,
        hasTrackify: trackifyUsers.has(employee.User),
        hasStandup: standupUsers.has(employee.User),
        missing: [
          !trackifyUsers.has(employee.User) ? "Trackify" : null,
          !standupUsers.has(employee.User) ? "Standup" : null,
        ]
          .filter(Boolean)
          .join(" & "),
      }));
  
    setInactiveUsers(inactive);
  };

  const getMedalColor = (position) => {
    switch (position) {
      case 0:
        return "text-yellow-400";
      case 1:
        return "text-gray-400";
      case 2:
        return "text-amber-600";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-800 mb-8 flex items-center gap-3">
          Activity Dashboard
        </h1>

        {/* Date Filter */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-8 backdrop-blur-sm bg-opacity-90">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Filter by Date Range</h2>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-2" htmlFor="start-date">
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-2" htmlFor="end-date">
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Active Users Table */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-8 backdrop-blur-sm bg-opacity-90">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">User Activity</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-indigo-50 rounded-lg">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-indigo-800">#</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-indigo-800">Name</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-indigo-800">
                    Trackify Days
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-indigo-800">
                    Standup Days
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-indigo-800">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {combinedData.map(({ user, trackifyCount, standupCount, points }, index) => (
                  <tr
                    key={index}
                    className={`
                      ${index % 2 === 0 ? "bg-white" : "bg-indigo-50/30"}
                      ${index < 3 ? "font-semibold" : ""}
                      hover:bg-indigo-50 transition-colors duration-150
                    `}
                  >
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {index < 3 && (
                          <Medal className={`w-6 h-6 ${getMedalColor(index)}`} />
                        )}
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{user}</td>
                    <td className="px-6 py-4 text-center text-sm">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {trackifyCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full">
                        {standupCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      <span className={`inline-block px-4 py-1 rounded-full font-medium ${
                        index < 3 
                          ? "bg-indigo-100 text-indigo-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {points}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inactive Users Table - Updated with missing records detail */}
        <div className="bg-white shadow-lg rounded-xl p-6 backdrop-blur-sm bg-opacity-90">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">Missing Records</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-red-50 rounded-lg">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-red-800">Name</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-red-800">Trackify</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-red-800">Standup</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-red-800">Missing</th>
                </tr>
              </thead>
              <tbody>
                {inactiveUsers.map(({ user, hasTrackify, hasStandup, missing }, index) => (
                  <tr
                    key={index}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-red-50/30"
                    } hover:bg-red-50 transition-colors duration-150`}
                  >
                    <td className="px-6 py-4 text-sm text-red-800">{user}</td>
                    <td className="px-6 py-4 text-center">
                      {hasTrackify ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {hasStandup ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-800">
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                        {missing}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserActivity;