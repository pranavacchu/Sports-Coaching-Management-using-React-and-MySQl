import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Settings, Trash2 } from 'lucide-react';
import './PlayerDashboard.css';

const PlayerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teams, setTeams] = useState([]);
  const [playerDetails, setPlayerDetails] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    contact_number: ''
  });
  const [dashboardData, setDashboardData] = useState({
    playerName: '',
    totalTeams: 0,
    upcomingSessions: []
  });
  const [updateForm, setUpdateForm] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    contact_number: '',
    currentPassword: '',
    newPassword: ''
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

        // Fetch player details
        const playerResponse = await axios.get(`http://localhost:5000/api/player/${playerId}`);
        setPlayerDetails(playerResponse.data);
        setUpdateForm({
          name: playerResponse.data.name,
          email: playerResponse.data.email,
          age: playerResponse.data.age,
          gender: playerResponse.data.gender,
          contact_number: playerResponse.data.contact_number,
          currentPassword: '',
          newPassword: ''
        });

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

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    try {
      const playerId = localStorage.getItem('playerId');
      await axios.put(`http://localhost:5000/api/update-player/${playerId}`, updateForm);
      // Update the local storage with new name
      localStorage.setItem('playerName', updateForm.name);
        
      // Update the dashboard data state
      setDashboardData(prev => ({
          ...prev,
          playerName: updateForm.name
      }));
      setShowSettingsModal(false);
      // Refresh dashboard data
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update account');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const playerId = localStorage.getItem('playerId');
      await axios.delete(`http://localhost:5000/api/delete-player/${playerId}`);
      localStorage.clear();
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete account');
    }
  };

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

  const SettingsModal = ({ onClose }) => {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Account Settings</h2>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleUpdateAccount}>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={updateForm.name}
                  onChange={(e) => setUpdateForm({...updateForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={updateForm.email}
                  onChange={(e) => setUpdateForm({...updateForm, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Age:</label>
                <input
                  type="number"
                  value={updateForm.age}
                  onChange={(e) => setUpdateForm({...updateForm, age: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Gender:</label>
                <select
                  value={updateForm.gender}
                  onChange={(e) => setUpdateForm({...updateForm, gender: e.target.value})}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Contact Number:</label>
                <input
                  type="tel"
                  value={updateForm.contact_number}
                  onChange={(e) => setUpdateForm({...updateForm, contact_number: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Current Password (required for password change):</label>
                <input
                  type="password"
                  value={updateForm.currentPassword}
                  onChange={(e) => setUpdateForm({...updateForm, currentPassword: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>New Password (optional):</label>
                <input
                  type="password"
                  value={updateForm.newPassword}
                  onChange={(e) => setUpdateForm({...updateForm, newPassword: e.target.value})}
                />
              </div>
              <div className="modal-footer">
                <button type="submit" className="update-button">Update Account</button>
                <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const DeleteAccountModal = ({ onClose }) => {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Delete Account</h2>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
            <div className="modal-footer">
              <button className="delete-confirm-button" onClick={handleDeleteAccount}>
                Delete Account
              </button>
              <button className="cancel-button" onClick={onClose}>Cancel</button>
            </div>
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
      <button 
        className="settings-button"
        onClick={() => setShowSettingsModal(true)}
      >
        <Settings size={24} />
      </button>

      <button 
        className="delete-account-button"
        onClick={() => setShowDeleteModal(true)}
      >
        <Trash2 size={20} /> Delete Account
      </button>

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

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
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