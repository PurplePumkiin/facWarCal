import mysql from 'mysql';
import aes256 from 'aes256';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Create a MySQL connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Connect to the database
connection.connect((error) => {
  if (error) {
    console.error('Error connecting to the database:', error);
    return;
  }

  console.log('Connected to the database.');

  // Function to process the entries
  const processEntries = async (entries) => {
    for (const entry of entries) {
      const { facID, apikey } = entry;

      // Decrypt the API key using AES-256-CBC
      const decryptedApiKey = aes256.decrypt(process.env.AES_KEY, apikey);

      // Make a request to the Torn API
      const response = await fetch(
        `https://api.torn.com/faction/${facID}?selections=basic&key=${decryptedApiKey}`
      );
      const data = await response.json();

      // Extract the required data from the JSON response
      const { ranked_wars, faction } = data;
      const opponent = faction.factionID.find((id) => id !== facID);
      const { start, end } = ranked_wars.war;
      const inWar = end === 0 ? 1 : 0;
      const warID = { opponent, start, end };

      // Convert the data to JSON format
      const jsonData = JSON.stringify({ warID, facMembers: data.members });

      // Process the data as needed
      console.log(jsonData);

      // Update the lastUpdate field to the current UNIX timestamp
      const currentUnixTime = Math.floor(Date.now() / 1000);
      const updateQuery = `UPDATE WarInfo SET lastUpdate = ${currentUnixTime} WHERE facID = ${facID}`;
      connection.query(updateQuery, (error) => {
        if (error) {
          console.error('Error updating the lastUpdate field:', error);
        }
      });
    }
  };

  // Function to re-query the WarInfo table
  const requeryTable = () => {
    const currentUnixTime = Math.floor(Date.now() / 1000) - 1800;
    const query = `SELECT * FROM WarInfo WHERE lastUpdate <= ${currentUnixTime}`;
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Error executing the SQL query:', error);
        return;
      }

      if (results.length > 0) {
        processEntries(results);
      } else {
        // Sleep for 3 minutes (180,000 milliseconds) before re-querying
        setTimeout(requeryTable, 180000);
      }
    });
  };

  // Initial query to start processing entries
  requeryTable();
});
