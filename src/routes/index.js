const express = require('express');
const router = express.Router();

/**
 * Test page
 */
router.get('/', (req, res) => {
  res.render('index');
});

/**
 * Route loaded into popup (performs google login and jwt retrieval)
 */
router.get('/google-login', (req, res) => {
  res.render('google-login',{user:req.query.user?JSON.parse(req.query.user):null});
});

module.exports = router;