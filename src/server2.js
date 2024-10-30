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
})// API endpoint for player registration

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
          p.id, 
          p.name, 
          p.email,
          (
            SELECT GROUP_CONCAT(t.team_name)
            FROM teams t
            WHERE t.player_id = p.id AND t.coach_id = ?
          ) as team_names,
          (
            SELECT COUNT(*)
            FROM sessions s
            WHERE s.player_id = p.id AND s.coach_id = ?
          ) as total_sessions
        FROM players p
        JOIN teams t ON p.id = t.player_id
        WHERE t.coach_id = ?`,
        [req.params.coachId, req.params.coachId, req.params.coachId]
      );
      
      // Process the team_names string into an array
      players.forEach(player => {
        if (player.team_names) {
          player.team_names = player.team_names.split(',');
        } else {
          player.team_names = [];
        }
      });
  
      res.json(players);
    } catch (error) {
      console.error('Error fetching coach players:', error);
      res.status(500).json({ error: 'Error fetching players' });
    }
  });
  
  // Get all sessions for a coach
  app.get('/api/coach-sessions/:coachId', async (req, res) => {
    try {
      const [sessions] = await connection.promise().query(
        `SELECT 
          s.*,
          p.name as player_name,
          t.team_name
        FROM sessions s
        JOIN players p ON s.player_id = p.id
        LEFT JOIN teams t ON s.player_id = t.player_id AND t.coach_id = s.coach_id
        WHERE s.coach_id = ?
        ORDER BY s.session_date, s.session_time`,
        [req.params.coachId]
      );
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching coach sessions:', error);
      res.status(500).json({ error: 'Error fetching sessions' });
    }
  });
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
