require('dotenv').config(); // Activate dotenv
const express = require('express');
const app = express();
const authRoutes = require('./routes/auth');
const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');
const db = require('./config/db'); // Import the database connection logic
const apps = require('./apps'); // Load applications from apps.js
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");

// Importation des stratégies d'authentification
require("./strategies/google");
require("./strategies/github");
require("./strategies/keycloak");

//Print applications configurations while hidding sensitive fields
console.log({
    apps:apps.map(a=>{
        let b = {...a}
        for(let x in b){
            b[x] = x.toLowerCase().includes('secret')||x.toLowerCase().includes('key') ? '***':b[x]
            
        }
        return b
    })
})

app.set('view engine', 'ejs');
app.use(express.json());

app.use('/',(req,res,next)=>{
    console.log("REQ",req.url)
    next()
})

// Middleware pour parser les requêtes JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration des sessions
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Mettre à true si HTTPS
}));

app.use('/', indexRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);

app.use(bodyParser.json());

// Configuration des sessions
app.use(session({ secret: "mysecret", resave: false, saveUninitialized: true }));

// Initialisation de Passport
app.use(passport.initialize());
app.use(passport.session(undefined));

// Middleware pour stocker l'utilisateur dans la session
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Routes
app.get("/", (req, res) => {
  res.send('<a href="/auth/google">Login with Google</a> | <a href="/auth/github">Login with GitHub</a> | <a href="/auth/keycloak">Login with Keycloak</a>');
});

// Google Auth
app.get("/auth/google", passport.authenticate("google", { scope: ["openid", "profile", "email"] }));
app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/" }), (req, res) => res.redirect("/profile"));

// GitHub Auth
app.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));
app.get("/auth/github/callback", passport.authenticate("github", { failureRedirect: "/" }), (req, res) => res.redirect("/profile"));

// Profil utilisateur après connexion
app.get("/profile", (req, res) => {
  if (!req.user) return res.redirect("/");
  res.json(req.user);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));