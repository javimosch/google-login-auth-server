const express = require('express');
const router = express.Router();

/**
 * Test page
 */
router.get('/', (req, res) => {
  // Filter out IDP apps (those with openidProvider=1)
  res.render('index',{
    apps: global.applications.filter(a => !a.openidProvider),
    idps: global.applications.filter(a => a.openidProvider)
  });
});

module.exports = router;