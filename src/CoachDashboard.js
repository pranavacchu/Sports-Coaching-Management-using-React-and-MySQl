import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CoachDashboard.css';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';

const CoachDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    coachName: '',
    coachId: '',
    totalTeams: 0,
    totalPlayers: 0,
    upcomingSessions: [],
    teams: []
  });
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    name: '',
    email: '',
    specialization: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [playersData, setPlayersData] = useState([]);
  const [sessionsData, setSessionsData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const coachId = localStorage.getItem('coachId');
        const storedCoachName = localStorage.getItem('coachName');

        if (!coachId) {
          throw new Error('Coach ID not found in local storage');
        }

        const response = await axios.get(`http://localhost:5000/api/coach-dashboard/${coachId}`);

        // Set initial form values with current coach data
        setUpdateForm({
          name: response.data.name || '',
          email: response.data.email || '',
          specialization: response.data.specialization || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        setDashboardData({
          coachName: storedCoachName || '',
          coachId: coachId,
          ...response.data,
          teams: response.data.teams || []
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(`Failed to load dashboard data: ${err.message}`);
        setDashboardData(prevState => ({ ...prevState, teams: [] }));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleViewAllPlayers = async () => {
    try {
      const coachId = localStorage.getItem('coachId');
      const response = await axios.get(`http://localhost:5000/api/coach-players/${coachId}`);
      setPlayersData(response.data);
      setShowPlayersModal(true);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError('Failed to load players data');
    }
  };

  const handleViewAllSessions = async () => {
    try {
      const coachId = localStorage.getItem('coachId');
      const response = await axios.get(`http://localhost:5000/api/coach-sessions/${coachId}`);
      setSessionsData(response.data);
      setShowSessionsModal(true);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load sessions data');
    }
  };
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');

    if (updateForm.newPassword && updateForm.newPassword !== updateForm.confirmPassword) {
      setUpdateError('New passwords do not match');
      return;
    }

    try {
      const coachId = localStorage.getItem('coachId');
      const response = await axios.put(`http://localhost:5000/api/update-coach/${coachId}`, {
        name: updateForm.name,
        email: updateForm.email,
        specialization: updateForm.specialization,
        currentPassword: updateForm.currentPassword || undefined,
        newPassword: updateForm.newPassword || undefined
      });

      setUpdateSuccess('Account updated successfully');
      localStorage.setItem('coachName', updateForm.name);
      setDashboardData(prev => ({
        ...prev,
        coachName: updateForm.name
      }));

      setTimeout(() => {
        setShowSettingsModal(false);
      }, 1500);

    } catch (err) {
      setUpdateError(err.response?.data?.error || 'Failed to update account');
    }
  };

  const SettingsModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Account Settings</h2>
          <button className="modal-close" onClick={() => setShowSettingsModal(false)}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleUpdateSubmit} className="settings-form">
            {updateError && <div className="error-message">{updateError}</div>}
            {updateSuccess && <div className="success-message">{updateSuccess}</div>}

            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input
                id="name"
                name="name"
                type="text"
                value={updateForm.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                id="email"
                name="email"
                type="email"
                value={updateForm.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="specialization">Specialization:</label>
              <input
                id="specialization"
                name="specialization"
                type="text"
                value={updateForm.specialization}
                onChange={handleInputChange}
                placeholder="Enter your specialization"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="currentPassword">Current Password:</label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={updateForm.currentPassword}
                onChange={handleInputChange}
                placeholder="Required for password change"
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password:</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={updateForm.newPassword}
                onChange={handleInputChange}
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password:</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={updateForm.confirmPassword}
                onChange={handleInputChange}
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="update-button">Update Account</button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowSettingsModal(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Rest of your component code remains the same
  const handleDeleteAccount = async () => {
    try {
      const coachId = localStorage.getItem('coachId');
      await axios.delete(`http://localhost:5000/api/delete-coach/${coachId}`);
      localStorage.removeItem('coachId');
      localStorage.removeItem('coachName');
      navigate('/coach-login');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account. Please try again.');
      setShowDeleteModal(false);
    }
  };

  const handleViewAllTeams = () => {
    if (!dashboardData.teams || dashboardData.teams.length === 0) {
      setError('No teams available for this coach.');
    } else {
      setShowTeamsModal(true);
      setError(null);
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
                  <p><strong>Player:</strong> {team.player_name}</p>
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

  const DeleteConfirmationModal = ({ onClose, onConfirm }) => {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Delete Account</h2>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
            <p>All your teams and sessions will be deleted as well.</p>
          </div>
          <div className="modal-footer">
            <button className="cancel-button" onClick={onClose}>Cancel</button>
            <button className="delete-button" onClick={onConfirm}>Delete Account</button>
          </div>
        </div>
      </div>
    );
  };
  const PlayersModal = ({ players, onClose }) => {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Your Players</h2>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body">
            {players.map(player => (
              <div key={player.id} className="player-card">
                <h3>{player.name}</h3>
                <div className="player-details">
                  <p><strong>Age:</strong> {player.age}</p>
                  <p><strong>Gender:</strong> {player.gender}</p>
                  <p><strong>Email:</strong> {player.email}</p>
                  <p><strong>Contact:</strong> {player.contact_number}</p>
                  <p><strong>Team:</strong> {player.team_name || 'No team assigned'}</p>
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

  const SessionsModal = ({ sessions, onClose }) => {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Your Sessions</h2>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body">
            {sessions.map(session => (
              <div key={session.id} className="session-card">
                <div className="session-date-container">
                  <div className="session-month">
                    {new Date(session.session_date).toLocaleString('default', { month: 'short' })}
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
                  <div className="session-player-name">
                    Player: {session.player_name}
                  </div>
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


  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading dashboard...</p>
    </div>
  );

  return (
    <div className="dashboard-container">
      {error && <div className="error-message">{error}</div>}
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
        Delete Account
      </button>

      <div className="header">
        <h1 className="welcome-text">Welcome back, Coach</h1>
        <h2 className="coach-name">{dashboardData.coachName}
          <div className="coach-id">Coach ID: {dashboardData.coachId}</div>
        </h2>
      </div>

      <div className="stats-container">
        <div className="stat-box">
          <p>Total Teams</p>
          <h3>{dashboardData.totalTeams}</h3>
        </div>
        <div className="stat-box">
          <p>Total Players</p>
          <h3>{dashboardData.totalPlayers}</h3>
        </div>
      </div>

      <div className="quick-actions">
        <button className="action-button view-teams" onClick={handleViewAllTeams}>
          View All Teams
        </button>
        <button className="action-button view-players" onClick={handleViewAllPlayers}>
          View All Players
        </button>
        <button className="action-button view-sessions" onClick={handleViewAllSessions}>
          Sessions & Schedule
        </button>
      </div>

      {showTeamsModal && (
        <TeamsModal
          teams={dashboardData.teams}
          onClose={() => setShowTeamsModal(false)}
        />
      )}
      {showSettingsModal && <SettingsModal />}

      {showDeleteModal && (
        <DeleteConfirmationModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
      {showPlayersModal && (
        <PlayersModal
          players={playersData}
          onClose={() => setShowPlayersModal(false)}
        />
      )}
      {showSessionsModal && (
        <SessionsModal
          sessions={sessionsData}
          onClose={() => setShowSessionsModal(false)}
        />
      )}

      <div className="upcoming-sessions">
        <h3>Upcoming Sessions</h3>
        {dashboardData.upcomingSessions && dashboardData.upcomingSessions.length > 0 ? (
          <ul className="sessions-list">
            {dashboardData.upcomingSessions.map((session, index) => (
              <li key={index} className="session-item">
                <div className="session-date">
                  {new Date(session.date).toLocaleDateString()}
                </div>
                <div className="session-time">
                  {new Date(`2000-01-01T${session.time}`).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="session-player">
                  {session.playerName}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No upcoming sessions</p>
        )}
      </div>
    </div>
  );
};

export default CoachDashboard;