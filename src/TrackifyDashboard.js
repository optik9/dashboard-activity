import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, PieChart, Pie, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from "recharts";
import { Target, AlertTriangle, Users, Clock } from 'lucide-react';
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import db from './firebaseConfig';


const TrackifyDashboard = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [locationFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const trackifyRef = collection(db, "uploadedDataUploadTrackify");
        const q = query(trackifyRef, orderBy("Start Date", "desc"));
        const querySnapshot = await getDocs(q);
        const trackifyData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(trackifyData);
        setFilteredData(trackifyData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
        const itemDate = new Date(item['Start Date']);
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        return itemDate >= start && itemDate <= end;
      });
    }

    setFilteredData(filtered);
  }, [locationFilter, projectFilter, dateRange, data]);

  // Project Hours
  const getProjectHours = () => {
    const projectHours = filteredData.reduce((acc, item) => {
      const project = item.Project;
      const hours = parseFloat(item['Time (Decimal)']) || 0;
      acc[project] = (acc[project] || 0) + hours;
      return acc;
    }, {});
    return Object.entries(projectHours)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  };

  // User Productivity
  const getUserProductivity = () => {
    const userProductivity = filteredData.reduce((acc, item) => {
      const user = item.User;
      const hours = parseFloat(item['Time (Decimal)']) || 0;
      acc[user] = (acc[user] || 0) + hours;
      return acc;
    }, {});
    return Object.entries(userProductivity)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  };

  // Billable Distribution
  const getBillableDistribution = () => {
    const billable = filteredData.filter(item => item.Billable === 'Yes').length;
    const nonBillable = filteredData.length - billable;
    return [
      { name: 'Billable', value: billable },
      { name: 'Non-Billable', value: nonBillable }
    ];
  };

  // Task Duration Distribution
  const getTaskDurationDistribution = () => {
    const durationRanges = {
      '0-2 hours': 0,
      '2-4 hours': 0,
      '4-6 hours': 0,
      '6-8 hours': 0,
      '8+ hours': 0
    };

    filteredData.forEach(item => {
      const duration = parseFloat(item['Time (Decimal)']);
      if (duration <= 2) durationRanges['0-2 hours']++;
      else if (duration <= 4) durationRanges['2-4 hours']++;
      else if (duration <= 6) durationRanges['4-6 hours']++;
      else if (duration <= 8) durationRanges['6-8 hours']++;
      else durationRanges['8+ hours']++;
    });

    return Object.entries(durationRanges).map(([name, value]) => ({ name, value }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Trackify Dashboard</h1>
        <p className="text-gray-600">Team Performance Analytics</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>

        
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Project Hours */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center mb-4">
            <Target className="w-6 h-6 text-blue-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">Project Hours</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getProjectHours()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {getProjectHours().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Productivity */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-green-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">User Productivity</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getUserProductivity()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Billable Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">Billable Distribution</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getBillableDistribution()}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {getBillableDistribution().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Task Duration Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center mb-4">
            <Clock className="w-6 h-6 text-purple-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">Task Duration Distribution</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getTaskDurationDistribution()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {getTaskDurationDistribution().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white p-6 rounded-xl shadow-md overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["User", "Project", "Task Description", "Date", "Duration", "Billable"].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.slice(0, 10).map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.User}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.Project}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item['Task Description']}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item['Start Date']}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.Duration}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.Billable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrackifyDashboard;

