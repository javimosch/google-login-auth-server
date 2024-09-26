require('dotenv').config(); // Activate dotenv
const express = require('express');
const app = express();
const authRoutes = require('./routes/auth');
const indexRoutes = require('./routes/index');

app.set('view engine', 'ejs');
app.use(express.json());

app.use('/', indexRoutes);
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));