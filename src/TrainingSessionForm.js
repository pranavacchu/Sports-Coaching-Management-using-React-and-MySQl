import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function TrainingSessionForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        sessionDate: '',
        sessionTime: '',
        playerId: '',
        coachId: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
        // Clear any previous error messages
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch('http://localhost:5000/api/book-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to book session');
            }

            setSuccess('Session booked successfully!');
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formContainer}>
                <h1 style={styles.heading}>Book Training Session</h1>
                
                {error && <div style={styles.errorMessage}>{error}</div>}
                {success && <div style={styles.successMessage}>{success}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div style={styles.inputGroup}>
                        <label htmlFor="sessionDate">Session Date</label>
                        <input
                            id="sessionDate"
                            type="date"
                            name="sessionDate"
                            value={formData.sessionDate}
                            onChange={handleChange}
                            style={styles.input}
                            min={new Date().toISOString().split('T')[0]}
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label htmlFor="sessionTime">Session Time</label>
                        <input
                            id="sessionTime"
                            type="time"
                            name="sessionTime"
                            value={formData.sessionTime}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label htmlFor="playerId">Player ID</label>
                        <input
                            id="playerId"
                            type="number"
                            name="playerId"
                            value={formData.playerId}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label htmlFor="coachId">Coach ID</label>
                        <input
                            id="coachId"
                            type="number"
                            name="coachId"
                            value={formData.coachId}
                            onChange={handleChange}
                            style={styles.input}
                            required
                        />
                    </div>

                    <button type="submit" style={styles.button}>
                        Book Session
                    </button>
                </form>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f7f7f7'
    },
    formContainer: {
        backgroundColor: '#fff',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        textAlign: 'center',
        width: '100%',
        maxWidth: '400px'
    },
    heading: {
        fontSize: '2rem',
        marginBottom: '0.5rem',
        background: 'linear-gradient(to right, #00bcd4, #3f51b5)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 'bold'
    },
    subheading: {
        color: '#777',
        marginBottom: '1.5rem'
    },
    input: {
        width: '100%',
        padding: '12px',
        margin: '8px 0',
        boxSizing: 'border-box',
        borderRadius: '4px',
        border: '1px solid #ccc'
    },
    button: {
        width: '100%',
        padding: '12px',
        background: 'linear-gradient(to right, #3f51b5, #00bcd4)',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 'bold',
        transition: 'background 0.3s ease',
    },
    message: {
        margin: '10px 0',
        padding: '10px',
        borderRadius: '4px',
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
    },
    errorMessage: {
        backgroundColor: '#ffebee',
        color: '#c62828',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '15px',
    },
    successMessage: {
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '15px',
    },
    inputGroup: {
        marginBottom: '15px',
        textAlign: 'left',
    },
};

export default TrainingSessionForm;