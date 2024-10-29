import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CoachSignupForm from './CoachSignupForm';
import CoachLogin from './CoachLogin';
import CoachDashboard from './CoachDashboard';
import CreateTeamForm from './CreateTeamForm'; // Import the new component

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/signup-coach" element={<CoachSignupForm />} />
          <Route path="/coach-login" element={<CoachLogin />} />
          <Route path="/coach-dashboard" element={<CoachDashboard />} />
          <Route path="/create-team" element={<CreateTeamForm />} /> {/* Add this route */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;