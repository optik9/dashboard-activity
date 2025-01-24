//import React, { useState } from 'react';


import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Upload from './Upload';
import UploadTrackify from './UploadTrackify';
import StandupDashboard from './StandupDashboard';
import TrackifyDashboard from './TrackifyDashboard';
import UploadEmployee from './UploadEmployee';
import HomePage from './HomePage';
import Dashboard from './Dashboard';
import UploadJson from './UploadJson';
import UserActivity from './UserActivity';
import Data from './Data';
import Data2 from './Data2';
import Data3 from './Data3';
import Data4 from './Data4';


const App = () => {
  return (
    <Router>
      <Routes>
       
        <Route path="/upload" element={<Upload />} />
        <Route path="/uploadTrackify" element={<UploadTrackify />} />
        <Route path="/standupDashboard" element={<StandupDashboard />} />
        <Route path="/trackifyDashboard" element={<TrackifyDashboard />} />
        <Route path="/uploadEmployee" element={<UploadEmployee />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/uploadJson" element={<UploadJson />} />
        <Route path="/userActivity" element={<UserActivity />} />
        <Route path="/data" element={<Data />} />
        <Route path="/data2" element={<Data2 />} />
        <Route path="/data3" element={<Data3 />} />
        <Route path="/data4" element={<Data4 />} />
   

      </Routes>
    </Router>
  );
};

export default App;