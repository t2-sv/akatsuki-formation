require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const registrationsRouter = require('./routes/registrations');

const app = express();

const dns = require("dns");

// Change DNS
dns.setServers(["1.1.1.1", "8.8.8.8"]);


app.use(cors());
app.use(express.json());

// API
app.use('/api/registrations', registrationsRouter);

// Site statique (le formulaire d'inscription)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI manquant. Copie .env.example en .env et renseigne-le.");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connecté à MongoDB.');
    app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
  })
  .catch((err) => {
    console.error('Erreur de connexion MongoDB:', err.message);
    process.exit(1);
  });
