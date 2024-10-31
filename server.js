const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '#Pranav123',
    database: 'SportsManagement',
    port: 3306
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// API endpoint for coach login
app.post('/coach-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if coach exists in the database
        const query = `SELECT * FROM coaches WHERE email = ?`;
        connection.query(query, [email], async (error, results) => {
            if (error) {
                console.error('Error checking coach login:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (results.length === 0) {
                // Coach not found
                return res.status(400).json({ error: 'Invalid email or password' });
            }

            const coach = results[0];

            // Compare the password
            const isPasswordValid = await bcrypt.compare(password, coach.password);

            if (!isPasswordValid) {
                return res.status(400).json({ error: 'Invalid email or password' });
            }

            // Success: Return the coach's name and ID
            res.status(200).json({ message: 'Login successful', coachName: coach.name, coachId: coach.id });
        });
    } catch (error) {
        console.error('Server error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint for coach registration
app.post('/create-coach', async (req, res) => {
    try {
        const { name, specialization, contactNumber, email, password } = req.body;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO coaches (name, specialization, contact_number, email, password)
            VALUES (?, ?, ?, ?, ?)
        `;

        connection.query(
            query,
            [name, specialization, contactNumber, email, hashedPassword],
            (error, results) => {
                if (error) {
                    console.error('Error creating coach:', error);
                    if (error.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: 'Email already exists' });
                    }
                    return res.status(500).json({ error: 'Error creating coach account' });
                }

                res.status(201).json({
                    message: 'Coach account created successfully',
                    coachId: results.insertId
                });
            }
        );
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/coach-dashboard/:coachId', (req, res) => {
    const coachId = req.params.coachId;

    console.log('Fetching dashboard data for coach:', coachId);

    const queries = {
        teams: `SELECT COUNT(*) as count FROM teams WHERE coach_id = ?`,
        players: `SELECT COUNT(DISTINCT player_id) as count FROM teams WHERE coach_id = ?`,
        sessions: `
            SELECT s.session_date, s.session_time, p.name as player_name
            FROM sessions s
            JOIN players p ON s.player_id = p.id
            WHERE s.coach_id = ? AND s.session_date >= CURDATE()
            ORDER BY s.session_date ASC, s.session_time ASC
            LIMIT 5
        `,
        allTeams: `
            SELECT t.id, t.team_name, t.category, p.name AS player_name
            FROM teams t
            JOIN players p ON t.player_id = p.id
            WHERE t.coach_id = ?
        `
    };

    // Execute all queries concurrently
    Promise.all([
        new Promise((resolve, reject) => {
            connection.query(queries.teams, [coachId], (error, results) => {
                if (error) reject(error);
                else resolve(results[0].count);
            });
        }),
        new Promise((resolve, reject) => {
            connection.query(queries.players, [coachId], (error, results) => {
                if (error) reject(error);
                else resolve(results[0].count);
            });
        }),
        new Promise((resolve, reject) => {
            connection.query(queries.sessions, [coachId], (error, results) => {
                if (error) reject(error);
                else resolve(results);
            });
        }),
        new Promise((resolve, reject) => {
            connection.query(queries.allTeams, [coachId], (error, results) => {
                if (error) reject(error);
                else resolve(results);
            });
        })
    ])
        .then(([totalTeams, totalPlayers, sessions, allTeams]) => {
            res.json({
                totalTeams,
                totalPlayers,
                upcomingSessions: sessions.map(session => ({
                    date: session.session_date,
                    time: session.session_time,
                    playerName: session.player_name
                })),
                teams: allTeams
            });
        })
        .catch(error => {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});

app.post('/create-team', (req, res) => {
    const { teamName, category, coachId, playerId } = req.body;

    // Verify if the coach exists
    const checkCoachQuery = 'SELECT id FROM coaches WHERE id = ?';
    connection.query(checkCoachQuery, [coachId], (error, coachResults) => {
        if (error) {
            console.error('Error checking coach:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (coachResults.length === 0) {
            return res.status(400).json({ error: 'Coach not found' });
        }

        // Verify if the player exists
        const checkPlayerQuery = 'SELECT id FROM players WHERE id = ?';
        connection.query(checkPlayerQuery, [playerId], (error, playerResults) => {
            if (error) {
                console.error('Error checking player:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (playerResults.length === 0) {
                return res.status(400).json({ error: 'Player not found' });
            }

            // If both coach and player exist, create the team
            const createTeamQuery = `
                INSERT INTO teams (team_name, category, player_id, coach_id)
                VALUES (?, ?, ?, ?)
            `;

            connection.query(createTeamQuery, [teamName, category, playerId, coachId], (error, result) => {
                if (error) {
                    console.error('Error creating team:', error);
                    return res.status(500).json({ error: 'Error creating team' });
                }

                res.status(201).json({
                    message: 'Team created successfully',
                    teamId: result.insertId
                });
            });
        });
    });
});
// Add this endpoint in server.js
app.delete('/api/delete-coach/:coachId', async (req, res) => {
    const coachId = req.params.coachId;

    // Begin transaction
    connection.beginTransaction(async (err) => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        try {
            // Due to ON DELETE CASCADE in our schema, deleting the coach will automatically
            // delete related records in teams and sessions tables
            const deleteQuery = 'DELETE FROM coaches WHERE id = ?';

            connection.query(deleteQuery, [coachId], (error, results) => {
                if (error) {
                    return connection.rollback(() => {
                        console.error('Error deleting coach:', error);
                        res.status(500).json({ error: 'Error deleting account' });
                    });
                }

                if (results.affectedRows === 0) {
                    return connection.rollback(() => {
                        res.status(404).json({ error: 'Coach not found' });
                    });
                }

                connection.commit((err) => {
                    if (err) {
                        return connection.rollback(() => {
                            console.error('Error committing transaction:', err);
                            res.status(500).json({ error: 'Error deleting account' });
                        });
                    }
                    res.status(200).json({ message: 'Account deleted successfully' });
                });
            });
        } catch (error) {
            connection.rollback(() => {
                console.error('Error in delete operation:', error);
                res.status(500).json({ error: 'Internal server error' });
            });
        }
    });
});
// ... (rest of the code remains unchanged)
// Add this endpoint in server.js after your other endpoints
app.put('/api/update-coach/:coachId', async (req, res) => {
    try {
        const coachId = req.params.coachId;
        const { name, email, specialization, currentPassword, newPassword } = req.body;

        // First verify the coach exists and check current password
        const verifyQuery = 'SELECT * FROM coaches WHERE id = ?';
        connection.query(verifyQuery, [coachId], async (error, results) => {
            if (error) {
                console.error('Error verifying coach:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Coach not found' });
            }

            const coach = results[0];

            // If current password is provided, verify it
            if (currentPassword) {
                const isPasswordValid = await bcrypt.compare(currentPassword, coach.password);
                if (!isPasswordValid) {
                    return res.status(400).json({ error: 'Current password is incorrect' });
                }
            }

            // Prepare update query
            let updateQuery = 'UPDATE coaches SET name = ?, email = ?, specialization = ?';
            let queryParams = [name, email, specialization];

            // If new password is provided, hash it and add to update
            if (newPassword) {
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                updateQuery += ', password = ?';
                queryParams.push(hashedPassword);
            }

            updateQuery += ' WHERE id = ?';
            queryParams.push(coachId);

            // Execute update
            connection.query(updateQuery, queryParams, (updateError, updateResults) => {
                if (updateError) {
                    console.error('Error updating coach:', updateError);
                    if (updateError.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: 'Email already exists' });
                    }
                    return res.status(500).json({ error: 'Error updating account' });
                }

                res.status(200).json({
                    message: 'Account updated successfully',
                    name: name
                });
            });
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// API endpoint for player registration
app.post('/player-signup', async (req, res) => {
    try {
        const { name, age, gender, contactNumber, email, password } = req.body;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO players (name, age, gender, contact_number, email, password)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        connection.query(
            query,
            [name, age, gender, contactNumber, email, hashedPassword],
            (error, results) => {
                if (error) {
                    console.error('Error creating player:', error);
                    if (error.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({ error: 'Email already exists' });
                    }
                    return res.status(500).json({ error: 'Error creating player account' });
                }

                res.status(201).json({
                    message: 'Player account created successfully',
                    playerId: results.insertId,
                    playerName: name
                });
            }
        );
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint for player login
app.post('/player-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if player exists in the database
        const query = `SELECT * FROM players WHERE email = ?`;
        connection.query(query, [email], async (error, results) => {
            if (error) {
                console.error('Error checking player login:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (results.length === 0) {
                // Player not found
                return res.status(400).json({ error: 'Invalid email or password' });
            }

            const player = results[0];

            // Compare the password
            const isPasswordValid = await bcrypt.compare(password, player.password);

            if (!isPasswordValid) {
                return res.status(400).json({ error: 'Invalid email or password' });
            }

            // Success: Return the player's name and ID
            res.status(200).json({
                message: 'Login successful',
                playerId: player.id,
                playerName: player.name
            });
        });
    } catch (error) {
        console.error('Server error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Add these endpoints after your existing endpoints in server.js

// Get player dashboard data
app.get('/api/player-dashboard/:playerId', (req, res) => {
    const playerId = req.params.playerId;

    const queries = {
        playerInfo: `
            SELECT name, age, gender, email 
            FROM players 
            WHERE id = ?
        `,
        teamInfo: `
            SELECT t.team_name, t.category, c.name as coach_name 
            FROM teams t 
            JOIN coaches c ON t.coach_id = c.id 
            WHERE t.player_id = ?
        `,
        upcomingSessions: `
            SELECT s.session_date, s.session_time, c.name as coach_name, c.specialization 
            FROM sessions s 
            JOIN coaches c ON s.coach_id = c.id 
            WHERE s.player_id = ? 
            AND s.session_date >= CURDATE() 
            ORDER BY s.session_date ASC, s.session_time ASC 
            LIMIT 5
        `
    };

    // Execute all queries concurrently
    Promise.all([
        new Promise((resolve, reject) => {
            connection.query(queries.playerInfo, [playerId], (error, results) => {
                if (error) reject(error);
                else resolve(results[0]);
            });
        }),
        new Promise((resolve, reject) => {
            connection.query(queries.teamInfo, [playerId], (error, results) => {
                if (error) reject(error);
                else resolve(results);
            });
        }),
        new Promise((resolve, reject) => {
            connection.query(queries.upcomingSessions, [playerId], (error, results) => {
                if (error) reject(error);
                else resolve(results);
            });
        })
    ])
        .then(([playerInfo, teams, sessions]) => {
            if (!playerInfo) {
                return res.status(404).json({ error: 'Player not found' });
            }

            res.json({
                playerInfo,
                teams,
                upcomingSessions: sessions
            });
        })
        .catch(error => {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});

// Register for sports sessions
app.post('/player/register-sport', async (req, res) => {
    const { playerId, teamLevel, coachId, sport, schedule } = req.body;

    // Begin transaction
    connection.beginTransaction(async (err) => {
        if (err) {
            return res.status(500).json({ error: 'Transaction error' });
        }

        try {
            // Create team entry
            const teamQuery = `
                INSERT INTO teams (team_name, category, player_id, coach_id)
                VALUES (?, ?, ?, ?)
            `;

            connection.query(teamQuery,
                [`${sport} Team`, teamLevel, playerId, coachId],
                (error, teamResults) => {
                    if (error) {
                        return connection.rollback(() => {
                            res.status(500).json({ error: 'Error creating team' });
                        });
                    }

                    // Create session entries
                    const sessionPromises = Object.entries(schedule).map(([day, time]) => {
                        return new Promise((resolve, reject) => {
                            // Convert day and time to proper DateTime format
                            // This is a simplified version - you might want to add more sophisticated date handling
                            const query = `
                                INSERT INTO sessions (session_date, session_time, player_id, coach_id)
                                VALUES (?, ?, ?, ?)
                            `;

                            connection.query(query,
                                [day, time, playerId, coachId],
                                (error, results) => {
                                    if (error) reject(error);
                                    else resolve(results);
                                }
                            );
                        });
                    });

                    Promise.all(sessionPromises)
                        .then(() => {
                            connection.commit((err) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        res.status(500).json({ error: 'Error committing transaction' });
                                    });
                                }
                                res.status(201).json({
                                    message: 'Sport registration successful',
                                    teamId: teamResults.insertId
                                });
                            });
                        })
                        .catch(error => {
                            connection.rollback(() => {
                                res.status(500).json({ error: 'Error creating sessions' });
                            });
                        });
                }
            );
        } catch (error) {
            connection.rollback(() => {
                res.status(500).json({ error: 'Internal server error' });
            });
        }
    });
});
// Add this endpoint to your server.js file

// Book training session endpoint
app.post('/api/book-session', async (req, res) => {
    const { sessionDate, sessionTime, playerId, coachId } = req.body;

    // Input validation
    if (!sessionDate || !sessionTime || !playerId || !coachId) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(sessionDate)) {
        return res.status(400).json({ error: 'Invalid date format' });
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(sessionTime)) {
        return res.status(400).json({ error: 'Invalid time format' });
    }

    try {
        // Check if the session slot is available
        const [existingSessions] = await connection.promise().query(
            'SELECT id FROM sessions WHERE session_date = ? AND session_time = ? AND coach_id = ?',
            [sessionDate, sessionTime, coachId]
        );

        if (existingSessions.length > 0) {
            return res.status(409).json({ error: 'This session slot is already booked' });
        }

        // Check if player exists
        const [playerExists] = await connection.promise().query(
            'SELECT id FROM players WHERE id = ?',
            [playerId]
        );

        if (playerExists.length === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Check if coach exists
        const [coachExists] = await connection.promise().query(
            'SELECT id FROM coaches WHERE id = ?',
            [coachId]
        );

        if (coachExists.length === 0) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        // Insert the session
        const [result] = await connection.promise().query(
            'INSERT INTO sessions (session_date, session_time, player_id, coach_id) VALUES (?, ?, ?, ?)',
            [sessionDate, sessionTime, playerId, coachId]
        );

        res.status(201).json({
            message: 'Session booked successfully',
            sessionId: result.insertId
        });

    } catch (error) {
        console.error('Error booking session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get player teams
app.get('/api/player-teams/:playerId', async (req, res) => {
    try {
        const [teams] = await connection.promise().query(
            `SELECT t.*, c.name as coach_name 
         FROM teams t 
         JOIN coaches c ON t.coach_id = c.id 
         WHERE t.player_id = ?`,
            [req.params.playerId]
        );
        res.json(teams);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching teams' });
    }
});

// Get player dashboard data
app.get('/api/player-dashboard/:playerId', async (req, res) => {
    try {
        const [sessions] = await connection.promise().query(
            `SELECT s.*, t.team_name 
         FROM sessions s 
         LEFT JOIN teams t ON s.player_id = t.player_id 
         WHERE s.player_id = ? AND s.session_date >= CURDATE() 
         ORDER BY s.session_date, s.session_time`,
            [req.params.playerId]
        );

        const [totalTrainings] = await connection.promise().query(
            'SELECT COUNT(*) as total FROM sessions WHERE player_id = ?',
            [req.params.playerId]
        );

        res.json({
            upcomingSessions: sessions,
            totalTrainings: totalTrainings[0].total
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching dashboard data' });
    }
});
// Add these endpoints to your server.js file

// Get player details
app.get('/api/player/:playerId', async (req, res) => {
    try {
        const [player] = await connection.promise().query(
            'SELECT name, email, age, gender, contact_number FROM players WHERE id = ?',
            [req.params.playerId]
        );

        if (player.length === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }

        res.json(player[0]);
    } catch (error) {
        console.error('Error fetching player details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update player account
app.put('/api/update-player/:playerId', async (req, res) => {
    const { name, email, age, gender, contact_number, currentPassword, newPassword } = req.body;

    try {
        // Check if player exists
        const [player] = await connection.promise().query(
            'SELECT password FROM players WHERE id = ?',
            [req.params.playerId]
        );

        if (player.length === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // If changing password, verify current password
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Current password is required to set new password' });
            }

            const passwordMatch = await bcrypt.compare(currentPassword, player[0].password);
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }
        }

        // Prepare update data
        const updateData = {
            name,
            email,
            age,
            gender,
            contact_number
        };

        // If new password provided, hash it
        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateData.password = hashedPassword;
        }

        // Update player
        await connection.promise().query(
            'UPDATE players SET ? WHERE id = ?',
            [updateData, req.params.playerId]
        );

        res.json({ message: 'Account updated successfully',updatedName: name });
    } catch (error) {
        console.error('Error updating player:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete player account
app.delete('/api/delete-player/:playerId', async (req, res) => {
    try {
        const [result] = await connection.promise().query(
            'DELETE FROM players WHERE id = ?',
            [req.params.playerId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get all players for a coach
app.get('/api/coach-players/:coachId', async (req, res) => {
    try {
        const [players] = await connection.promise().query(
            `SELECT DISTINCT 
                p.*,
                t.team_name,
                t.category
            FROM players p
            INNER JOIN teams t ON p.id = t.player_id
            WHERE t.coach_id = ?
            ORDER BY p.name`,
            [req.params.coachId]
        );

        if (!players.length) {
            return res.status(200).json([]);
        }

        // Format the player data
        const formattedPlayers = players.map(player => ({
            id: player.id,
            name: player.name,
            age: player.age,
            gender: player.gender,
            email: player.email,
            contact_number: player.contact_number,
            team_name: player.team_name,
            category: player.category,
            created_at: player.created_at
        }));

        res.json(formattedPlayers);
    } catch (error) {
        console.error('Error fetching coach players:', error);
        res.status(500).json({ error: 'Error fetching players data' });
    }
});

// Get all sessions for a coach with player and team details
app.get('/api/coach-sessions/:coachId', async (req, res) => {
    try {
        const [sessions] = await connection.promise().query(
            `SELECT 
                s.*,
                p.name as player_name,
                p.email as player_email,
                p.contact_number as player_contact,
                t.team_name,
                t.category
            FROM sessions s
            INNER JOIN players p ON s.player_id = p.id
            LEFT JOIN teams t ON (p.id = t.player_id AND t.coach_id = s.coach_id)
            WHERE s.coach_id = ?
            ORDER BY s.session_date ASC, s.session_time ASC`,
            [req.params.coachId]
        );

        if (!sessions.length) {
            return res.status(200).json([]);
        }

        // Format the session data
        const formattedSessions = sessions.map(session => ({
            id: session.id,
            session_date: session.session_date,
            session_time: session.session_time,
            player_name: session.player_name,
            player_email: session.player_email,
            player_contact: session.player_contact,
            team_name: session.team_name,
            category: session.category
        }));

        res.json(formattedSessions);
    } catch (error) {
        console.error('Error fetching coach sessions:', error);
        res.status(500).json({ error: 'Error fetching sessions data' });
    }
});
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
