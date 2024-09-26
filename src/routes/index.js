const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index');
});

router.get('/google-login', (req, res) => {
  res.render('google-login',{user:req.query.user?JSON.parse(req.query.user):null});
});

module.exports = router;