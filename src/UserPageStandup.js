import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Helmet } from "react-helmet";

const UserPageStandup = () => {
  const [users, setUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Agrega esto antes del useEffect
  const locationColors = {
    Peru: 'bg-blue-100 text-blue-800',
    Nepal: 'bg-green-100 text-green-800',
    USA: 'bg-red-100 text-red-800',
    Other: 'bg-gray-100 text-gray-800'
  };


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const params = {};
        if (statusFilter !== 'all') params.status = statusFilter;
        if (locationFilter !== 'all') params.location = locationFilter;
        
        const response = await axios.get('https://api-standup-user.vercel.app/api/v1/users', { params });
        setUsers(response.data.data);
      } catch (err) {
        setError('Error loading users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [statusFilter, locationFilter]);



  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Link to="/data4" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Employee productivity - Standup</title>
      </Helmet>
      
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Employee productivity - Standup</h1>
        
        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All</option>
                <option value="Peru">Peru</option>
                <option value="USA">USA</option>
                <option value="Nepal">Nepal</option>
              </select>
            </div>

            <div className="flex items-end">
              
            </div>
          </div>
        </div>

        {/* Results Section */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{user.id}
                    </td>
                   
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                            to={`/users_standup/${user.id}`}
                            className="text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                            {user.name}
                        </Link>
                        </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        locationColors[user.location] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.location}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found with current filters
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPageStandup;