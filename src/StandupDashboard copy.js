





import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from "recharts";
import { Calendar, Target, AlertTriangle, CheckCircle } from "lucide-react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import db from './firebaseConfig';

const StandupDashboard = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lowSatisfactionUsers, setLowSatisfactionUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const standupRef = collection(db, "uploadedDataStandup");
        const q = query(standupRef, orderBy("standup_date", "desc"));
        const querySnapshot = await getDocs(q);
        const standupData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(standupData);
        setFilteredData(standupData);
        analyzeLowSatisfaction(standupData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Análisis de usuarios con baja satisfacción
  const analyzeLowSatisfaction = (data) => {
    const userSatisfaction = data.reduce((acc, item) => {
      if (!acc[item.User]) {
        acc[item.User] = {
          user: item.User,
          lowSatisfactionCount: 0,
          totalEntries: 0,
          location: item.Location,
          latestDate: item.standup_date,
          satisfactionScores: []
        };
      }
      
      const satisfaction = parseInt(item.satisfaction);
      acc[item.User].satisfactionScores.push(satisfaction);
      if (satisfaction <= 6) {
        acc[item.User].lowSatisfactionCount += 1;
      }
      acc[item.User].totalEntries += 1;
      
      if (item.standup_date > acc[item.User].latestDate) {
        acc[item.User].latestDate = item.standup_date;
      }
      
      return acc;
    }, {});

    const lowSatisfactionData = Object.values(userSatisfaction)
      .map(user => ({
        ...user,
        averageSatisfaction: (user.satisfactionScores.reduce((a, b) => a + b, 0) / user.satisfactionScores.length).toFixed(1),
        lowSatisfactionRate: ((user.lowSatisfactionCount / user.totalEntries) * 100).toFixed(1)
      }))
      .filter(user => user.lowSatisfactionCount > 0)
      .sort((a, b) => b.lowSatisfactionCount - a.lowSatisfactionCount);

    setLowSatisfactionUsers(lowSatisfactionData);
  };

  // Métricas de usuario
  const getUserMetrics = () => {
    const userMetrics = {};
    filteredData.forEach(item => {
      if (!userMetrics[item.User]) {
        userMetrics[item.User] = {
          user: item.User,
          location: item.Location,
          totalTasks: 0,
          totalCommits: 0,
          obstaclesCount: 0,
          entries: 0,
          avgSatisfaction: 0
        };
      }
      
      userMetrics[item.User].totalTasks += parseInt(item.task_count || 0);
      userMetrics[item.User].totalCommits += parseInt(item.commit_count || 0);
      userMetrics[item.User].obstaclesCount += item.has_obstacles === "True" ? 1 : 0;
      userMetrics[item.User].entries += 1;
      userMetrics[item.User].avgSatisfaction += parseInt(item.satisfaction || 0);
    });

    return Object.values(userMetrics).map(user => ({
      ...user,
      avgSatisfaction: (user.avgSatisfaction / user.entries).toFixed(1),
      tasksPerDay: (user.totalTasks / user.entries).toFixed(1)
    }));
  };

  useEffect(() => {
    let filtered = data;

    if (locationFilter) {
      filtered = filtered.filter((item) => item.Location === locationFilter);
    }
    if (projectFilter) {
      filtered = filtered.filter((item) => item.Project === projectFilter);
    }
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.standup_date);
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        return itemDate >= start && itemDate <= end;
      });
    }

    setFilteredData(filtered);
  }, [locationFilter, projectFilter, dateRange, data]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-r from-blue-50 to-gray-50 min-h-screen">
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg shadow-md">
        <select
          className="border p-2 rounded-lg"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        >
          <option value="">All Locations</option>
          {[...new Set(data.map(item => item.Location))].map(location => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>

        <select
          className="border p-2 rounded-lg"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="">All Projects</option>
          {[...new Set(data.map(item => item.Project))].map(project => (
            <option key={project} value={project}>{project}</option>
          ))}
        </select>

        <div className="flex gap-2">
          <input
            type="date"
            className="border p-2 rounded-lg"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
          />
          <input
            type="date"
            className="border p-2 rounded-lg"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>
      </div>

      {/* Tabla de Usuarios con Baja Satisfacción */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Usuarios con Baja Satisfacción</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satisfacción Promedio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasa de Baja Satisfacción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Entrada</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lowSatisfactionUsers.map((user, index) => (
                <tr key={index} className={parseInt(user.averageSatisfaction) <= 5 ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.averageSatisfaction}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.lowSatisfactionRate}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.latestDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Métricas de Usuario */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Métricas por Usuario</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tareas/Día</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Commits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obstáculos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satisfacción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getUserMetrics().map((user, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.tasksPerDay}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.totalCommits}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.obstaclesCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.avgSatisfaction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StandupDashboard;