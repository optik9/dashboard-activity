import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import db from "./firebaseConfig";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Logo from "./OutcodeWorkMarkColor.png";

const formatDate = (date) => {
  const options = { month: 'short', day: 'numeric' };
  const formattedDate = new Date(date).toLocaleDateString('en-US', options);
  return formattedDate;
};

const formatWeekRange = (startDate, endDate) => {
  // Añadir 1 día a ambas fechas para ajustar a semana laboral
  const adjustedStart = new Date(startDate);
  adjustedStart.setDate(adjustedStart.getDate() + 1);
  
  const adjustedEnd = new Date(endDate);
  adjustedEnd.setDate(adjustedEnd.getDate() + 1);

  const start = formatDate(adjustedStart);
  const end = formatDate(adjustedEnd);
  return `${start}-${end}`;
};

const EmployeeStats = () => {
  const [data, setData] = useState([]);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [goal, setGoal] = useState(97.22);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const groupedMonths = useMemo(() => {
    if (data.length === 0) return [];
    
    // Agrupar por mes-año
    const monthsMap = data.reduce((acc, entry) => {
      const key = entry.monthYear;
      if (!acc[key]) {
        acc[key] = {
          monthName: entry.monthName,
          weeks: [],
          startDate: entry.startDate
        };
      }
      acc[key].weeks.push(entry);
      return acc;
    }, {});
  
    // Convertir a array y ordenar cronológicamente
    return Object.entries(monthsMap)
      .map(([monthYear, { monthName, weeks, startDate }]) => ({
        monthYear,
        monthName,
        weeks,
        startDate
      }))
      .sort((a, b) => a.startDate - b.startDate);
      
  }, [data]);

  useEffect(() => {
    if (groupedMonths.length > 0) {
      // Establecer el último mes (más reciente) como inicial
      setCurrentMonthIndex(groupedMonths.length - 1);
    }
  }, [groupedMonths]); // Se ejecuta cuando cambia groupedMonths

  useEffect(() => {
    
    
    const fetchPerformanceData = async () => {
      try {
        setIsLoading(true);
        const q = query(collection(db, 'performanceRecords'), orderBy('startDate'));
        const querySnapshot = await getDocs(q);
        
        const performanceData = querySnapshot.docs.map(doc => {
          const docData = doc.data();
          
          // Ajustar fechas sumando 1 día
          const adjustedStart = new Date(docData.startDate);
          adjustedStart.setDate(adjustedStart.getDate() + 1);
          
          // Obtener mes y año
          const year = adjustedStart.getFullYear();
          const month = adjustedStart.getMonth() + 1; // 1-12
          const monthYear = `${year}-${String(month).padStart(2, '0')}`;
          const monthName = adjustedStart.toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
          });
        
          return {
            week: formatWeekRange(docData.startDate, docData.endDate),
            trackify: docData.trackifyRecords,
            standup: docData.standupRecords,
            goal: docData.goal || goal,
            monthYear,
            monthName,
            startDate: adjustedStart // Para ordenamiento
          };
        });

        setData(performanceData);

        
        
        // Update goal if different in the last document
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1]?.data();
        if (lastDoc && lastDoc.goal) {
          setGoal(lastDoc.goal);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching performance data:", error);
        setError(error);
        setIsLoading(false);
      }
    };

    fetchPerformanceData();
  }, []);

  

  const handlePreviousMonth = () => {
    setCurrentMonthIndex(prev => Math.max(prev - 1, 0));
  };

  const handleNextMonth = () => {
    setCurrentMonthIndex(prev => Math.min(prev + 1, groupedMonths.length - 1));
  };

  // Safely get current week and previous week
  const currentWeek = data[data.length - 1] || { 
    week: 'N/A', 
    trackify: 0, 
    standup: 0 
  };
  const previousWeek = data.length > 1 ? data[data.length - 2] : { 
    week: 'N/A', 
    trackify: 0, 
    standup: 0 
  };

  // Loading and Error States
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Loading performance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-red-50">
        <div className="text-xl text-red-600">
          Error loading performance data. Please try again later.
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">No performance data available.</div>
      </div>
    );
  }
  //const goal = 97.22;

  const getValueColor = (value) => {
    if (value < 70) return '#000000';
    if (value < 80) return '#EF4444';
    if (value < 90) return '#F59E0B';
    if (value < 95) return '#10B981';
    return '#047857';
  };

  const ValueIndicator = ({ value }) => (
    <span style={{ 
      color: getValueColor(value),
      fontWeight: 600,
      fontSize: '2.25rem',
      fontFeatureSettings: '"tnum"'
    }}>
      {value.toFixed(2)}%
    </span>
  );

  const DeltaIndicator = ({ value }) => (
    <span style={{ 
      color: value >= 0 ? '#16a34a' : '#dc2626', 
      fontWeight: 600,
      fontSize: '1.125rem',
      fontFeatureSettings: '"tnum"'
    }}>
      {value >= 0 ? '↑' : '↓'} {Math.abs(value).toFixed(2)}
    </span>
  );

  const ColorLegend = () => (
    <div className="color-legend mt-8 p-6 bg-white rounded-xl shadow-sm border border-slate-100">
      <h4 className="text-base font-semibold text-slate-800 mb-4">Color Legend</h4>
      <div className="flex flex-wrap gap-6">
        {[
            { range: '< 70%', color: '#000000' },
            { range: '70% - 79.99%', color: '#EF4444' },
            { range: '80% - 89.99%', color: '#F59E0B' },
            { range: '90% - 94.99%', color: '#10B981' },
            { range: '95% - 100%', color: '#047857' }
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-sm border border-slate-200" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-slate-600 font-medium">{item.range}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Scorecard Operations Peru</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            Current Week: <span className="text-slate-700">{currentWeek.week}</span> • 
            Previous: <span className="text-slate-700">{previousWeek.week}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <img src={Logo} alt="Outcode Logo" className="w-32 h-auto" />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid grid gap-6 mb-8">
        <div className="metric-card bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Trackify Compliance</h3>
          </div>
          <div className="metric-values">
            <div className="flex justify-between items-center">
              <ValueIndicator value={currentWeek.trackify} />
              <DeltaIndicator value={currentWeek.trackify - previousWeek.trackify} />
            </div>
            <div className="mt-3 text-sm text-slate-500 font-medium bg-slate-50 px-3 py-2 rounded-lg">
              <span className="block">Previous: {previousWeek.trackify.toFixed(2)}%</span>
              <span className="block">Target: {goal}%</span>
            </div>
          </div>
        </div>

        <div className="metric-card bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Standup Consistency</h3>
          </div>
          <div className="metric-values">
            <div className="flex justify-between items-center">
              <ValueIndicator value={currentWeek.standup} />
              <DeltaIndicator value={currentWeek.standup - previousWeek.standup} />
            </div>
            <div className="mt-3 text-sm text-slate-500 font-medium bg-slate-50 px-3 py-2 rounded-lg">
              <span className="block">Previous: {previousWeek.standup.toFixed(2)}%</span>
              <span className="block">Target: {goal}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-container bg-white p-6 rounded-xl shadow-sm mb-8 border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800">Performance Trend</h3>
          <div className="flex gap-2">
            <button className="text-slate-600 hover:bg-slate-50 px-3 py-1 rounded-lg text-sm font-medium transition-colors">
              3M
            </button>
            <button className="text-slate-600 hover:bg-slate-50 px-3 py-1 rounded-lg text-sm font-medium transition-colors">
              6M
            </button>
            <button className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-sm font-medium">
              YTD
            </button>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="week" 
                stroke="#64748b"
                tick={{ fill: '#475569', fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="#64748b"
                tick={{ fill: '#475569', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => (
                  <span className="text-slate-600 text-sm font-medium">{value}</span>
                )}
              />
              <Line 
                type="monotone" 
                dataKey="trackify" 
                name="Trackify" 
                stroke={getValueColor(currentWeek.trackify)}
                strokeWidth={2}
                dot={{ fill: getValueColor(currentWeek.trackify), strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="standup" 
                name="Standup" 
                stroke={getValueColor(currentWeek.standup)}
                strokeWidth={2}
                dot={{ fill: getValueColor(currentWeek.standup), strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="goal" 
                name="Goal" 
                stroke="#475569" 
                strokeDasharray="5 5"
                strokeOpacity={0.6}
                strokeWidth={1.5}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
                {/* Monthly Breakdown */}
      <div className="table-container bg-white rounded-xl shadow-sm mb-8 overflow-hidden border border-slate-100">
        <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-800">
  Monthly Breakdown - {groupedMonths[currentMonthIndex]?.monthName}
</h3>
          <div className="flex gap-2">
          <button
              onClick={handlePreviousMonth}
              disabled={currentMonthIndex === 0}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button
              onClick={handleNextMonth}
              disabled={currentMonthIndex === groupedMonths.length - 1}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
        
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Week</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Trackify</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Δ</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Standup</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-slate-600">Δ</th>
            </tr>
          </thead>
          <tbody>
            {groupedMonths[currentMonthIndex]?.weeks.map((week, index, weeksArray) => (
              <tr key={week.week} className="hover:bg-slate-50 transition-colors border-t border-slate-100">
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{week.week}</td>
                <td className="px-6 py-4">
                  <span style={{ color: getValueColor(week.trackify) }} className="font-medium">
                    {week.trackify.toFixed(2)}%
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {index > 0 ? (
                    <DeltaIndicator value={week.trackify - weeksArray[index - 1].trackify} />
                  ) : '-'}
                </td>
                <td className="px-6 py-4">
                  <span style={{ color: getValueColor(week.standup) }} className="font-medium">
                    {week.standup.toFixed(2)}%
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {index > 0 ? (
                    <DeltaIndicator value={week.standup - weeksArray[index - 1].standup} />
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ColorLegend />

      <style jsx>{`
        .dashboard-container {
          max-width: 1440px;
          margin: 2rem auto;
          padding: 0 2rem;
        }
        
        .metrics-grid {
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        }

        .chart-container {
          background: linear-gradient(to bottom right, #ffffff 0%, #f8fafc 100%);
        }

        table {
          border-collapse: separate;
          border-spacing: 0;
        }

        th {
          background-color: #f8fafc;
        }

        td, th {
          padding: 14px 24px;
        }

        tr:not(:last-child) td {
          border-bottom: 1px solid #f1f5f9;
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 0 1rem;
          }
          
          .metrics-grid {
            grid-template-columns: 1fr;
          }
          
          .chart-container {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default EmployeeStats;