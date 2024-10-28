
// index.js
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const axios = require('axios');

const app = express();
const port = 3005;

const CLIENT_ID = process.env.CLIENT_ID || 's3c5igNpBQpLv90tLCuysFyhX8zwb7uy';
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const AUDIENCE = process.env.AUDIENCE || 'https://misitioba.eu.auth0.com/api/v2/';

async function getUserDetails(jwt, email) {
    try {
      const response = await axios.get(`https://misitioba.eu.auth0.com/api/v2/users-by-email?email=${encodeURIComponent(email)}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${jwt}`
        }
      });
      
      return response.data; // Return user details
    } catch (error) {
      console.error('Error retrieving user details:', error.response ? error.response.data : error.message);
      throw error; // Rethrow error for handling
    }
  }

  
async function requestJWT() {
  try {
    const response = await axios.post('https://misitioba.eu.auth0.com/oauth/token', 
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        audience: AUDIENCE
      }), 
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    // Print the access token
    console.log('Access Token:', response.data.access_token);
    return response.data.access_token
  } catch (error) {
    console.error('Error requesting JWT:', error.response ? error.response.data : error.message);
  }
}

app.get('/', (req, res) => {
  requestJWT().then(async(jwt) => {
    let userDetails = await getUserDetails(jwt, 'arancibiajav@gmail.com')
    res.json({
        userDetails
    })
    //res.send('Access token printed in the console.');
  }).catch(err => {
    res.status(500).send('Error requesting token.');
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

/**
 * Request JWT
  curl --request POST \
  --url 'https://misitioba.eu.auth0.com/oauth/token' \
  --header 'content-type: application/x-www-form-urlencoded' \
  --data grant_type=client_credentials \
  --data 'client_id=s3c5igNpBQpLv90tLCuysFyhX8zwb7uy' \
  --data 'client_secret=' \
  --data 'audience=https://misitioba.eu.auth0.com/api/v2/'

  response format: {access_token}
 */