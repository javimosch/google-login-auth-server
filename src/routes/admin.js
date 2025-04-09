const express = require('express');
const router = express.Router();
const path = require("path");

// Middleware d'authentification
function checkAuth(req, res, next) {
  if (req.session.authenticated) {
    return next();
  }
  res.redirect("/admin/login");
}

// Page de connexion
router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../../views/login.html"));
});

// Traitement du formulaire de connexion
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASSWORD) {
    req.session.authenticated = true;
    return res.redirect("/admin");
  }
  res.send("Identifiants incorrects. <a href='/admin/login'>Réessayer</a>");
});

// Déconnexion
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

// Protéger la page admin
router.get("/", checkAuth, (req, res) => {
  res.render('admin', { title: 'Administration', currentPage: 'admin' });
});

router.get("/logs", checkAuth, (req, res) => {
  res.render('logs', { title: 'Logs', currentPage: 'logs' });
});

router.get("/monitoring", checkAuth, (req, res) => {
  res.render('monitoring', { title: 'Monitoring', currentPage: 'monitoring' });
});

module.exports = router;