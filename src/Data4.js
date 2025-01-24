import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import Select from "react-select"; // Importar React Select
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
  const [startDate, setStartDate] = useState("2025-01-23");
  const [endDate, setEndDate] = useState("2025-01-23");
  const [department, setDepartment] = useState(""); // Nuevo estado para el filtro de Department
  const [trackifyData, setTrackifyData] = useState([]);
  const [standupData, setStandupData] = useState([]);
  const [uploadedDataEmployee, setUploadedDataEmployee] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  // Función para obtener datos de Firebase
  const fetchUploadedDataEmployee = async () => {
    const db = getFirestore();
    const uploadedDataRef = collection(db, "uploadedDataEmployee");
    const snapshot = await getDocs(uploadedDataRef);
    let uploadedData = snapshot.docs.map((doc) => doc.data());

    // Filtrar por Department si se ha seleccionado un departamento
    // Filtrar por Department si se ha seleccionado un departamento
    if (department) {
        uploadedData = uploadedData.filter((item) => item.Department === department.value);
      }  
    setUploadedDataEmployee(uploadedData);
  };

  // Función para obtener datos de Trackify
  const fetchTrackifyData = async () => {
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
      // Filtrar datos de trackify
      const filteredTrackifyData = filterDataByUploadedUsers(
        rawTrackifyData,
        uploadedDataEmployee,
        "user_name"
      );
      setTrackifyData(filteredTrackifyData);
    } catch (error) {
      setError("Error fetching Trackify data. Please try again.");
      console.error("Error fetching Trackify data:", error);
    }
  };

  // Función para obtener datos de Standup
  const fetchStandupData = async () => {
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
      // Filtrar datos de standup
      const filteredStandupData = filterDataByUploadedUsers(
        rawStandupData,
        uploadedDataEmployee,
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

  // Llama a las funciones para obtener los datos al cargar el componente o cambiar las fechas
  useEffect(() => {
    if (startDate && endDate) {
      setLoading(true);
      fetchUploadedDataEmployee().then(() => {
        Promise.all([fetchTrackifyData(), fetchStandupData()])
          .finally(() => setLoading(false));
      });
    }
  }, [startDate, endDate, department]);

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
  const projectHoursData = {
    labels: Object.keys(calculateProjectHours()),
    datasets: [
      {
        label: "Hours Worked",
        data: Object.values(calculateProjectHours()),
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
      },
    ],
  };

  const userProductivityData = {
    labels: Object.keys(calculateUserProductivity()),
    datasets: [
      {
        label: "Tasks Completed",
        data: Object.values(calculateUserProductivity()),
        borderColor: "#3b82f6",
        fill: false,
      },
    ],
  };

  const taskDurationData = {
    labels: Object.keys(calculateTaskDurationDistribution()),
    datasets: [
      {
        label: "Task Duration",
        data: Object.values(calculateTaskDurationDistribution()),
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
      },
    ],
  };

  const projectSatisfactionData = {
    labels: Object.keys(calculateProjectSatisfaction()),
    datasets: [
      {
        label: "Satisfaction",
        data: Object.values(calculateProjectSatisfaction()),
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
      },
    ],
  };

  // Top 5 usuarios con mayor duración de tareas
  const topUsers = Object.entries(calculateUserProductivity())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([user, duration]) => ({ user, duration }));

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
        Dashboard
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <Select
              options={[{ value: "", label: "All Departments" }, ...getUniqueDepartments()]}
              value={department}
              onChange={(selectedOption) => setDepartment(selectedOption)}
              styles={customStyles}
              placeholder="Select Department"
              isClearable
            />
          </div>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700">Total Employees</h2>
          <p className="text-3xl font-bold text-purple-600">{totalUploadedUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700">Trackify Records</h2>
          <p className="text-3xl font-bold text-yellow-600">{uniqueTrackifyUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700">Standup Records</h2>
          <p className="text-3xl font-bold text-red-600">{uniqueStandupUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700">Total Commits</h2>
          <p className="text-3xl font-bold text-blue-600">{totalCommits}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700">Total Tasks</h2>
          <p className="text-3xl font-bold text-green-600">{totalTasks}</p>
        </div>
      </div>

      {/* Gráficos y tablas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-4">Project Hours</h2>
          <Bar data={projectHoursData} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-4">User Productivity</h2>
          <Line data={userProductivityData} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-4">Task Duration Distribution</h2>
          <Doughnut data={taskDurationData} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-6">Top 5 Users by Task Duration</h2>
          <div className="space-y-4">
            {topUsers.map((user, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-800">{user.user}</p>
                    <p className="text-sm text-gray-500">{user.duration} tasks completed</p>
                  </div>
                </div>
                <div className="text-blue-600 font-bold text-lg">
                  {user.duration}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-4">Project Satisfaction</h2>
          <Bar data={projectSatisfactionData} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-4">Users with Low Satisfaction</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Nombre</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fecha</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Satisfacción</th>
                </tr>
              </thead>
              <tbody>
                {getLowSatisfactionUsers().map((user, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-700">{user.user_name}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {formatDate(user.date)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">{user.satisfaction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mensajes de carga y error */}
      {loading && <p className="text-center text-gray-700 mt-4">Loading...</p>}
      {error && <p className="text-center text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default Data4;