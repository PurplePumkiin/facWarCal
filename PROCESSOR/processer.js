import dotenv from 'dotenv';
import mysql from 'mysql2/promise'; // Import the 'mysql2/promise' package

dotenv.config();

(async () => {
  try {
    // Create a connection to the database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE
    });

    // Calculate the current Unix time minus 1800 seconds
    const currentTime = Math.floor(Date.now() / 1000);
    const thresholdTime = currentTime - 1800;

    // Prepare the SQL query
    const sqlQuery = `SELECT facID FROM WarInfo WHERE lastUpdate <= ${thresholdTime}`;

    // Execute the query
    const [results] = await connection.query(sqlQuery);

    // Process the results
    results.forEach(row => {
      console.log(row.facID);
    });

    // Close the database connection
    connection.end();

  } catch (error) {
    console.error(error);
  }
})();
