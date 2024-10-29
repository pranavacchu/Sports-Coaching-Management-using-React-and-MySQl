import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateTeamForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        teamName: '',
        category: '',
        coachId: '',
        playerId: ''  // New field for Player ID
    });

    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form Submitted', formData);

        try {
            const response = await fetch('http://localhost:5000/create-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to create team');
            }

            const data = await response.json();
            setMessage('Team created successfully!');
            console.log(data.message);
            setTimeout(() => {
                navigate('/coach-dashboard');
            }, 2000);
        } catch (error) {
            console.error('Error:', error);
            setMessage('An error occurred. Please try again.');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formContainer}>
                <h1 style={styles.heading}>Together, we thrive!</h1>
                <p style={styles.subheading}>Let's create a new team for your roster.</p>
                {message && <p style={styles.message}>{message}</p>}
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="teamName"
                        placeholder="Team Name"
                        value={formData.teamName}
                        onChange={handleChange}
                        style={styles.input}
                        required
                    />
                    <input
                        type="text"
                        name="category"
                        placeholder="Category"
                        value={formData.category}
                        onChange={handleChange}
                        style={styles.input}
                        required
                    />
                    <input
                        type="number"
                        name="coachId"
                        placeholder="Coach ID"
                        value={formData.coachId}
                        onChange={handleChange}
                        style={styles.input}
                        required
                    />
                    <input
                        type="number"
                        name="playerId"
                        placeholder="Player ID"
                        value={formData.playerId}
                        onChange={handleChange}
                        style={styles.input}
                        required
                    />
                    <button type="submit" style={styles.button}>Create Team</button>
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
    }
};

export default CreateTeamForm;