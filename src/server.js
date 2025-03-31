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
const session = require("express-session");

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));