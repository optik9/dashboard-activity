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
  const [department, setDepartment] = useState(null); // Estado para el departamento seleccionado
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
  }, [startDate, endDate, department]); // Agregar department como dependencia

  // Obtener la lista de departamentos únicos para el filtro
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

  // Resto del código (funciones de cálculo, gráficos, etc.)
  // ...

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
        Dashboard
      </h1>

      {/* Filtro de fechas y departamento */}
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
        {/* ... (resto del código de gráficos y tablas) ... */}
      </div>

      {/* Mensajes de carga y error */}
      {loading && <p className="text-center text-gray-700 mt-4">Loading...</p>}
      {error && <p className="text-center text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default Data4;