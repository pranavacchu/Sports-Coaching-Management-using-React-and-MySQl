import React, { useState } from 'react';

function CoachSignupForm() {
    const [formData, setFormData] = useState({
        name: '',
        specialization: '',
        contactNumber: '',
        email: '',
        password: ''
    });

    const [message, setMessage] = useState(''); // State for success/error messages

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
            const response = await fetch('http://localhost:5000/create-coach', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
    
            if (!response.ok) {
                // Handle duplicate entry case
                if (response.status === 409) {
                    setMessage('An account with this email already exists.'); // Duplicate entry message
                } else {
                    throw new Error('Failed to create account');
                }
                return;
            }
    
            const data = await response.json();
            setMessage('Account created successfully!'); // Success message
            console.log(data.message);
            setTimeout(() => {
                window.location.reload(); // Refresh the page after 2 seconds
            }, 2000);
        } catch (error) {
            console.error('Error:', error);
            setMessage('An error occurred. Please try again.'); // General error message
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formContainer}>
                <h1 style={styles.heading}>Welcome aboard!</h1>
                <p style={styles.subheading}>Let's get started with your coaching journey.</p>
                {message && <p style={styles.message}>{message}</p>} {/* Display success/error message */}
                <form onSubmit={handleSubmit}>
                    <input 
                        type="text" 
                        name="name" 
                        placeholder="Name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        style={styles.input} 
                        required
                    />
                    <input 
                        type="text" 
                        name="specialization" 
                        placeholder="Specialization" 
                        value={formData.specialization} 
                        onChange={handleChange} 
                        style={styles.input} 
                        required
                    />
                    <input 
                        type="text" 
                        name="contactNumber" 
                        placeholder="Contact Number" 
                        value={formData.contactNumber} 
                        onChange={handleChange} 
                        style={styles.input} 
                        required
                    />
                    <input 
                        type="email" 
                        name="email" 
                        placeholder="Email Address" 
                        value={formData.email} 
                        onChange={handleChange} 
                        style={styles.input} 
                        required
                    />
                    <input 
                        type="password" 
                        name="password" 
                        placeholder="Password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        style={styles.input} 
                        required
                    />
                    <button type="submit" style={styles.button}>Create Account</button>
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
        background: 'linear-gradient(to right, #00bcd4, #3f51b5)', // Gradient for the text
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
        background: 'linear-gradient(to right, #3f51b5, #00bcd4)', // Gradient for the button
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 'bold',
        transition: 'background 0.3s ease',
    },
    message: {
        color: 'green', // You can change the color for the success message
        margin: '10px 0',
    },
    
};

export default CoachSignupForm;
