import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

async function callAPI() {
  try {
    const apiKey = process.env.API_KEY;
    const apiUrl = `${process.env.API_URL}/faction/49684?selections=caches&key=${apiKey}`;
    console.log('API URL:', apiUrl);

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    const data = await response.json();
    console.log('API Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Call the API immediately and then every minute
callAPI();
setInterval(callAPI, 60000);
