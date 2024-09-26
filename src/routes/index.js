const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

router.get('/', (req, res) => {
  res.render('index');
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/dashboard', (req, res) => {
  const user = JSON.parse(decodeURIComponent(req.query.user));
  res.render('dashboard', { user });
});

router.get('/protected', authMiddleware, (req, res) => {
  res.render('protected', { user: req.user });
});

module.exports = router;