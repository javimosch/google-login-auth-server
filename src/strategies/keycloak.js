const passport = require("passport");
const OpenIDConnectStrategy = require("passport-openidconnect").Strategy;
const ClientConfig = require("../models/ClientConfig");
const express = require("express");
const router = express.Router();

passport.use("openidconnect", new OpenIDConnectStrategy({
  issuer: process.env.OIDC_ISSUER,
  clientID: process.env.OIDC_CLIENT_ID,
  clientSecret: process.env.OIDC_CLIENT_SECRET,
  authorizationURL: `${process.env.OIDC_ISSUER}/protocol/openid-connect/auth`,
  tokenURL: `${process.env.OIDC_ISSUER}/protocol/openid-connect/token`,
  userInfoURL: `${process.env.OIDC_ISSUER}/protocol/openid-connect/userinfo`,
  callbackURL: process.env.OIDC_CALLBACK_URL,
  scope: "openid profile email"
}, async (issuer, sub, profile, jwtClaims, accessToken, refreshToken, params, done) => {
  return done(null, profile);
}));

// Middleware pour charger dynamiquement la configuration avant l'authentification
const loadClientConfig = async (req, res, next) => {
  const clientId = req.query.clientId;
  if (!clientId) return res.status(400).json({ error: "clientId manquant" });

  const config = await ClientConfig.findOne({ _id: clientId });
  if (!config) return res.status(404).json({ error: "Configuration non trouvée" });

  // Mise à jour de la stratégie OpenID Connect
  passport._strategies.openidconnect._options = {
    clientID: config.clientId,
    clientSecret: config.clientSecret,
    authorizationURL: config.authorizationURL,
    tokenURL: config.tokenURL,
    userInfoURL: config.userInfoURL,
    callbackURL: config.redirectURI,
    scope: config.scopes.join(" ")
  };

  next();
};

// Route protégée par la configuration dynamique
router.get("/auth/keycloak", loadClientConfig, passport.authenticate("openidconnect"));
router.get("/auth/keycloak/callback", passport.authenticate("openidconnect", { failureRedirect: "/" }), (req, res) => {
  res.redirect("/profile");
});