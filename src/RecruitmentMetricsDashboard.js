import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import db from './firebaseConfig';

const initialForm = {
  quarter: '',
  startEmployees: '',
  endEmployees: '',
  newHires: '',
  voluntaryLeaves: '',
  involuntaryLeaves: ''
};

const RecruitmentMetricsDashboard = () => {
  const [form, setForm] = useState(initialForm);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos de Firebase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const q = query(collection(db, 'recruitmentMetrics'), orderBy('quarter'));
      const querySnapshot = await getDocs(q);
      setRecords(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchData();
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Guardar en Firebase
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      startEmployees: Number(form.startEmployees),
      endEmployees: Number(form.endEmployees),
      newHires: Number(form.newHires),
      voluntaryLeaves: Number(form.voluntaryLeaves),
      involuntaryLeaves: Number(form.involuntaryLeaves)
    };
    await addDoc(collection(db, 'recruitmentMetrics'), data);
    setForm(initialForm);
    // Recargar datos
    const q = query(collection(db, 'recruitmentMetrics'), orderBy('quarter'));
    const querySnapshot = await getDocs(q);
    setRecords(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // Cálculo de métricas
  const calculateMetrics = (rec) => {
    const { startEmployees, endEmployees, newHires, voluntaryLeaves, involuntaryLeaves } = rec;
    const retention = startEmployees > 0
      ? ((endEmployees - newHires) / startEmployees) * 100
      : 0;
    const turnover = startEmployees > 0
      ? ((Number(voluntaryLeaves) + Number(involuntaryLeaves)) / startEmployees) * 100
      : 0;
    const voluntaryTurnover = startEmployees > 0
      ? (Number(voluntaryLeaves) / startEmployees) * 100
      : 0;
    const involuntaryTurnover = startEmployees > 0
      ? (Number(involuntaryLeaves) / startEmployees) * 100
      : 0;
    return {
      retention: retention.toFixed(2),
      turnover: turnover.toFixed(2),
      voluntaryTurnover: voluntaryTurnover.toFixed(2),
      involuntaryTurnover: involuntaryTurnover.toFixed(2)
    };
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard de Métricas de Reclutamiento</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8 grid gap-4">
        <div>
          <label className="block font-medium">Trimestre (ej: Q1 2024)</label>
          <input
            type="text"
            name="quarter"
            value={form.quarter}
            onChange={handleChange}
            required
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block font-medium">Empleados al inicio</label>
          <input
            type="number"
            name="startEmployees"
            value={form.startEmployees}
            onChange={handleChange}
            required
            min={0}
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block font-medium">Empleados al final</label>
          <input
            type="number"
            name="endEmployees"
            value={form.endEmployees}
            onChange={handleChange}
            required
            min={0}
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block font-medium">Nuevos empleados</label>
          <input
            type="number"
            name="newHires"
            value={form.newHires}
            onChange={handleChange}
            required
            min={0}
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block font-medium">Bajas voluntarias</label>
          <input
            type="number"
            name="voluntaryLeaves"
            value={form.voluntaryLeaves}
            onChange={handleChange}
            required
            min={0}
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block font-medium">Bajas involuntarias</label>
          <input
            type="number"
            name="involuntaryLeaves"
            value={form.involuntaryLeaves}
            onChange={handleChange}
            required
            min={0}
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Guardar métricas
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-4">Historial de Métricas</h2>
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="p-2 border">Trimestre</th>
              <th className="p-2 border">Retención (%)</th>
              <th className="p-2 border">Rotación (%)</th>
              <th className="p-2 border">Rotación Voluntaria (%)</th>
              <th className="p-2 border">Rotación Involuntaria (%)</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => {
              const metrics = calculateMetrics(rec);
              return (
                <tr key={rec.id}>
                  <td className="p-2 border">{rec.quarter}</td>
                  <td className="p-2 border">{metrics.retention}</td>
                  <td className="p-2 border">{metrics.turnover}</td>
                  <td className="p-2 border">{metrics.voluntaryTurnover}</td>
                  <td className="p-2 border">{metrics.involuntaryTurnover}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RecruitmentMetricsDashboard; 