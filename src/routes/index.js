const express = require('express');
const router = express.Router();
const ClientConfig = require("../models/ClientConfig");

router.get('/', async (req, res) => {
  // Filter out IDP apps (those with openidProvider=1)
  let message = ''
  if (!req.query.clientId) {
    message = "Le paramètre clientId est manquant"
  } else {
    try {
      const config = await ClientConfig.findOne({_id: req.query.clientId});
      if (!config) message = `L'id client (${req.query.clientId}) fournit est inconnu`
    } catch (error) {
      message = `L'id client (${req.query.clientId}) fournit est inconnu`;
    }
  }
  res.render('index', {
    apps: global.applications.filter(a => !a.openidProvider),
    message: message,
    clientId: req.query.clientId ?? '',
    idps: global.applications.filter(a => a.openidProvider)
  });
});

module.exports = router;