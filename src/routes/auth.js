const express = require('express');
const router = express.Router();
const axios = require('axios');
const { client, clientId, clientSecret, redirectUri } = require('../config/google');

router.get('/google', (req, res) => {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.append('client_id', clientId);
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', 'profile email');
  res.redirect(url.toString());
});

router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { data } = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });

    const ticket = await client.verifyIdToken({
      idToken: data.id_token,
      audience: clientId
    });

    const payload = ticket.getPayload();
    // Here, you would typically create a session or JWT for the user
    // For simplicity, we'll just redirect to the dashboard with the user info
    res.redirect(`/dashboard?user=${encodeURIComponent(JSON.stringify(payload))}`);
  } catch (error) {
    console.error('Authentication error:', error);
    res.redirect('/login?error=authentication_failed');
  }
});

module.exports = router;