// PlayerDashboard.js
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

        setError('');
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
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
      localStorage.setItem('playerName', updateForm.name);
      setShowSettingsModal(false);
      window.location.reload();
    } catch (err) {
      setError('Failed to update account');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const playerId = localStorage.getItem('playerId');
      await axios.delete(`http://localhost:5000/api/delete-player/${playerId}`);
      localStorage.clear();
      navigate('/login');
    } catch (err) {
      setError('Failed to delete account');
    }
  };

  const TeamsModal = ({ teams, onClose }) => (
    <div className="pd-modal-overlay">
      <div className="pd-modal-content">
        <h2>Your Teams</h2>
        <div className="pd-teams-list">
          {teams.map(team => (
            <div key={team.id} className="pd-team-card">
              <h3>{team.team_name}</h3>
              <p>Category: {team.category}</p>
              <p>Coach: {team.coach_name}</p>
            </div>
          ))}
        </div>
        <button className="pd-modal-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );

  const SettingsModal = ({ onClose }) => (
    <div className="pd-modal-overlay">
      <div className="pd-modal-content">
        <h2>Account Settings</h2>
        <form onSubmit={handleUpdateAccount}>
          <div className="pd-form-group">
            <label>Name:</label>
            <input
              type="text"
              value={updateForm.name}
              onChange={(e) => setUpdateForm({...updateForm, name: e.target.value})}
              required
            />
          </div>
          <div className="pd-form-group">
            <label>Email:</label>
            <input
              type="email"
              value={updateForm.email}
              onChange={(e) => setUpdateForm({...updateForm, email: e.target.value})}
              required
            />
          </div>
          <div className="pd-form-group">
            <label>Age:</label>
            <input
              type="number"
              value={updateForm.age}
              onChange={(e) => setUpdateForm({...updateForm, age: e.target.value})}
              required
            />
          </div>
          <div className="pd-form-group">
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
          <div className="pd-form-group">
            <label>Contact Number:</label>
            <input
              type="tel"
              value={updateForm.contact_number}
              onChange={(e) => setUpdateForm({...updateForm, contact_number: e.target.value})}
              required
            />
          </div>
          <div className="pd-form-group">
            <label>Current Password:</label>
            <input
              type="password"
              value={updateForm.currentPassword}
              onChange={(e) => setUpdateForm({...updateForm, currentPassword: e.target.value})}
            />
          </div>
          <div className="pd-form-group">
            <label>New Password:</label>
            <input
              type="password"
              value={updateForm.newPassword}
              onChange={(e) => setUpdateForm({...updateForm, newPassword: e.target.value})}
            />
          </div>
          <div className="pd-modal-actions">
            <button type="submit" className="pd-update-button">Update</button>
            <button type="button" className="pd-cancel-button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );

  const DeleteAccountModal = ({ onClose }) => (
    <div className="pd-modal-overlay">
      <div className="pd-modal-content">
        <h2>Delete Account</h2>
        <p>Are you sure you want to delete your account? This action cannot be undone.</p>
        <div className="pd-modal-actions">
          <button className="pd-delete-confirm" onClick={handleDeleteAccount}>Delete</button>
          <button className="pd-cancel-button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="pd-loading-container">
        <div className="pd-loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="pd-dashboard-container">
      {/* Top buttons */}
      <div className="pd-dashboard-buttons-container">
        <button 
          className="pd-dashboard-settings-button"
          onClick={() => setShowSettingsModal(true)}
          aria-label="Settings"
        >
          <Settings size={20} />
        </button>

        <button 
          className="pd-dashboard-delete-button group flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all duration-200 rounded-lg border border-gray-200"
          onClick={() => setShowDeleteModal(true)}
          aria-label="Delete Account"
        >
          <Trash2 
            size={18} 
            className="text-gray-500 group-hover:text-gray-700" 
          />
          
        </button>
      </div>

      {/* Main content */}
      <div className="pd-dashboard-content">
        <div className="pd-header">
          <h1 className="pd-welcome-text">Welcome to Your Sports Hub!</h1>
          <p className="pd-player-name">{dashboardData.playerName}</p>
        </div>

        {error && <div className="pd-error-message">{error}</div>}

        <div className="pd-stats-container">
          <div className="pd-stat-box">
            <p>Active Teams</p>
            <h3>{dashboardData.totalTeams}</h3>
          </div>
          <div className="pd-stat-box">
            <p>Upcoming Sessions</p>
            <h3>{dashboardData.upcomingSessions.length}</h3>
          </div>
        </div>

        <div className="pd-quick-actions">
          <button 
            className="pd-action-button pd-view-teams" 
            onClick={() => setShowTeamsModal(true)}
          >
            View Teams
          </button>
          <button 
            className="pd-action-button pd-create-team" 
            onClick={() => navigate('/create-team')}
          >
            Create Team
          </button>
          <button 
            className="pd-action-button pd-view-sessions"
            onClick={() => navigate('/training-sessions')}
          >
            Training Sessions
          </button>
        </div>

        <div className="pd-upcoming-sessions-container">
          <div className="pd-upcoming-sessions-header">
            <Calendar size={24} />
            <h2>Upcoming Training Sessions</h2>
          </div>
          {dashboardData.upcomingSessions.length > 0 ? (
            <div className="pd-sessions-grid">
              {dashboardData.upcomingSessions.map((session, index) => (
                <div key={index} className="pd-session-card">
                  <div className="pd-session-date-container">
                    <div className="pd-session-month">
                      {new Date(session.session_date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="pd-session-day">
                      {new Date(session.session_date).getDate()}
                    </div>
                  </div>
                  <div className="pd-session-details">
                    <div className="pd-session-time">
                      {new Date(`2000-01-01T${session.session_time}`).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="pd-session-team-name">
                      {session.team_name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="pd-no-sessions">
              <p>No upcoming sessions scheduled</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showTeamsModal && (
        <TeamsModal teams={teams} onClose={() => setShowTeamsModal(false)} />
      )}
      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
      )}
      {showDeleteModal && (
        <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />
      )}
    </div>
  );
};

export default PlayerDashboard;