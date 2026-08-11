const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');

// Catalogue des formations et de leurs prix (source de vérité côté serveur,
// pour ne jamais faire confiance à un total envoyé par le navigateur).
const COURSE_PRICES = {
  "Initiation à l'informatique": 5000,
  "Microsoft Office": 5000,
  "Infographie & Montage vidéo": 5000,
  "Programmation": 10000,
  "Hacking éthique & Cybersécurité": 10000,
};

// Petit middleware pour protéger l'espace organisateur avec un mot de passe simple.
function requireAdmin(req, res, next) {
  const key = req.header('x-admin-key');
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Accès refusé.' });
  }
  next();
}

// Normalise un numéro pour comparaison (retire espaces, tirets, indicatifs...)
function normalizeTel(tel){
  return String(tel || '').replace(/\D/g, '').slice(-10); // garde les 10 derniers chiffres
}

// POST /api/registrations — créer une inscription (public)
router.post('/', async (req, res) => {
  try {
    const { nom, prenom, tel, niveau, formations } = req.body;

    if (!nom || !prenom || !tel) {
      return res.status(400).json({ error: 'Nom, prénom et téléphone sont obligatoires.' });
    }
    if (!Array.isArray(formations) || formations.length === 0) {
      return res.status(400).json({ error: 'Sélectionne au moins une formation.' });
    }

    const unknown = formations.find((f) => !(f in COURSE_PRICES));
    if (unknown) {
      return res.status(400).json({ error: `Formation inconnue : ${unknown}` });
    }

    const telNormalized = normalizeTel(tel);
    if (telNormalized.length < 8) {
      return res.status(400).json({ error: 'Numéro de téléphone invalide.' });
    }

    // Empêche une double inscription avec le même numéro
    const doublon = await Registration.findOne({ telNormalized });
    if (doublon) {
      return res.status(409).json({
        error: `Ce numéro est déjà inscrit (${doublon.prenom} ${doublon.nom}, le ${new Date(doublon.date).toLocaleDateString('fr-FR')}). Si tu veux ajouter une formation ou corriger une info, contacte-nous directement sur WhatsApp.`,
      });
    }

    const total = formations.reduce((sum, f) => sum + COURSE_PRICES[f], 0);

    const entry = await Registration.create({
      nom: nom.trim(),
      prenom: prenom.trim(),
      tel: tel.trim(),
      telNormalized,
      niveau: (niveau || '').trim(),
      formations,
      total,
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error('Erreur création inscription:', err);
    res.status(500).json({ error: "Une erreur serveur s'est produite." });
  }
});

// GET /api/registrations — lister toutes les inscriptions (protégé)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const entries = await Registration.find().sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    console.error('Erreur lecture inscriptions:', err);
    res.status(500).json({ error: "Une erreur serveur s'est produite." });
  }
});

module.exports = router;
