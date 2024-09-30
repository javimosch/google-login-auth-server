const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI; // Ensure MONGO_URI is set in your .env file
const dbName = process.env.DB_NAME; // Ensure DB_NAME is set in your .env file

const models = require('../models'); // Load all models

mongoose.connect(`${mongoURI}`, {dbName, useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));