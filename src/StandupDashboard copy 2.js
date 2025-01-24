import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from "recharts";
import { Calendar, Target, AlertTriangle, CheckCircle, Users, MapPin } from "lucide-react";
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
        //analyzeLowSatisfaction(standupData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  

  // Objective Status Analysis
  const getObjectiveMetrics = () => {
    const total = filteredData.length;
    const onTrack = filteredData.filter(item => item.objective_on_track === "True").length;
    return [
      { name: "On Track", value: onTrack },
      { name: "Off Track", value: total - onTrack }
    ];
  };

  // Obstacles Analysis
  const getObstaclesData = () => {
    const obstaclesCount = filteredData.reduce((acc, item) => {
      if (item.has_obstacles === "True") {
        const key = item.obstacles || "Unspecified";
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(obstaclesCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Productivity by Location
  const getLocationMetrics = () => {
    const locationData = filteredData.reduce((acc, item) => {
      if (!acc[item.Location]) {
        acc[item.Location] = {
          location: item.Location,
          totalTasks: 0,
          totalCommits: 0,
          entries: 0
        };
      }
      acc[item.Location].totalTasks += parseInt(item.task_count || 0);
      acc[item.Location].totalCommits += parseInt(item.commit_count || 0);
      acc[item.Location].entries += 1;
      return acc;
    }, {});

    return Object.values(locationData).map(loc => ({
      location: loc.location,
      tasksPerDay: (loc.totalTasks / loc.entries).toFixed(2),
      commitsPerDay: (loc.totalCommits / loc.entries).toFixed(2)
    }));
  };

  // Project Satisfaction
  const getProjectSatisfaction = () => {
    const projectData = filteredData.reduce((acc, item) => {
      if (!acc[item.Project]) {
        acc[item.Project] = {
          project: item.Project,
          totalSatisfaction: 0,
          entries: 0
        };
      }
      acc[item.Project].totalSatisfaction += parseInt(item.satisfaction || 0);
      acc[item.Project].entries += 1;
      return acc;
    }, {});

    return Object.values(projectData)
      .map(proj => ({
        name: proj.project,
        satisfaction: (proj.totalSatisfaction / proj.entries).toFixed(2)
      }))
      .sort((a, b) => b.satisfaction - a.satisfaction);
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
        <h1 className="text-2xl font-bold text-gray-800">Standup Dashboard</h1>
        <p className="text-gray-600">Team Performance Analytics</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="">All Locations</option>
            {[...new Set(data.map(item => item.Location))].map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>

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
        {/* Objective Status */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center mb-4">
            <Target className="w-6 h-6 text-blue-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">Objectives Status</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getObjectiveMetrics()}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {getObjectiveMetrics().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Obstacles Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">Obstacles Distribution</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getObstaclesData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {getObstaclesData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Location Productivity */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center mb-4">
            <MapPin className="w-6 h-6 text-green-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">Productivity by Location</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getLocationMetrics()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="location" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="tasksPerDay" name="Tasks/Day" fill="#0088FE" />
              <Bar dataKey="commitsPerDay" name="Commits/Day" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Project Satisfaction */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-purple-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-800">Project Satisfaction</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getProjectSatisfaction()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="satisfaction" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables Section */}
      <div className="space-y-6">
        {/* Low Satisfaction Users Table */}
        <div className="bg-white p-6 rounded-xl shadow-md overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Users with Low Satisfaction</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["User", "Location", "Avg. Satisfaction", "Low Satisfaction Rate", "Latest Entry"].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lowSatisfactionUsers.map((user, index) => (
                  <tr key={index} className={parseInt(user.averageSatisfaction) <= 5 ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{user.user}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{user.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{user.averageSatisfaction}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{user.lowSatisfactionRate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{user.latestDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandupDashboard;