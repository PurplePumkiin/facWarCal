import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const port = 7274;

// MySQL database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

// Endpoint for receiving POST requests
app.post('/api', async (req, res) => {
  try {
    const { factionId, apiKey } = req.body;

    // Hash the API key
    const hashedApiKey = await bcrypt.hash(apiKey, 10);

    // Connect to the MySQL database
    const connection = await mysql.createConnection(dbConfig);

    // Insert the data into the database
    await connection.query('INSERT INTO your_table (factionid, apikey) VALUES (?, ?)', [factionId, hashedApiKey]);

    // Close the database connection
    await connection.end();

    res.status(200).json({ message: 'Data inserted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
