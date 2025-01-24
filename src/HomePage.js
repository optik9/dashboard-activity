import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-10">Navigation</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Upload Functions</h2>
          <div className="space-y-4">
            <button
              className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg shadow-lg hover:bg-blue-600 transition"
              onClick={() => navigate('/upload')}
            >
              Upload Data Standup
            </button>
            <button
              className="w-full bg-green-500 text-white py-3 px-6 rounded-lg shadow-lg hover:bg-green-600 transition"
              onClick={() => navigate('/uploadTrackify')}
            >
              Upload Data Trackify
            </button>
            <button
              className="w-full bg-purple-500 text-white py-3 px-6 rounded-lg shadow-lg hover:bg-purple-600 transition"
              onClick={() => navigate('/uploadEmployee')}
            >
              Upload Employee
            </button>
          </div>
        </div>

        {/* Dashboard Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Dashboards</h2>
          <div className="space-y-4">
            <button
              className="w-full bg-teal-500 text-white py-3 px-6 rounded-lg shadow-lg hover:bg-teal-600 transition"
              onClick={() => navigate('/standupDashboard')}
            >
              Standup Dashboard
            </button>
            <button
              className="w-full bg-red-500 text-white py-3 px-6 rounded-lg shadow-lg hover:bg-red-600 transition"
              onClick={() => navigate('/trackifyDashboard')}
            >
              Trackify Dashboard
            </button>
            <button
              className="w-full bg-yellow-500 text-white py-3 px-6 rounded-lg shadow-lg hover:bg-yellow-600 transition"
              onClick={() => navigate('/dashboard')}
            >
              Employee Dashboard
            </button>
            <button
              className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg shadow-lg hover:bg-yellow-600 transition"
              onClick={() => navigate('/userActivity')}
            >
              User Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;