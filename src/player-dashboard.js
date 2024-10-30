import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar } from 'lucide-react';
import './PlayerDashboard.css';

const PlayerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [teams, setTeams] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    playerName: '',
    totalTeams: 0,
    upcomingSessions: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const playerId = localStorage.getItem('playerId');
        const storedPlayerName = localStorage.getItem('playerName');

        if (!playerId) {
          throw new Error('Player ID not found in local storage');
        }

        // Fetch teams for the player
        const teamsResponse = await axios.get(`http://localhost:5000/api/player-teams/${playerId}`);
        setTeams(teamsResponse.data);

        // Fetch other dashboard data
        const dashboardResponse = await axios.get(`http://localhost:5000/api/player-dashboard/${playerId}`);
        
        setDashboardData({
          playerName: storedPlayerName || '',
          totalTeams: teamsResponse.data.length,
          upcomingSessions: dashboardResponse.data.upcomingSessions || []
        });

        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(`Failed to load dashboard data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const TeamsModal = ({ teams, onClose }) => {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Your Teams</h2>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body">
            {teams.map(team => (
              <div key={team.id} className="team-card">
                <h3>{team.team_name}</h3>
                <div className="team-details">
                  <p><strong>Category:</strong> {team.category}</p>
                  <p><strong>Coach:</strong> {team.coach_name}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button className="back-button" onClick={onClose}>Back</button>
          </div>
        </div>
      </div>
    );
  };

  const handleCreateTeam = () => {
    navigate('/create-team');
  };

  const handleTrainingSessions = () => {
    navigate('/training-sessions');
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading dashboard...</p>
    </div>
  );

  return (
    <div className="dashboard-container">
      <div className="header">
        <h1 className="welcome-text">Welcome to Your Sports Hub!</h1>
        <p className="player-name">{dashboardData.playerName}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-container">
        <div className="stat-box">
          <p>Active Teams</p>
          <h3>{dashboardData.totalTeams}</h3>
        </div>
        <div className="stat-box">
          <p>Upcoming Sessions</p>
          <h3>{dashboardData.upcomingSessions.length}</h3>
        </div>
      </div>

      <div className="quick-actions">
        <button 
          className="action-button view-teams" 
          onClick={() => setShowTeamsModal(true)}
          disabled={loading}
        >
          View Teams
        </button>
        <button 
          className="action-button create-team" 
          onClick={handleCreateTeam}
          disabled={loading}
        >
          Create Team
        </button>
        <button 
          className="action-button view-sessions"
          onClick={handleTrainingSessions}
          disabled={loading}
        >
          Training Sessions
        </button>
      </div>

      {showTeamsModal && (
        <TeamsModal
          teams={teams}
          onClose={() => setShowTeamsModal(false)}
        />
      )}

      <div className="upcoming-sessions-container">
        <div className="upcoming-sessions-header">
          <Calendar size={24} />
          <h2>Upcoming Training Sessions</h2>
        </div>
        {dashboardData.upcomingSessions.length > 0 ? (
          <div className="sessions-grid">
            {dashboardData.upcomingSessions.map((session, index) => (
              <div key={index} className="session-card">
                <div className="session-date-container">
                  <div className="session-month">
                    {new Date(session.session_date).toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div className="session-day">
                    {new Date(session.session_date).getDate()}
                  </div>
                </div>
                <div className="session-details">
                  <div className="session-time">
                    {new Date(`2000-01-01T${session.session_time}`).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="session-team-name">
                    {session.team_name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-sessions">
            <p>No upcoming sessions scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerDashboard;