import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CoachSignupForm from './CoachSignupForm';
import CoachLogin from './CoachLogin';
import CoachDashboard from './CoachDashboard';
import CreateTeamForm from './CreateTeamForm';
import LoginSignup from './login-signup-component';
import PlayerDashboard from './player-dashboard';
import TrainingSessionForm from './TrainingSessionForm';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const playerId = localStorage.getItem('playerId');
  if (!playerId) {
    return <Navigate to="/player-auth" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/signup-coach" element={<CoachSignupForm />} />
          <Route path="/coach-login" element={<CoachLogin />} />
          <Route path="/coach-dashboard" element={<CoachDashboard />} />
          <Route path="/create-team" element={<CreateTeamForm />} />
          <Route path="/player-auth" element={<LoginSignup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <PlayerDashboard />
              </ProtectedRoute>
            }
          />
          {/* Redirect root URL to /coach-login */}
          <Route path="/" element={<Navigate to="/coach-login" replace />} />
          <Route
            path="/training-sessions"
            element={
              <ProtectedRoute>
                <TrainingSessionForm />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
