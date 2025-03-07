import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { Bar, Line } from "react-chartjs-2";
import { Helmet } from "react-helmet";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const UserStats = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [trackifyData, setTrackifyData] = useState([]);
  const [standupData, setStandupData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user details
        const trackifyResponse = await axios.get(
          `https://outcode-api-trackify.vercel.app/api/timesheets/user/${userId}`
        );
        
        const standupResponse = await axios.get(
          `https://outcode-api-standup.vercel.app/api/standups/user/${userId}`
        );

        setTrackifyData(trackifyResponse.data.data || []);
        setStandupData(standupResponse.data.data || []);
        
        // Obtener datos del departamento (asumiendo que tienes un endpoint para esto)
        const departmentResponse = await axios.get(
          `https://tu-api.com/api/users/${userId}`
        );
        
        setUserData({
          ...departmentResponse.data,
          trackify: trackifyResponse.data.data,
          standup: standupResponse.data.data
        });
        
      } catch (error) {
        setError("Error al cargar los datos del usuario");
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const calculateUserStats = () => {
    if (!userData) return {};
    
    const totalHours = trackifyData.reduce((acc, item) => {
      const [h, m, s] = item.duration.split(':');
      return acc + (+h) + (+m)/60 + (+s)/3600;
    }, 0);

    const totalTasks = standupData.reduce((acc, item) => acc + (item.task_count || 0), 0);
    const avgSatisfaction = standupData.length > 0 
      ? (standupData.reduce((acc, item) => acc + (item.satisfaction || 0), 0) / standupData.length).toFixed(2)
      : 0;

    return { totalHours, totalTasks, avgSatisfaction };
  };

  const generateChartData = () => {
    const dailyHours = {};
    trackifyData.forEach(item => {
      const date = new Date(item.date).toLocaleDateString();
      const [h, m, s] = item.duration.split(':');
      dailyHours[date] = (dailyHours[date] || 0) + (+h) + (+m)/60 + (+s)/3600;
    });

    return {
      labels: Object.keys(dailyHours),
      datasets: [{
        label: 'Horas trabajadas',
        data: Object.values(dailyHours),
        backgroundColor: '#3b82f6'
      }]
    };
  };

  if (loading) return <div className="text-center mt-8">Cargando...</div>;
  if (error) return <div className="text-center text-red-500 mt-8">{error}</div>;

  const stats = calculateUserStats();
  const chartData = generateChartData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-indigo-50 p-6">
      <Helmet>
        <title>{userId} - Estadísticas</title>
      </Helmet>

      <div className="mb-6">
        <Link 
          to="/data4" 
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          &larr; Volver al dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {userId}
          {userData?.Department && (
            <span className="text-lg text-gray-600 ml-4">
              ({userData.Department})
            </span>
          )}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-gray-600">Horas totales</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.totalHours.toFixed(2)}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-gray-600">Tareas completadas</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.totalTasks}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-gray-600">Satisfacción promedio</p>
            <p className="text-2xl font-bold text-purple-600">
              {stats.avgSatisfaction}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Horas trabajadas por día
          </h2>
          <Bar data={chartData} />
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Últimos reportes de Standup
          </h2>
          <div className="space-y-4">
            {standupData.slice(0, 5).map((standup, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{new Date(standup.date).toLocaleDateString()}</span>
                  <span className={`px-2 py-1 rounded ${standup.satisfaction < 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    Satisfacción: {standup.satisfaction}
                  </span>
                </div>
                <p className="text-gray-600">{standup.tasks_completed}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStats;