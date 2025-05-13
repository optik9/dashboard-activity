import React, { useState } from 'react';

const RecruitmentDashboardForm = () => {
  const [formData, setFormData] = useState({
    totalOpenPositions: '',
    filledPositions: '',
    avgTimeToHire: '',
    activeRecruiters: '',
    funnelData: {
      applicants: '',
      screenings: '',
      interviews: '',
      technicalTests: '',
      offers: '',
      hires: ''
    },
    newRecruiter: {
      name: '',
      openPositions: '',
      filled: '',
      avgDays: '',
      candidatesReviewed: ''
    },
    recruiters: [],
    newPosition: {
      title: '',
      department: '',
      priority: 'Media',
      daysOpen: '',
      candidates: '',
      status: ''
    },
    openPositions: []
  });

  const [activeTab, setActiveTab] = useState('metrics');

  const handleInputChange = (e, section) => {
    const { name, value } = e.target;
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const addRecruiter = () => {
    setFormData(prev => ({
      ...prev,
      recruiters: [...prev.recruiters, prev.newRecruiter],
      newRecruiter: {
        name: '',
        openPositions: '',
        filled: '',
        avgDays: '',
        candidatesReviewed: ''
      }
    }));
  };

  const addPosition = () => {
    setFormData(prev => ({
      ...prev,
      openPositions: [...prev.openPositions, {
        ...prev.newPosition,
        id: Date.now()
      }],
      newPosition: {
        title: '',
        department: '',
        priority: 'Media',
        daysOpen: '',
        candidates: '',
        status: ''
      }
    }));
  };

  const deleteRecruiter = (index) => {
    setFormData(prev => ({
      ...prev,
      recruiters: prev.recruiters.filter((_, i) => i !== index)
    }));
  };

  const deletePosition = (id) => {
    setFormData(prev => ({
      ...prev,
      openPositions: prev.openPositions.filter(pos => pos.id !== id)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar los datos al backend
    console.log('Datos enviados:', formData);
    alert('Datos guardados exitosamente');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Gestión de Datos de Reclutamiento</h1>
        
        {/* Tabs de navegación */}
        <div className="bg-white rounded-lg shadow mb-6">
          <nav className="flex">
            {['metrics', 'funnel', 'recruiters', 'positions'].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-3 text-sm font-medium ${
                  activeTab === tab 
                    ? 'text-blue-600 border-b-2 border-blue-500' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {{
                  metrics: 'Métricas Generales',
                  funnel: 'Embudo',
                  recruiters: 'Reclutadores',
                  positions: 'Posiciones'
                }[tab]}
              </button>
            ))}
          </nav>
        </div>

        {/* Formulario principal */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          {activeTab === 'metrics' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Métricas Generales</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Posiciones Abiertas</label>
                  <input
                    type="number"
                    name="totalOpenPositions"
                    value={formData.totalOpenPositions}
                    onChange={(e) => handleInputChange(e)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Posiciones Cubiertas</label>
                  <input
                    type="number"
                    name="filledPositions"
                    value={formData.filledPositions}
                    onChange={(e) => handleInputChange(e)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tiempo Promedio Contratación (días)</label>
                  <input
                    type="number"
                    name="avgTimeToHire"
                    value={formData.avgTimeToHire}
                    onChange={(e) => handleInputChange(e)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reclutadores Activos</label>
                  <input
                    type="number"
                    name="activeRecruiters"
                    value={formData.activeRecruiters}
                    onChange={(e) => handleInputChange(e)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'funnel' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Datos del Embudo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData.funnelData).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input
                      type="number"
                      name={key}
                      value={value}
                      onChange={(e) => handleInputChange(e, 'funnelData')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'recruiters' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Gestión de Reclutadores</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {Object.entries(formData.newRecruiter).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input
                      type={key === 'name' ? 'text' : 'number'}
                      name={key}
                      value={value}
                      onChange={(e) => handleInputChange(e, 'newRecruiter')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                      required
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRecruiter}
                  className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Agregar Reclutador
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posiciones Abiertas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posiciones Cubiertas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.recruiters.map((recruiter, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4">{recruiter.name}</td>
                        <td className="px-6 py-4">{recruiter.openPositions}</td>
                        <td className="px-6 py-4">{recruiter.filled}</td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => deleteRecruiter(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'positions' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Gestión de Posiciones Abiertas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {Object.entries(formData.newPosition).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 capitalize">
                      {key}
                    </label>
                    {key === 'priority' ? (
                      <select
                        name={key}
                        value={value}
                        onChange={(e) => handleInputChange(e, 'newPosition')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                      >
                        <option value="Alta">Alta</option>
                        <option value="Media">Media</option>
                        <option value="Baja">Baja</option>
                      </select>
                    ) : (
                      <input
                        type={['daysOpen', 'candidates'].includes(key) ? 'number' : 'text'}
                        name={key}
                        value={value}
                        onChange={(e) => handleInputChange(e, 'newPosition')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        required
                      />
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPosition}
                  className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Agregar Posición
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departamento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.openPositions.map((position) => (
                      <tr key={position.id}>
                        <td className="px-6 py-4">{position.title}</td>
                        <td className="px-6 py-4">{position.department}</td>
                        <td className="px-6 py-4">{position.priority}</td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => deletePosition(position.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              type="submit"
              className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 float-right"
            >
              Guardar Todos los Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecruitmentDashboardForm;