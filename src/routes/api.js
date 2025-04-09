const express = require('express');
const router = express.Router();
const ClientConfig = require("../models/ClientConfig");
const SsoLog = require("../models/SsoLog");

// Route pour enregistrer une configuration
router.post("/client-config", async (req, res) => {
  try {
    const config = new ClientConfig(req.body);
    await config.save();
    res.status(201).json({ message: "Configuration enregistrée, identifiant unique à fournir au client : " + config._id, config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route pour récupérer la configuration d'un client
router.get("/client-config/:clientId", async (req, res) => {
  try {
    const config = await ClientConfig.findOne({ clientId: req.params.clientId });
    if (!config) return res.status(404).json({ message: "Configuration non trouvée" });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route pour récupérer une configuration
router.get("/client-configs/:id", async (req, res) => {
  try {
    const config = await ClientConfig.findOne({ _id: req.params.id });
    if (!config) return res.status(404).json({ message: "Configuration non trouvée" });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Récupérer toutes les configurations
router.get("/client-configs", async (req, res) => {
  try {
    const configs = await ClientConfig.find();
    res.json(configs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Modifier une configuration existante
router.put("/client-config/:id", async (req, res) => {
  try {
    const updatedConfig = await ClientConfig.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedConfig) return res.status(404).json({ message: "Configuration non trouvée" });
    res.json({ message: "Configuration mise à jour", config: updatedConfig });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supprimer une configuration
router.delete("/client-config/:id", async (req, res) => {
  try {
    const deletedConfig = await ClientConfig.findByIdAndDelete(req.params.id);
    if (!deletedConfig) return res.status(404).json({ message: "Configuration non trouvée" });
    res.json({ message: "Configuration supprimée" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Récupérer tous les logs
router.get("/logs", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      message,
      provider,
      app,
      configId,
      attemptId,
      clientName,
      error,
      sortBy = 'dt',
      sortOrder = 'asc'
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const filters = {
      dt: {
        $gte: new Date(startDate + ' 00:00:00'),
        $lte: new Date(endDate + ' 23:59:59'),
      },
    };
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (message) filters.message = new RegExp(message, 'i');
    if (provider) filters.provider = provider;
    if (app) filters.app = app;
    if (configId) filters.configId = configId;
    if (attemptId) filters.attemptId = attemptId;
    if (clientName) filters.clientName = clientName;
    if (error !== undefined) filters.error = error === 'true';

    console.log('Log mongo filters', filters)
    const logs = await SsoLog.find(filters)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    const total = await SsoLog.countDocuments(filters);

    res.json({ logs, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const formatDate = (date) => {
  return date.toISOString().split('T')[0]; // "2025-04-09"
};

router.get('/login-attempts', async (req, res) => {
  const { startDate, endDate, groupBy = 'total', clientName, provider, app } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  const groupFields = groupBy.split(','); // supporte plusieurs dimensions

  try {
    // 1. Construire dynamiquement le filtre Mongo
    const mongoFilter = {
      dt: {
        $gte: new Date(startDate + ' 00:00:00'),
        $lte: new Date(endDate + ' 23:59:59'),
      },
    };

    if (clientName) {
      mongoFilter.clientName = clientName;
    }

    if (provider) {
      mongoFilter.provider = provider;
    }

    if (app) {
      mongoFilter.app = app;
    }

    // 2. Récupération des logs
    const logs = await SsoLog.find(mongoFilter).sort({ dt: 1 }).lean();

    // 3. Groupement par attemptId
    const attemptsMap = new Map();

    for (const log of logs) {
      const { attemptId } = log;
      if (!attemptsMap.has(attemptId)) {
        attemptsMap.set(attemptId, []);
      }
      attemptsMap.get(attemptId).push(log);
    }

    // 4. Détection erreurs/succès via dernier log
    const summaryMap = new Map();

    for (const logsOfAttempt of attemptsMap.values()) {
      const lastLog = logsOfAttempt[logsOfAttempt.length - 1];
      const isError = lastLog.error === true;

      // Trouver l'email dans les logs de cette tentative
      const emailLog = logsOfAttempt.find(log => log.data?.email || log.data?.responseData?.email);
      const userEmail = emailLog?.data?.email || emailLog?.data?.responseData?.email || 'unknown';
      const clientName = lastLog.clientName || 'unknown';

      // Construction de la clé de groupement dynamique
      const keyParts = groupFields.reduce((acc, field) => {
        let value;
        switch (field) {
          case 'client':
            value = clientName;
            break;
          case 'provider':
            value = lastLog.provider || 'unknown';
            break;
          case 'user':
            value = `${userEmail}`;
            acc['client'] = clientName
            break;
          case 'date':
            value = formatDate(lastLog.dt);
            break;
          case 'total':
            value = 'total';
            break;
          default:
            value = `unknown(${field})`;
        }

        acc[field] = value;
        return acc;
      }, {});

      const groupKey = groupFields.map(field => keyParts[field]).join('|');

      if (!summaryMap.has(groupKey)) {
        if (groupBy === 'total') {
          summaryMap.set(groupKey, {nbError: 0, nbSuccess: 0});
        } else {
          keyParts.nbError = 0;
          keyParts.nbSuccess = 0;
          summaryMap.set(groupKey, keyParts);
        }
      }

      const summary = summaryMap.get(groupKey);
      if (isError) {
        summary.nbError += 1;
      } else {
        summary.nbSuccess += 1;
      }
    }

    // 5. Format final
    const result = Array.from(summaryMap.entries()).map(([key, counts]) => {
      return counts;
    });

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;