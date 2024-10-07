const express = require('express');
const router = express.Router();

/**
 * Test page
 */
router.get('/', (req, res) => {
  res.render('index',{apps:global.applications.filter(a=>a.openid_provider!==true)});
});

module.exports = router;