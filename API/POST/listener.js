import express from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

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

    // Encrypt the API key
    const encryptedApiKey = encryptApiKey(apiKey);

    // Insert the faction ID and encrypted API key into the database
    const query = 'INSERT INTO api_keys (factionId, apiKey, iv) VALUES (?, ?, ?)';
    const values = [factionId, encryptedApiKey, iv.toString('hex')];
    await pool.query(query, values);

    res.sendStatus(200);
  } catch (error) {
    console.error('Error:', error);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
