import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar, Line } from "react-chartjs-2";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import Select from "react-select"; // Importar React Select
import { Helmet } from "react-helmet";
import { Link } from 'react-router-dom';
import Logo from "./OutcodeWorkMarkColor.png"; // Asegúrate de importar la imagen correctamente

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);


const Data4 = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [department, setDepartment] = useState(""); // Nuevo estado para el filtro de Department
  const [trackifyData, setTrackifyData] = useState([]);
  const [standupData, setStandupData] = useState([]);
  const [uploadedDataEmployee, setUploadedDataEmployee] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [obstacleData, setObstacleData] = useState([]);
  

  // Función para formatear fechas
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      timeZone: "UTC", // Fuerza la zona horaria a UTC
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // 1. Fix the department filter in fetchUploadedDataEmployee
  const fetchUploadedDataEmployee = async () => {
    const db = getFirestore();
    const uploadedDataRef = collection(db, "uploadedDataEmployee");
    const snapshot = await getDocs(uploadedDataRef);
    let uploadedData = snapshot.docs.map((doc) => doc.data());
    
  
    if (department && department.value) {
      uploadedData = uploadedData.filter((item) => item.Department === department.value);
    }
    
    setUploadedDataEmployee(uploadedData);
    return uploadedData; // Retornar datos filtrados
  };

  // Función para obtener datos de Trackify
  // Función para obtener datos de Trackify (modificada)
const fetchTrackifyData = async (uploadedData) => {
  try {
    const response = await axios.get(
      `https://outcode-api-trackify.vercel.app/api/timesheets`,
      {
        params: {
          startDate,
          endDate,
        },
      }
    );
    
    const rawTrackifyData = response.data.data || [];
    
    // Filtrar usuarios con Trackify Mandatory = 1
    const trackifyMandatoryUsers = uploadedData.filter(
      user => user['Trackify Mandatory'] === 1
    );

    const filteredTrackifyData = filterDataByUploadedUsers(
      rawTrackifyData,
      trackifyMandatoryUsers, // Usar lista filtrada
      "user_name"
    );
    
    setTrackifyData(filteredTrackifyData);
  } catch (error) {
    setError("Error fetching Trackify data. Please try again.");
    console.error("Error fetching Trackify data:", error);
  }
};
  // Función para obtener datos de Standup
  const fetchStandupData = async (uploadedData) => {  // Recibir datos como parámetro
    try {
      const response = await axios.get(
        `https://outcode-api-standup.vercel.app/api/standups`,
        {
          params: {
            startDate,
            endDate,
            location: "Peru",
          },
        }
      );
      const rawStandupData = response.data.data || [];
    const filteredStandupData = filterDataByUploadedUsers(
      rawStandupData,
      uploadedData,  // Usar parámetro en lugar de estado
      "user_name"
    );
    setStandupData(filteredStandupData);
    } catch (error) {
      setError("Error fetching Standup data. Please try again.");
      console.error("Error fetching Standup data:", error);
    }
  };

  // Función para filtrar datos
  const filterDataByUploadedUsers = (data, uploadedData, key) => {
    return data.filter((item) =>
      uploadedData.some((uploadedItem) => uploadedItem.User === item[key])
    );
  };

// 2. Fix the filter dependencies in useEffect
useEffect(() => {
  if (startDate && endDate) {
    setLoading(true);
    fetchUploadedDataEmployee()
      .then((filteredUploadedData) => {
        return Promise.all([
          fetchTrackifyData(filteredUploadedData),
          fetchStandupData(filteredUploadedData),
          fetchObstacleData(filteredUploadedData)
        ]);
      })
      .catch((error) => {
        setError("Error fetching data: " + error.message);
      })
      .finally(() => setLoading(false));
  }
}, [startDate, endDate, department]);


// 4. Modify the date input handlers
const handleStartDateChange = (e) => {
  setStartDate(e.target.value);
  setError(""); // Clear any existing errors
};

const handleEndDateChange = (e) => {
  setEndDate(e.target.value);
  setError(""); // Clear any existing errors
};

// 5. Add department change handler
const handleDepartmentChange = (selectedOption) => {
  setDepartment(selectedOption);
  setError(""); // Clear any existing errors
};

   // New function to fetch obstacle data
   const fetchObstacleData = async (uploadedData) => {  // Recibir datos como parámetro
    try {
      const response = await axios.get(
        `https://outcode-api-standup.vercel.app/api/standups`,
        {
          params: {
            startDate,
            endDate,
            location: "Peru",
          },
        }
      );
      const rawData = response.data.data || [];
    const filteredData = filterDataByUploadedUsers(
      rawData,
      uploadedData,  // Usar parámetro en lugar de estado
      "user_name"
    );
    const obstaclesData = filteredData.filter(item => item.has_obstacles);
    setObstacleData(obstaclesData);
    } catch (error) {
      setError("Error fetching obstacle data. Please try again.");
      console.error("Error fetching obstacle data:", error);
    }
  };

   // Function to get obstacle statistics
   const getObstacleStats = () => {
    const totalReports = obstacleData.length;
    const uniqueUsers = new Set(obstacleData.map(item => item.user_name)).size;
    return { totalReports, uniqueUsers };
  };
  
  // Calcular horas trabajadas por proyecto
  const calculateProjectHours = () => {
    const projectHours = {};
    trackifyData.forEach((item) => {
      if (!item.duration) return; // Ignorar si duration es null o undefined

      const project = item.project_name;
      const duration = item.duration; // Formato: "HH:MM:SS"
      const [hours, minutes, seconds] = duration.split(":").map(Number);
      const totalHours = hours + minutes / 60 + seconds / 3600;

      if (!projectHours[project]) {
        projectHours[project] = 0;
      }
      projectHours[project] += totalHours;
    });
    return projectHours;
  };

  // Calcular productividad de usuarios (tareas completadas)
  const calculateUserProductivity = () => {
    const userTasks = {};
    standupData.forEach((item) => {
      const user = item.user_name;
      const taskCount = item.task_count || 0;

      if (!userTasks[user]) {
        userTasks[user] = 0;
      }
      userTasks[user] += taskCount;
    });
    return userTasks;
  };

  // Calcular distribución de duración de tareas
  const calculateTaskDurationDistribution = () => {
    const durationRanges = {
      "0-2 hours": 0,
      "2-4 hours": 0,
      "4-6 hours": 0,
      "6-8 hours": 0,
      "8+ hours": 0,
    };

    trackifyData.forEach((item) => {
      if (!item.duration) return; // Ignorar si duration es null o undefined

      const duration = item.duration; // Formato: "HH:MM:SS"
      const [hours, minutes, seconds] = duration.split(":").map(Number);
      const totalHours = hours + minutes / 60 + seconds / 3600;

      if (totalHours <= 2) {
        durationRanges["0-2 hours"]++;
      } else if (totalHours <= 4) {
        durationRanges["2-4 hours"]++;
      } else if (totalHours <= 6) {
        durationRanges["4-6 hours"]++;
      } else if (totalHours <= 8) {
        durationRanges["6-8 hours"]++;
      } else {
        durationRanges["8+ hours"]++;
      }
    });

    return durationRanges;
  };

  const getUniqueDepartments = () => {
    const departments = [...new Set(uploadedDataEmployee.map((item) => item.Department))];
    return departments.filter((dept) => dept).map((dept) => ({ value: dept, label: dept }));
  };


  // Estilos personalizados para React Select
  const customStyles = {
    control: (provided) => ({
      ...provided,
      border: "1px solid #d1d5db", // Color del borde
      borderRadius: "0.375rem", // Radio de borde
      boxShadow: "none", // Sin sombra
      "&:hover": {
        borderColor: "#3b82f6", // Color del borde al pasar el mouse
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#3b82f6" : "white", // Color de fondo de la opción seleccionada
      color: state.isSelected ? "white" : "#1f2937", // Color del texto
      "&:hover": {
        backgroundColor: "#60a5fa", // Color de fondo al pasar el mouse
      },
    }),
};
// Calcular satisfacción promedio por proyecto
  const calculateProjectSatisfaction = () => {
    const projectSatisfaction = {};
    standupData.forEach((item) => {
      const project = item.project_name;
      const satisfaction = item.satisfaction || 0;

      if (!projectSatisfaction[project]) {
        projectSatisfaction[project] = { total: 0, count: 0 };
      }
      projectSatisfaction[project].total += satisfaction;
      projectSatisfaction[project].count++;
    });

    // Calcular promedio
    for (const project in projectSatisfaction) {
      projectSatisfaction[project] = (
        projectSatisfaction[project].total / projectSatisfaction[project].count
      ).toFixed(2);
    }

    return projectSatisfaction;
  };

  // Obtener usuarios con baja satisfacción (5 o 6)
  const getLowSatisfactionUsers = () => {
    return standupData
      .filter((item) => item.satisfaction >= 5 && item.satisfaction <= 6)
      .map((item) => ({
        user_name: item.user_name,
        date: item.date,
        satisfaction: item.satisfaction,
      }));
  };

  // Obtener número total de commits y tareas
  const totalCommits = standupData.reduce((acc, item) => acc + (item.commit_count || 0), 0);
  const totalTasks = standupData.reduce((acc, item) => acc + (item.task_count || 0), 0);

  // Calcular número total de usuarios en uploadedDataEmployee
  const totalUploadedUsers = uploadedDataEmployee.length;

  // Calcular número total de usuarios únicos en Trackify
  const uniqueTrackifyUsers = [...new Set(trackifyData.map((item) => item.user_name))].length;

  // Calcular número total de usuarios únicos en Standup
  const uniqueStandupUsers = [...new Set(standupData.map((item) => item.user_name))].length;

  // Datos para gráficos
const calculateHours = calculateProjectHours();
const sortedEntries2 = Object.entries(calculateHours)
  .sort((a, b) => Number(b[1]) - Number(a[1])); // Orden descendente

const projectHoursData = {
  labels: sortedEntries2.map(([project]) => project),
  datasets: [
    {
      label: "Hours Worked",
      data: sortedEntries2.map(([_, hours]) => hours),
      backgroundColor: sortedEntries2.map((_, index) => [
        "#3b82f6", 
        "#10b981", 
        "#f59e0b", 
        "#ef4444", 
        "#8b5cf6"
      ][index % 5]), // Mantiene el ciclo de colores original
    },
  ],
};




  

// Datos modificados para el Bar Chart
const durationDistribution = calculateTaskDurationDistribution();
const orderedLabels = ["0-2 hours", "2-4 hours", "4-6 hours", "6-8 hours", "8+ hours"];

const taskDurationData = {
  labels: orderedLabels,
  datasets: [
    {
      label: "Task Duration",
      data: orderedLabels.map(label => durationDistribution[label]),
      backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
      borderColor: "#ffffff",
      borderWidth: 1
    },
  ],
};

  const projectSatisfaction = calculateProjectSatisfaction();
const sortedEntries = Object.entries(projectSatisfaction)
  .sort((a, b) => Number(b[1]) - Number(a[1])); // Orden descendente

  const projectSatisfactionData = {
    labels: sortedEntries.map(([project]) => project),
    datasets: [
      {
        label: "Satisfaction",
        data: sortedEntries.map(([_, satisfaction]) => satisfaction),
        backgroundColor: sortedEntries.map((_, index) => [
          "#3b82f6", 
          "#10b981", 
          "#f59e0b", 
          "#ef4444", 
          "#8b5cf6"
        ][index % 5]), // Mantiene el ciclo de colores
      },
    ],
  };

  // Top 5 usuarios con mayor duración de tareas
  const topUsers = Object.entries(calculateUserProductivity())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([user, duration]) => ({ user, duration }));

     // Calcular porcentajes de cumplimiento
  //const totalUsers = uploadedDataEmployee.length;
  //const standupPercentage = totalUsers > 0 ? ((uniqueStandupUsers * 100) / totalUsers).toFixed(2) : 0;
  //const trackifyPercentage = totalUsers > 0 ? ((uniqueTrackifyUsers * 100) / totalUsers).toFixed(2) : 0;
  
  // Calcular usuarios obligatorios
const totalStandupMandatoryUsers = uploadedDataEmployee.filter(
  user => user['Standup Mandatory'] === 1
).length;

const totalTrackifyMandatoryUsers = uploadedDataEmployee.filter(
  user => user['Trackify Mandatory'] === 1
).length;

// Calcular porcentajes de cumplimiento
const standupPercentage = totalStandupMandatoryUsers > 0 
  ? ((uniqueStandupUsers * 100) / totalStandupMandatoryUsers).toFixed(2)
  : 0;

const trackifyPercentage = totalTrackifyMandatoryUsers > 0
  ? ((uniqueTrackifyUsers * 100) / totalTrackifyMandatoryUsers).toFixed(2)
  : 0;

  // Función para determinar el color del porcentaje
  const getPercentageColor = (percentage) => {
    if (percentage >= 97) return "text-green-600";
    if (percentage >= 90) return "text-yellow-500";
    return "text-red-600";
  };



// Calcular top 5 usuarios con más commits
const calculateTopCommitUsers = () => {
  const userCommits = {};
  standupData.forEach((item) => {
    const user = item.user_name;
    const commits = item.commit_count || 0;
    
    if (!userCommits[user]) {
      userCommits[user] = 0;
    }
    userCommits[user] += commits;
  });
  
  return Object.entries(userCommits)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([user, commits]) => ({ user, commits }));
};



// Función para generar datos de la línea de tiempo de actividad
const getActivityTimelineData = () => {
  const timelineData = {};

  // Procesar datos de Standup
  standupData.forEach(item => {
    const date = formatDate(item.date);
    if (!timelineData[date]) {
      timelineData[date] = {
        commits: 0,
        tasks: 0
      };
    }
    timelineData[date].commits += item.commit_count || 0;
    timelineData[date].tasks += item.task_count || 0;
  });

  // Ordenar fechas y convertir a arrays
  const sortedDates = Object.keys(timelineData).sort((a, b) => 
    new Date(a) - new Date(b)
  );

  return {
    labels: sortedDates,
    datasets: [
      {
        label: 'Commits',
        data: sortedDates.map(date => timelineData[date].commits),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        pointRadius: 4
      },
      {
        label: 'Tasks Completed',
        data: sortedDates.map(date => timelineData[date].tasks),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        pointRadius: 4
      }
    ]
  };
};
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Operational Dashboard - Outcode Peru</title>
      </Helmet>


     {/* Header Section */}
     <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Operational Dashboard</h1>
          <p className="text-gray-600 mt-2">Team Performance Analytics</p>
        </div>
        <div className="flex items-center gap-4">
          <img src={Logo} alt="Outcode Logo" className="w-32 h-auto" />
        </div>
      </div>

        {/* Trackify and Standup details Links */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-800">Productivity all employees</h3>
              <div className="flex gap-3">
                <Link 
                  to="/data3" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Trackify
                </Link>
                <Link 
                  to="/data" 
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  Standup
                </Link>
              </div>
            </div>
            <br/>
          {/* per employee */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-800">Productivity per employee</h3>
              <div className="flex gap-3">
                <Link 
                  to="/usersPage" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Trackify
                </Link>
                <Link 
                  to="/userPageStandup" 
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  Standup
                </Link>
              </div>
            </div>
            
          </div>

       {/* Filters Section */}
       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <Select
              options={[
                { value: "", label: "All Departments" },
                ...getUniqueDepartments()
              ]}
              value={department}
              onChange={handleDepartmentChange}
              styles={customStyles}
              placeholder="Select Department"
              isClearable
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              value={startDate}
              onChange={handleStartDateChange}
              max={endDate || undefined}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              value={endDate}
              onChange={handleEndDateChange}
              min={startDate || undefined}
            />
          </div>
        </div>
      </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { title: "Total Employees", value: totalUploadedUsers, color: "bg-purple-100", textColor: "text-purple-600" },
          { 
            title: "Trackify Records", 
            value: uniqueTrackifyUsers, 
            color: "bg-amber-100", 
            textColor: "text-amber-600",
            percentage: trackifyPercentage,
            total: totalTrackifyMandatoryUsers
          },
          { 
            title: "Standup Records", 
            value: uniqueStandupUsers, 
            color: "bg-amber-100", 
            textColor: "text-amber-600",
            percentage: standupPercentage,
            total: totalStandupMandatoryUsers
          },
          { title: "Total Commits", value: totalCommits, color: "bg-blue-100", textColor: "text-blue-600" },
          { title: "Total Tasks", value: totalTasks, color: "bg-green-100", textColor: "text-green-600" },
        ].map((card, index) => (
          <div key={index} className={`p-5 rounded-xl ${card.color} transition-transform hover:scale-[1.02]`}>
            <h3 className="text-sm font-semibold text-gray-600 mb-1">{card.title}</h3>
            <div className="flex items-baseline gap-2">
              <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
              <span className={`text-sm ${getPercentageColor(card.percentage)}`}>
                ({card.percentage}% de {card.total})
              </span>
            </div>
          </div>
        ))}
      </div>
  

      {/* Obstacles Card */}
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold text-gray-700 mb-4">Reported Obstacles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-lg font-semibold text-gray-700">Total Obstacles</p>
          <p className="text-3xl font-bold text-red-600">{getObstacleStats().totalReports}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-lg font-semibold text-gray-700">Users Reporting</p>
          <p className="text-3xl font-bold text-orange-600">{getObstacleStats().uniqueUsers}</p>
        </div>
      </div>
      
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">User</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Obstacle</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {obstacleData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-700">{item.user_name}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{formatDate(item.date)}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{item.obstacles}</td>
              </tr>
            ))}
            {obstacleData.length === 0 && (
              <tr>
                <td colSpan="3" className="py-8 text-center">
              <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-12 w-12" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
                <p className="text-lg font-medium text-gray-500">
                  No data reported for the selected period
                </p>
              </div>
            </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Users with Low Satisfaction Section */}
<div className="bg-white p-6 rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-gray-700 mb-4">Users with Low Satisfaction</h2>
  <div className="overflow-x-auto">
    <table className="min-w-full bg-white">
      <thead>
        <tr>
          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">User</th>
          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Satisfaction</th>
        </tr>
      </thead>
      <tbody>
        {getLowSatisfactionUsers().length === 0 ? (
          <tr>
            <td colSpan="3" className="py-8 text-center">
              <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-12 w-12" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
                <p className="text-lg font-medium text-gray-500">
                  No data reported for the selected period
                </p>
              </div>
            </td>
          </tr>
        ) : (
          getLowSatisfactionUsers().map((user, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm text-gray-700">{user.user_name}</td>
              <td className="px-4 py-2 text-sm text-gray-700">
                {formatDate(user.date)}
              </td>
              <td className="px-4 py-2 text-sm text-gray-700">{user.satisfaction}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>


      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8">
        {/* Left Column - Charts */}
        <div className="space-y-8">
          {/* Project Hours Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Hours Distribution</h3>
            <div className="h-80">
              <Bar 
                data={projectHoursData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' } },
                  responsive: true 
                }}
              />
            </div>
          </div>

          {/* Task Duration Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Task Duration Distribution</h3>
            <div className="h-80">
              <Bar 
                data={taskDurationData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  responsive: true
                }}
              />
            </div>
          </div>
        </div>

     {/* Right Column - Lists and Tables */}
     <div className="space-y-8">
          {/* Top Performers Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Performers</h3>
            
            {/* Top Commits */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-600 mb-3">Most Commits</h4>
              <div className="space-y-3">
                {calculateTopCommitUsers().map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-green-600">{index + 1}</span>
                      </div>
                      <span className="font-medium text-gray-700">{user.user}</span>
                    </div>
                    <span className="font-semibold text-green-600">{user.commits}</span>
                  </div>
                ))}
              </div>
            </div>

        {/* Top Tasks */}
        <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-3">Most Tasks Completed</h4>
              <div className="space-y-3">
                {topUsers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <span className="font-medium text-gray-700">{user.user}</span>
                    </div>
                    <span className="font-semibold text-blue-600">{user.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

   
          
        </div>
      </div>

      {/* Full Width Satisfaction Chart - Nuevo bloque */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-800 mb-6">Project Satisfaction Overview</h3>
    <div className="h-[500px] w-full"> {/* Aumentamos la altura */}
      <Bar 
        data={projectSatisfactionData}
        options={{
          indexAxis: 'x', // Aseguramos orientación horizontal
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 20,
                padding: 20,
                font: {
                  size: 14
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
              ticks: {
                font: {
                  size: 14
                }
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                font: {
                  size: 14
                }
              },
              grid: {
                color: '#f3f4f6'
              }
            }
          }
        }}
      />
    </div>
  </div>
{/* New Commits & Tasks Line Chart */}
<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Timeline (Commits vs Tasks)</h3>
    <div className="h-[500px] w-full">
      <Line 
        data={getActivityTimelineData()}
        options={{
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 20,
                padding: 20,
                font: {
                  size: 14
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
              ticks: {
                font: {
                  size: 14
                }
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                font: {
                  size: 14
                }
              },
              grid: {
                color: '#f3f4f6'
              }
            }
          }
        }}
      />
    </div>
  </div>
</div>


   
       {/* Loading and Error States */}
       {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl flex items-center gap-4">
            <div className="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            <span className="text-gray-700">Loading data...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-red-50 p-6 rounded-xl max-w-md text-center">
            <div className="text-red-600 font-medium mb-2">Error:</div>
            <p className="text-gray-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Data4;