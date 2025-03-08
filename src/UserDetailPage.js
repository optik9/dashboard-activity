// UserDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from "react-helmet";
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, 
         Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, 
                Tooltip, Legend, ArcElement, PointElement, LineElement);

// Función segura para convertir duración
const parseDuration = (duration) => {
  if (!duration) return 0;
  const parts = duration.split(':');
  if (parts.length < 3) return 0;
  
  return (
    parseFloat(parts[0]) + 
    (parseFloat(parts[1])/60) + 
    (parseFloat(parts[2])/3600)
  );
};

// Componente Dashboard seguro
const Dashboard = ({ userData }) => {
  const processMetrics = (entries) => {
    const metrics = {
      weeklyActivity: {},
      projectDistribution: {},
      dailyProductivity: {},
      totalHours: 0,
      maxDaily: 0
    };
    


    entries.forEach(entry => {
      const safeEntry = {
        createdAt: entry.createdAt || new Date().toISOString(),
        project_name: entry.project_name || 'Sin proyecto',
        duration: entry.duration || '00:00:00',
        ...entry
      };

      const date = new Date(safeEntry.createdAt);
      const weekNumber = Math.ceil(date.getDate()/7);
      const week = `Week ${weekNumber} (${date.toLocaleDateString('en-US', { month: 'short' })})`;
      const day = date.toLocaleDateString('en-US', { weekday: 'short' }).split('.')[0];
      const hours = parseDuration(safeEntry.duration);
      
      metrics.weeklyActivity[week] = (metrics.weeklyActivity[week] || 0) + hours;
      metrics.projectDistribution[safeEntry.project_name] = 
        (metrics.projectDistribution[safeEntry.project_name] || 0) + hours;
      metrics.dailyProductivity[day] = (metrics.dailyProductivity[day] || 0) + hours;
      metrics.totalHours += hours;
      if(hours > metrics.maxDaily) metrics.maxDaily = hours;
    });

    //const dayOrder = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // Nuevo orden en inglés
    metrics.dailyProductivity = dayOrder.reduce((acc, day) => {
      acc[day] = metrics.dailyProductivity[day] || 0;
      return acc;
    }, {});

    return metrics;
  };

  const metrics = processMetrics(userData);
  
  const chartOptions = (type) => ({
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { 
        display: true, 
        text: type === 'pie' ? 'Project Distribution' : 
              type === 'line' ? 'Weekly Performance' : 'Daily Performance'
      }
    },
    maintainAspectRatio: false
  });

 

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* Tarjeta Resumen */}
      <div className="bg-white p-6 rounded-xl shadow-sm grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-blue-600 mb-1">
            {metrics.totalHours.toFixed(1)}
          </p>
          <p className="text-xs font-medium text-blue-700 uppercase">TOTAL HOURS</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-600 mb-1">
            {Object.keys(metrics.projectDistribution).length}
          </p>
          <p className="text-xs font-medium text-green-700 uppercase">Projects</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-purple-600 mb-1">
            {metrics.maxDaily.toFixed(1)}
          </p>
          <p className="text-xs font-medium text-purple-700 uppercase">Daily record</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="h-64">
          <Pie
            data={{
              labels: Object.keys(metrics.projectDistribution),
              datasets: [{
                data: Object.values(metrics.projectDistribution),
                backgroundColor: ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                borderWidth: 0
              }]
            }}
            options={chartOptions('pie')}
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="h-64">
          <Line
            data={{
              labels: Object.keys(metrics.weeklyActivity),
              datasets: [{
                label: 'Hours',
                data: Object.values(metrics.weeklyActivity),
                borderColor: '#3b82f6',
                backgroundColor: '#3b82f610',
                tension: 0.4,
                fill: true,
                pointRadius: 5
              }]
            }}
            options={chartOptions('line')}
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="h-64">
          <Bar
            data={{
              labels: Object.keys(metrics.dailyProductivity),
              datasets: [{
                label: 'Hours',
                data: Object.values(metrics.dailyProductivity),
                backgroundColor: '#10b98180',
                borderColor: '#10b981',
                borderWidth: 1
              }]
            }}
            options={{
              ...chartOptions('bar'),
              scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Hours' }},
                x: { title: { display: true, text: 'Day of week' }}
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

const UserDetailPage = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;
  

// Agrega estas funciones utilitarias
const formatLocalTime = (utcString) => {
    if (!utcString) return '--:--';
    try {
      const date = new Date(utcString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    } catch {
      return '--:--';
    }
  };
  
  const formatLocalDate = (utcString) => {
    if (!utcString) return '--';
    try {
      const date = new Date(utcString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    } catch {
      return '--';
    }
  };  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://api-trackify-user.vercel.app/api/v1/timesheets/${userId}`
          
        );
        
        if (!response.data.data?.length) {
          throw new Error('No se encontraron registros');
        }
        
        setUserData(response.data.data.map(entry => ({
          time_from: entry.time_from || null,
          time_to: entry.time_to || null,
          duration: entry.duration || '00:00:00',
       
          
          ...entry
        })));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);
  
  const getLatestActivity = (entries) => {
    if (!entries.length) return null;
    return entries.reduce((latest, entry) => 
      new Date(entry.createdAt) > new Date(latest) ? entry.createdAt : latest, 
      entries[0].createdAt
    );
  };
  // Función para ordenar y paginar los registros
const getPaginatedData = () => {
    const sortedData = [...userData].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ).map(entry => ({
      ...entry,
      createdAt: entry.createdAt || new Date().toISOString()
    }));
  
    const startIndex = currentPage * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  };
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error) return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-4">
        <p className="font-medium">Error:</p>
        <p>{error}</p>
      </div>
      <Link to="/usersPage" className="text-indigo-600 hover:text-indigo-800">
        ← Back
      </Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <Link to="/usersPage" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </Link>
      
      <div className="bg-white rounded-xl shadow-sm p-6 lg:p-8">
     
      <header className="mb-8">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Employee productivity - Trackify</title>
      </Helmet>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
        Productivity Report | Trackify - {userData[0]?.user_name || 'Usuario desconocido'}
        </h1>

 {/* Status y Location */}
 <div className="flex items-center gap-4 mt-3">
      <div className="flex items-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full ${
          userData[0]?.status === 'active' ? 'bg-green-500' : 'bg-red-500'
        }`}></span>
        <span className="text-sm font-medium text-gray-600 capitalize">
          {userData[0]?.status || 'No status'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <span className="text-sm text-gray-600">
          {userData[0]?.location || 'Remote'}
        </span>
      </div>
    

    <span className="text-sm text-gray-600">•</span>
    <span className="text-sm text-gray-600">
    {userData.length} found records • Last activity: {' '}
    {new Date(getLatestActivity(userData)).toLocaleDateString('en-US', {
      day: 'numeric', month: 'long', year: 'numeric'
    })}
  </span>
  </div>
  
</header>

        <Dashboard userData={userData} />

   
<section className="mt-10">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-semibold">Detail Records</h2>
    
    {/* Controles de paginación */}
    <div className="flex items-center gap-2">
      <button
        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
        disabled={currentPage === 0}
        className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      
      <span className="text-sm text-gray-600">
        Page {currentPage + 1} de {Math.ceil(userData.length / itemsPerPage)}
      </span>
      
      <button
        onClick={() => setCurrentPage(p => 
          Math.min(p + 1, Math.ceil(userData.length / itemsPerPage) - 1)
        )}
        disabled={currentPage >= Math.ceil(userData.length / itemsPerPage) - 1}
        className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  </div>

  <div className="space-y-3">
    {getPaginatedData().map((entry, index) => {
      const originalIndex = currentPage * itemsPerPage + index + 1;
      //const timeFrom = entry.time_from?.slice(11,16) || '--:--';
      //const timeTo = entry.time_to?.slice(11,16) || '--:--';
      
      return (
        <div key={`${currentPage}-${index}`} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 w-8">#{originalIndex}</span>
            <div>
              <h3 className="font-medium text-gray-900">
                {entry.project_name || 'Proyecto no especificado'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {entry.description || 'Sin descripción'}
              </p>
              {entry.createdAt && (
                <time className="text-xs text-gray-500 block mt-2">
                {formatLocalDate(entry.createdAt)} • 
                {formatLocalTime(entry.time_from)} - {formatLocalTime(entry.time_to)}
              </time>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
              {parseDuration(entry.duration).toFixed(1)}h
            </span>
            {entry.location && (
              <span className="block mt-1 text-xs text-gray-500">
                {entry.location}
              </span>
            )}
          </div>
        </div>
      );
    })}
  </div>

  {/* Controles de paginación inferiores */}
  <div className="mt-4 flex justify-end">
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">
      Showing {getPaginatedData().length} of {userData.length} records
      </span>
      <select
        value={currentPage}
        onChange={(e) => setCurrentPage(Number(e.target.value))}
        className="px-2 py-1 text-sm border rounded-md"
      >
        {Array.from({ length: Math.ceil(userData.length / itemsPerPage) }).map((_, i) => (
          <option key={i} value={i}>
            Page {i + 1}
          </option>
        ))}
      </select>
    </div>
  </div>

  
</section>
      </div>
    </div>
  );
};

export default UserDetailPage;