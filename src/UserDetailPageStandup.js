// UserStandupDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const processChartData = (standups) => {
  const dailyData = standups.reduce((acc, entry) => {
    const date = new Date(entry.date).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        date,
        commits: 0,
        tasks: 0,
        satisfaction: 0,
        count: 0,
        hasObstacles: 0
      };
    }
    acc[date].commits += entry.commit_count;
    acc[date].tasks += entry.task_count;
    acc[date].satisfaction += entry.satisfaction;
    acc[date].count += 1;
    acc[date].hasObstacles += entry.has_obstacles ? 1 : 0;
    return acc;
  }, {});

  return Object.values(dailyData)
    .map(day => ({
      ...day,
      satisfaction: Math.round((day.satisfaction / day.count) * 10) / 10,
      obstaclePercentage: (day.hasObstacles / day.count) * 100
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

const UserDetailPageStandup = () => {
  const { userId } = useParams();
  const [standups, setStandups] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const sortedStandups = [...standups].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

   // Calcular items para paginación
   const indexOfLastItem = currentPage * itemsPerPage;
   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
   const currentStandups = sortedStandups.slice(indexOfFirstItem, indexOfLastItem);
   const totalPages = Math.ceil(sortedStandups.length / itemsPerPage);

    // Función para cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    const fetchStandups = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://api-standup-user.vercel.app/api/v1/standups/${userId}`
        );

        if (!response.data.data || response.data.data.length === 0) {
          throw new Error('No se encontraron registros para este usuario');
        }

        setUserInfo({
          name: response.data.data[0].user_name,
          status: response.data.data[0].status,
          location: response.data.data[0].location
        });

        setStandups(response.data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStandups();
  }, [userId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) 
  };

  

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Link to="/userPageStandup" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6 lg:p-8">
            <header className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {userInfo.name}'s Standup Report
              </h1>
              <div className="mt-4 flex gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  userInfo.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {userInfo.status}
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                  🌍 {userInfo.location}
                </span>
              </div>
            </header>

            {/* Sección de Métricas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Satisfacción Diaria</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={processChartData(standups)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 6]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="satisfaction"
                        stroke="#8884d8"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Actividad Diaria</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processChartData(standups)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="tasks" fill="#82ca9d" />
                      <Bar dataKey="commits" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Obstáculos</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Con Obstáculos', value: standups.filter(s => s.has_obstacles).length },
                            { name: 'Sin Obstáculos', value: standups.filter(s => !s.has_obstacles).length }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          label
                        >
                          {[0, 1].map((entry, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Objetivos</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'On Track', value: standups.filter(s => s.objective_on_track).length },
                            { name: 'Off Track', value: standups.filter(s => !s.objective_on_track).length }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          label
                        >
                          {[0, 1].map((entry, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>



                {/* Lista de Standups */}
<div className="mt-10">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-semibold">Registros de Standups</h2>
    
    {/* Controles de paginación superiores */}
    <div className="flex items-center gap-2">
      <button
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Anterior
      </button>
      
      <span className="text-sm text-gray-600">
        Página {currentPage} de {totalPages}
      </span>
      
      <button
        onClick={() => paginate(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Siguiente
      </button>
    </div>
  </div>

  <div className="space-y-3">
    {currentStandups.map((standup, index) => {
      const orderNumber = (currentPage - 1) * itemsPerPage + index + 1;
      
      return (
        <div key={index} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 w-8">#{orderNumber}</span>
            <div>
              <h3 className="font-medium text-gray-900">
                {standup.project_name}
              </h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Comentarios:</span> {standup.task_comment}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Commits:</span> {standup.commit_count}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Obstáculos:</span> {standup.has_obstacles ? 'Sí' : 'No'}
                </p>
                {standup.has_obstacles && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Detalles obstáculos:</span> {standup.obstacles}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Satisfacción:</span> {standup.satisfaction}/10
                </p>
              </div>
              <time className="text-xs text-gray-500 block mt-2">
                {formatDate(standup.date)}
              </time>
            </div>
          </div>
          
          <div className="text-right">
            <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
              {standup.exact_standup_time}
            </span>
            <span className="block mt-1 text-xs text-gray-500">
              {standup.location}
            </span>
          </div>
        </div>
      );
    })}
  </div>

  {/* Controles de paginación inferiores */}
  <div className="mt-4 flex justify-between items-center">
    <span className="text-sm text-gray-600">
      Mostrando {currentStandups.length} de {sortedStandups.length} registros
    </span>
    
    <div className="flex items-center gap-2">
      <select
        value={currentPage}
        onChange={(e) => paginate(Number(e.target.value))}
        className="px-2 py-1 text-sm border rounded-md"
      >
        {Array.from({ length: totalPages }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            Página {i + 1}
          </option>
        ))}
      </select>
      
      <span className="text-sm text-gray-600">
        {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedStandups.length)} de {sortedStandups.length}
      </span>
    </div>
  </div>
</div>

            
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetailPageStandup;