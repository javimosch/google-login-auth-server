const express = require('express');
const router = express.Router();
const ClientConfig = require("../models/ClientConfig");
const {config} = require("dotenv");

router.get('/', async (req, res) => {
  // Filter out IDP apps (those with openidProvider=1)
  let message = '';
  let config = null;
  if (!req.query.clientId) {
    message = "Parameter clientId is missing"
  } else {
    try {
      config = await ClientConfig.findOne({_id: req.query.clientId});
      if (!config) message = `Client ID (${req.query.clientId}) unknown`
    } catch (error) {
      console.error('error getting config in mongo', error);
      message = `Client ID (${req.query.clientId}) unknown`;
    }
    req.session.auth_attempt_id = Date.now() + "-" + Math.random().toString(36).substr(2, 9);
    let logData = {
      message: message === '' ? `Connection attempt with config ID ${req.query.clientId}.` : message,
      configId: req.query.clientId,
    };
    if (config) {
      console.log(config)
      logData.clientName = config.clientName;
      logData.app = config.applications[0];
      logData.provider = config.provider;
      logData.attemptId = req.session.auth_attempt_id;
    } else {
      delete req.session.auth_attempt_id;
    }
    await saveSsoLog(logData);
  }
  res.render('index', {
    apps: global.applications.filter(a => !a.openidProvider),
    message: message,
    configId: message === '' ? (req.query.clientId ?? '') : '',
    idps: global.applications.filter(a => a.openidProvider)
  });
});

module.exports = router;