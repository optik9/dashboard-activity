import React, { useState } from 'react';

const RecruitmentDashboard = () => {
  // Datos de ejemplo para el dashboard
  const [recruitmentData, setRecruitmentData] = useState({
    // Métricas generales
    totalOpenPositions: 24,
    filledPositions: 18,
    avgTimeToHire: 28,
    activeRecruiters: 5,
    
    // Datos para el gráfico de embudo
    funnelData: {
      applicants: 320,
      screenings: 180,
      interviews: 85,
      technicalTests: 42,
      offers: 25,
      hires: 18
    },
    
    // KPIs por reclutador
    recruiterPerformance: [
      { name: 'Ana Gómez', openPositions: 7, filled: 5, avgDays: 25, candidatesReviewed: 84 },
      { name: 'Carlos López', openPositions: 6, filled: 4, avgDays: 30, candidatesReviewed: 72 },
      { name: 'Maria Sánchez', openPositions: 5, filled: 4, avgDays: 22, candidatesReviewed: 56 },
      { name: 'Jorge Mendoza', openPositions: 4, filled: 3, avgDays: 35, candidatesReviewed: 68 },
      { name: 'Lucia Torres', openPositions: 2, filled: 2, avgDays: 26, candidatesReviewed: 40 }
    ],
    
    // Posiciones abiertas
    openPositions: [
      { id: 1, title: 'Senior Backend Developer', department: 'Ingeniería', priority: 'Alta', daysOpen: 15, candidates: 12, status: 'Entrevistas técnicas' },
      { id: 2, title: 'UX/UI Designer', department: 'Diseño', priority: 'Media', daysOpen: 22, candidates: 8, status: 'Revisión de portafolios' },
      { id: 3, title: 'DevOps Engineer', department: 'Operaciones', priority: 'Alta', daysOpen: 30, candidates: 6, status: 'Ofertas' },
      { id: 4, title: 'Full Stack Developer', department: 'Ingeniería', priority: 'Media', daysOpen: 12, candidates: 15, status: 'Screenings' },
      { id: 5, title: 'QA Automation Engineer', department: 'Calidad', priority: 'Baja', daysOpen: 18, candidates: 10, status: 'Entrevistas iniciales' },
      { id: 6, title: 'Data Scientist', department: 'Data', priority: 'Alta', daysOpen: 25, candidates: 7, status: 'Entrevistas técnicas' }
    ]
  });

  // Estado para filtros y tabs
  const [activeTab, setActiveTab] = useState('overview');
  
  // Función para calcular el porcentaje de conversión entre etapas
  const calculateConversionRate = (current, previous) => {
    return previous ? Math.round((current / previous) * 100) : 0;
  };

  // Componente para los indicadores clave
  const MetricCard = ({ title, value, icon, change, suffix }) => (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-500 text-sm">{title}</span>
        <span className="text-blue-500 text-lg">{icon}</span>
      </div>
      <div className="flex items-baseline">
        <span className="text-2xl font-bold">{value}</span>
        {suffix && <span className="ml-1 text-gray-500">{suffix}</span>}
      </div>
      {change && (
        <div className={`mt-2 text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs mes anterior
        </div>
      )}
    </div>
  );

  // Componente para la barra de progreso del embudo
  const FunnelBar = ({ stage, value, maxValue, percentage, color }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{stage}</span>
        <span className="text-sm text-gray-500">{value} ({percentage}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${color}`}
          style={{ width: `${(value / maxValue) * 100}%` }}
        ></div>
      </div>
    </div>
  );

  // Renderizar componentes basados en la pestaña activa
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard 
              title="Posiciones Abiertas" 
              value={recruitmentData.totalOpenPositions} 
              icon="📋" 
              change={8} 
            />
            <MetricCard 
              title="Posiciones Cubiertas" 
              value={recruitmentData.filledPositions} 
              icon="🎯" 
              change={12} 
            />
            <MetricCard 
              title="Tiempo Promedio de Contratación" 
              value={recruitmentData.avgTimeToHire} 
              icon="⏱️" 
              change={-5} 
              suffix="días"
            />
            <MetricCard 
              title="Tasa de Conversión Oferta-Contratación" 
              value={Math.round(recruitmentData.funnelData.hires / recruitmentData.funnelData.offers * 100)} 
              icon="📈" 
              change={3} 
              suffix="%"
            />
          </div>
        );
      
      case 'funnel':
        const maxApplicants = recruitmentData.funnelData.applicants;
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Embudo de Reclutamiento</h3>
            <FunnelBar 
              stage="Postulantes" 
              value={recruitmentData.funnelData.applicants} 
              maxValue={maxApplicants} 
              percentage={100} 
              color="bg-blue-500"
            />
            <FunnelBar 
              stage="Screenings" 
              value={recruitmentData.funnelData.screenings} 
              maxValue={maxApplicants} 
              percentage={calculateConversionRate(recruitmentData.funnelData.screenings, recruitmentData.funnelData.applicants)} 
              color="bg-blue-400"
            />
            <FunnelBar 
              stage="Entrevistas" 
              value={recruitmentData.funnelData.interviews} 
              maxValue={maxApplicants} 
              percentage={calculateConversionRate(recruitmentData.funnelData.interviews, recruitmentData.funnelData.screenings)} 
              color="bg-blue-300"
            />
            <FunnelBar 
              stage="Pruebas Técnicas" 
              value={recruitmentData.funnelData.technicalTests} 
              maxValue={maxApplicants} 
              percentage={calculateConversionRate(recruitmentData.funnelData.technicalTests, recruitmentData.funnelData.interviews)} 
              color="bg-blue-200"
            />
            <FunnelBar 
              stage="Ofertas" 
              value={recruitmentData.funnelData.offers} 
              maxValue={maxApplicants} 
              percentage={calculateConversionRate(recruitmentData.funnelData.offers, recruitmentData.funnelData.technicalTests)} 
              color="bg-green-300"
            />
            <FunnelBar 
              stage="Contrataciones" 
              value={recruitmentData.funnelData.hires} 
              maxValue={maxApplicants} 
              percentage={calculateConversionRate(recruitmentData.funnelData.hires, recruitmentData.funnelData.offers)} 
              color="bg-green-500"
            />
          </div>
        );
      
      case 'positions':
        return (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Posiciones Abiertas</h3>
              <p className="text-gray-500 text-sm">Seguimiento de todas las posiciones activas</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posición</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días Abierta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidatos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recruitmentData.openPositions.map((position) => (
                    <tr key={position.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{position.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{position.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${position.priority === 'Alta' ? 'bg-red-100 text-red-800' : 
                            position.priority === 'Media' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-green-100 text-green-800'}`}>
                          {position.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        <span className={`${position.daysOpen > 25 ? 'text-red-500 font-medium' : ''}`}>
                          {position.daysOpen}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{position.candidates}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {position.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'recruiters':
        return (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Rendimiento de Reclutadores</h3>
              <p className="text-gray-500 text-sm">Métricas individuales de cada reclutador</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reclutador</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posiciones Abiertas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posiciones Cubiertas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo Promedio (días)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidatos Revisados</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efectividad</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recruitmentData.recruiterPerformance.map((recruiter, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{recruiter.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{recruiter.openPositions}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{recruiter.filled}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{recruiter.avgDays}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{recruiter.candidatesReviewed}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ 
                              width: `${Math.round((recruiter.filled / recruiter.openPositions) * 100)}%` 
                            }}></div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {Math.round((recruiter.filled / recruiter.openPositions) * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
        
      default:
        return <div>No hay datos disponibles</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard de Reclutamiento | Perú</h1>
            <p className="text-gray-500">Métricas y seguimiento de posiciones abiertas</p>
          </div>
          <div className="flex space-x-2">
            <button className="bg-white px-3 py-1 rounded-md shadow text-sm flex items-center">
              <span className="mr-1">🗓️</span> Este Mes
            </button>
            <button className="bg-blue-500 text-white px-3 py-1 rounded-md shadow text-sm">
              Exportar Reporte
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <nav className="flex">
            <button 
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('overview')}
            >
              Resumen General
            </button>
            <button 
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'funnel' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('funnel')}
            >
              Embudo de Reclutamiento
            </button>
            <button 
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'positions' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('positions')}
            >
              Posiciones Abiertas
            </button>
            <button 
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'recruiters' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('recruiters')}
            >
              Rendimiento de Reclutadores
            </button>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="mb-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default RecruitmentDashboard;