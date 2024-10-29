import React, { useState } from 'react';
import './PlayerDashboard.css';

const SportsRegistration = () => {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedCoach, setSelectedCoach] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [schedule, setSchedule] = useState({
    Wednesday: false,
    Friday: false,
    Saturday: false,
  });
  const [times, setTimes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleDayChange = (day) => {
    setSchedule(prev => ({...prev, [day]: !prev[day]}));
    if (!schedule[day]) {
      setTimes(prev => ({...prev, [day]: ''}));
    } else {
      const { [day]: _, ...rest } = times;
      setTimes(rest);
    }
  };

  const handleTimeChange = (day, time) => {
    setTimes(prev => ({...prev, [day]: time}));
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let i = 6; i < 18; i++) {
      const startHour = i % 12 === 0 ? 12 : i % 12;
      const endHour = (i + 1) % 12 === 0 ? 12 : (i + 1) % 12;
      const startSuffix = i < 12 ? 'AM' : 'PM';
      const endSuffix = (i + 1) < 12 ? 'AM' : 'PM';
      
      options.push(`${startHour}${startSuffix} - ${endHour}${endSuffix}`);
    }
    return options;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    // Format schedule data
    const scheduleData = {};
    Object.keys(schedule).forEach(day => {
      if (schedule[day]) {
        scheduleData[day] = times[day];
      }
    });

    // Get playerId from localStorage (assuming it was stored during login)
    const playerId = localStorage.getItem('playerId');
    if (!playerId) {
      setError('Please login first');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/player/register-sport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: parseInt(playerId),
          teamLevel: selectedTeam,
          coachId: parseInt(selectedCoach),
          sport: selectedSport,
          schedule: scheduleData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register sport');
      }

      setSuccessMessage('Sport registration successful!');
      
      // Reset form
      setSelectedTeam('');
      setSelectedCoach('');
      setSelectedSport('');
      setSchedule({
        Wednesday: false,
        Friday: false,
        Saturday: false,
      });
      setTimes({});

    } catch (err) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="sports-registration">
      <div className="welcome-banner">
        <h1>Welcome, Player!</h1>
        <p>Let's customize your sports journey</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="selection-container">
        <div className="select-wrapper">
          <label htmlFor="team">Select Your Team</label>
          <select
            id="team"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            required
            disabled={loading}
          >
            <option value="">Choose a team</option>
            <option value="Basic">Basic</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div className="select-wrapper">
          <label htmlFor="coach">Select Your Coach</label>
          <select
            id="coach"
            value={selectedCoach}
            onChange={(e) => setSelectedCoach(e.target.value)}
            required
            disabled={loading}
          >
            <option value="">Choose a coach</option>
            <option value="1">David Miller</option>
            <option value="2">Samantha Clark</option>
            <option value="3">Robert Johnson</option>
          </select>
        </div>

        <div className="select-wrapper">
          <label htmlFor="sport">Select Your Sport</label>
          <select
            id="sport"
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            required
            disabled={loading}
          >
            <option value="">Choose a sport</option>
            <option value="Football">Football</option>
            <option value="Basketball">Basketball</option>
            <option value="Cricket">Cricket</option>
            <option value="Badminton">Badminton</option>
          </select>
        </div>

        <div className="schedule-container">
          <label>Training Schedule</label>
          {Object.keys(schedule).map((day) => (
            <div key={day} className="day-row">
              <label>
                <input
                  type="checkbox"
                  checked={schedule[day]}
                  onChange={() => handleDayChange(day)}
                  disabled={loading}
                />
                {day}
              </label>
              {schedule[day] && (
                <select
                  value={times[day] || ''}
                  onChange={(e) => handleTimeChange(day, e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">Select time</option>
                  {generateTimeOptions().map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>

        <button 
          type="submit" 
          className="submit-button" 
          disabled={loading}
        >
          {loading ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default SportsRegistration;
