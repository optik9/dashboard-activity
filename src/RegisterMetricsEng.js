


import React, { useState } from 'react';
import db from "./firebaseConfig";
import { collection, addDoc } from 'firebase/firestore';

const RegisterMetricsEng = () => {
  const [formData, setFormData] = useState({
    goal: '',
    trackifyRecords: '',
    standupRecords: '',
    startDate: '',
    endDate: ''
  });

  const [submitStatus, setSubmitStatus] = useState({
    loading: false,
    success: false,
    error: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ loading: true, success: false, error: null });

    try {
      // Validate date range
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        throw new Error('Start date must be before end date');
      }

      // Add document to Firestore with exact dates
      const docRef = await addDoc(collection(db, 'performanceRecords'), {
        goal: parseFloat(formData.goal),
        trackifyRecords: parseFloat(formData.trackifyRecords),
        standupRecords: parseFloat(formData.standupRecords),
        startDate: formData.startDate, // Storing as string in YYYY-MM-DD format
        endDate: formData.endDate,     // Storing as string in YYYY-MM-DD format
        createdAt: new Date().toISOString() // Current timestamp
      });

      // Reset form and show success
      setFormData({
        goal: '',
        trackifyRecords: '',
        standupRecords: '',
        startDate: '',
        endDate: ''
      });
      setSubmitStatus({ loading: false, success: true, error: null });

      console.log('Document written with ID: ', docRef.id);
    } catch (error) {
      console.error('Error adding document: ', error);
      setSubmitStatus({ 
        loading: false, 
        success: false, 
        error: error.message 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg overflow-hidden">
        <div className="bg-blue-600 text-white text-center py-4">
          <h2 className="text-2xl font-bold">Performance Tracking</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Goal Input */}
          <div>
            <label 
              htmlFor="goal" 
              className="block text-gray-700 font-semibold mb-2"
            >
              Goal (%)
            </label>
            <input
              type="number"
              id="goal"
              name="goal"
              value={formData.goal}
              onChange={handleInputChange}
              required
              min="0"
              max="100"
              step="0.01"
              placeholder="Enter goal percentage"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Trackify Records Input */}
          <div>
            <label 
              htmlFor="trackifyRecords" 
              className="block text-gray-700 font-semibold mb-2"
            >
              Trackify Records (%)
            </label>
            <input
              type="number"
              id="trackifyRecords"
              name="trackifyRecords"
              value={formData.trackifyRecords}
              onChange={handleInputChange}
              required
              min="0"
              max="100"
              step="0.01"
              placeholder="Enter Trackify records"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Standup Records Input */}
          <div>
            <label 
              htmlFor="standupRecords" 
              className="block text-gray-700 font-semibold mb-2"
            >
              Standup Records (%)
            </label>
            <input
              type="number"
              id="standupRecords"
              name="standupRecords"
              value={formData.standupRecords}
              onChange={handleInputChange}
              required
              min="0"
              max="100"
              step="0.01"
              placeholder="Enter Standup records"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Range Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label 
                htmlFor="startDate" 
                className="block text-gray-700 font-semibold mb-2"
              >
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label 
                htmlFor="endDate" 
                className="block text-gray-700 font-semibold mb-2"
              >
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitStatus.loading}
            className={`w-full py-3 rounded-md text-white font-semibold transition-colors ${
              submitStatus.loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {submitStatus.loading ? 'Submitting...' : 'Submit Performance Data'}
          </button>

          {/* Status Messages */}
          {submitStatus.success && (
            <div className="text-green-600 text-center mt-4">
              Performance data submitted successfully!
            </div>
          )}
          {submitStatus.error && (
            <div className="text-red-600 text-center mt-4">
              {submitStatus.error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default RegisterMetricsEng;