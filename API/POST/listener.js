import express from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import axios from 'axios';

dotenv.config();

const app = express();
const port = 7274;

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// Encryption key and initialization vector
const encryptionKey = process.env.ENCRYPTION_KEY;
const iv = crypto.randomBytes(16); // Generate a random IV for each encryption

// Encrypt the API key
const encryptApiKey = (apiKey) => {
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

app.use(express.json());

app.post('/api', async (req, res) => {
  try {
    const { factionId, apiKey } = req.body;

    // Retrieve faction data from Torn API
    const factionUrl = `https://api.torn.com/faction/${factionId}?selections=basic&key=${apiKey}`;
    const factionResponse = await axios.get(factionUrl);
    const factionData = factionResponse.data;

    if (!factionData.leader) {
      res.status(400).send('The faction leader is not found');
      return;
    }

    // Retrieve player data from Torn API
    const playerUrl = `https://api.torn.com/user/?selections=basic&key=${apiKey}`;
    const playerResponse = await axios.get(playerUrl);
    const playerData = playerResponse.data;

    const leaderId = factionData.leader;
    const playerId = playerData.player_id;

    console.log('Faction Leader ID:', leaderId);
    console.log('Player Leader ID:', playerId);

    // Insert the faction ID, API key, faction leader ID, IP, and Unix time into the database
    const ip = req.ip;
    const unixTime = Math.floor(Date.now() / 1000);

    const query =
      'INSERT INTO FACTIONS (factionId, apiKey, leader, ip, unix) VALUES (?, ?, ?, ?, ?)';
    const values = [factionId, encryptApiKey(apiKey), leaderId, ip, unixTime];

    console.log('SQL Query:', query); // Log the SQL query

    await pool.query(query, values);

    console.log('API write to database successful');
    res.sendStatus(200);
  } catch (error) {
    console.error('Error:', error);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
