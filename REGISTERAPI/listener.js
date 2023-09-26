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

// Generate dynamic salt phrase
const saltPhrase = process.env.SALT;
const unixTime = Math.floor(Date.now() / 1000); // Get current Unix timestamp
const saltHex = Buffer.from(saltPhrase, 'utf8').toString('hex');
const unixTimeHex = unixTime.toString(16);
//const ivRandom = crypto.createCipheriv()
const iv = Buffer.from((unixTimeHex + saltHex).substring(4, 20), 'utf-8');

console.log('debug - iv:', iv)
// Encrypt the API key
const encryptApiKey = (apiKey) => {
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

// Decrypt the API key
const decryptApiKey = (encryptedApiKey) => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
  let decrypted = decipher.update(encryptedApiKey, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Fetch faction members from Torn API
const fetchFactionMembers = async (factionId, apiKey) => {
  const url = `https://api.torn.com/faction/${factionId}?selections=basic&key=${apiKey}`;
  const response = await axios.get(url);
  const { members } = response.data;
  return members;
};

app.use(express.json());

app.post('/api', async (req, res) => {
  try {
    

    // Generate dynamic IV
    const encryptionKey = process.env.ENCRYPTION_KEY;
    const saltPhrase = process.env.SALT;
    const unixTime = Math.floor(Date.now() / 1000);
    const saltHex = Buffer.from(saltPhrase, 'utf8').toString('hex');
    const unixTimeHex = unixTime.toString(16);
    const iv = Buffer.from((unixTimeHex + saltHex).substring(4, 20), 'utf-8');

    console.log('debug - iv:', iv)
    // Encrypt the API key
    const encryptApiKey = (apiKey) => {
      const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
      let encrypted = cipher.update(apiKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    };
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

    const clientIp = req.ip; // Get client's IP address

    console.log('Client IP:', clientIp);
    console.log('Unix Time:', unixTime);

    // Insert the faction ID, API key, faction leader ID, client IP, and Unix time into the FACTIONS table
    const insertQuery = 'INSERT INTO FACTIONS (facID, apiKey, leader, ip, unix) VALUES (?, ?, ?, ?, ?)';
    const insertValues = [factionId, encryptApiKey(apiKey), leaderId, clientIp, unixTime];

    console.log('SQL Insert Query:', insertQuery); // Log the SQL insert query

    await pool.query(insertQuery, insertValues);

    // Fetch faction members from Torn API
    const factionMembers = await fetchFactionMembers(factionId, apiKey);

    // Insert data into the WarInfo table
    const warInfoQuery = 'INSERT INTO WarInfo (facID, wars, facMembers, inWar, lastUpdate) VALUES (?, ?, ?, ?, ?)';
    const warInfoValues = [factionId, '{}', JSON.stringify(factionMembers), 0, 0];

    console.log('SQL WarInfo Query:', warInfoQuery); // Log the SQL WarInfo query

    await pool.query(warInfoQuery, warInfoValues);

    // Insert data into the rewardData table
    const rewardDataQuery = 'INSERT INTO rewardData (facID, curWar, estHit, actHit, lastUpdate) VALUES (?, ?, ?, ?, ?)';
    const rewardDataValues = [factionId, '{}', 975000, 975000, 0];

    console.log('SQL rewardData Query:', rewardDataQuery); // Log the SQL rewardData query

    await pool.query(rewardDataQuery, rewardDataValues);

    console.log('Data inserted successfully');

    res.sendStatus(200);
  } catch (error) {
    console.error('Error:', error);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
