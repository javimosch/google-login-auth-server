const express = require('express');
const router = express.Router();
const ClientConfig = require("../models/ClientConfig");

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

module.exports = router;