//import React, { useState } from 'react';


import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Upload from './Upload';
import UploadTrackify from './UploadTrackify';
import StandupDashboard from './StandupDashboard';
import TrackifyDashboard from './TrackifyDashboard';
import UploadEmployee from './UploadEmployee';
//import HomePage from './HomePage';
import Dashboard from './Dashboard';
import UploadJson from './UploadJson';
import UserActivity from './UserActivity';
import Data from './Data';
import Data2 from './Data2';
import Data3 from './Data3';
import Data4 from './Data4';
import StandupPrediction from './StandupPrediction';
import ClickUp from './ClickUp';
import UserStats from './UserStats';
import EmployeeStats from './EmployeeStats'; 
import TimesheetPage from './TimesheetPage'; 
import RegisterMetricsEng from './RegisterMetricsEng'; 
import UsersPage from './UsersPage'; 
import UserDetailPage from './UserDetailPage'; 






const App = () => {
  return (
    <Router>
      <Routes>
       
        <Route path="/upload" element={<Upload />} />
        <Route path="/uploadTrackify" element={<UploadTrackify />} />
        <Route path="/standupDashboard" element={<StandupDashboard />} />
        <Route path="/trackifyDashboard" element={<TrackifyDashboard />} />
        <Route path="/uploadEmployee" element={<UploadEmployee />} />
        <Route path="/" element={<Data4 />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/uploadJson" element={<UploadJson />} />
        <Route path="/userActivity" element={<UserActivity />} />
        <Route path="/data" element={<Data />} />
        <Route path="/data2" element={<Data2 />} />
        <Route path="/data3" element={<Data3 />} />
        <Route path="/data4" element={<Data4 />} />
        <Route path="/standupPrediction" element={<StandupPrediction />} />
        <Route path="/clickUp" element={<ClickUp />} />
        <Route path="/user/:userId" element={<UserStats />} />
        <Route path="/employeeStats" element={<EmployeeStats />} />
        <Route path="/timesheetPage" element={<TimesheetPage />} />
        <Route path="/registerMetricsEng" element={<RegisterMetricsEng />} />
        <Route path="/usersPage" element={<UsersPage />} />
      
        <Route path="/users/:userId" element={<UserDetailPage />} />
        
        
        
        
        
        
   

      </Routes>
    </Router>
  );
};

export default App;