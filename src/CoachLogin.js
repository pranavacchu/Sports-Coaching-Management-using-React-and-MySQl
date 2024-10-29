import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CoachLogin.css'; 
import wallpaper from "C:/Users/prana/OneDrive/Desktop/sports/my-react-app/src/wallpaper.png"; // Path to your image

function CoachLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:5000/coach-login', {
        email,
        password,
      });

      if (response.status === 200) {
        const { coachId, coachName } = response.data;  // Extracting both from response

        // Store the coach's name and id in localStorage
        localStorage.setItem('coachId', coachId);      // Correctly setting coachId
        localStorage.setItem('coachName', coachName);  // Correctly setting coachName

        // Redirect to the coach dashboard
        navigate('/coach-dashboard');
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1 className="form-title">Welcome Back, Coach!</h1>
        <p className="form-subtitle">Let’s get started with your coaching journey.</p>
        <input 
          type="email" 
          placeholder="Enter your email" 
          className="input-field" 
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Enter your password" 
          className="input-field" 
          value={password}
          onChange={(e) => setPassword(e.target.value)} 
        />
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <button className="sign-in-btn" onClick={handleLogin}>Sign In</button>
        <div className="separator">OR</div>
        <button className="player-btn">Sign In as Player</button>
        <p className="signup-text">
          Don’t have an account?{' '}
          <Link to="/signup-coach" className="signup-link">Sign Up as Coach</Link>
        </p>
      </div>
      <div className="login-banner">
        <img src={wallpaper} alt="Sports Coaching" className="banner-image" />
      </div>
    </div>
  );
}

export default CoachLogin;
