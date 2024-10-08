require('dotenv').config(); // Activate dotenv
const express = require('express');
const app = express();
const authRoutes = require('./routes/auth');
const indexRoutes = require('./routes/index');
const db = require('./config/db'); // Import the database connection logic
require('./apps'); // Load applications from apps.js

//Print applications configurations while hidding sensitive fields
console.log({
    applications:[...global.applications].map(a=>{
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

app.use('/', indexRoutes);
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));