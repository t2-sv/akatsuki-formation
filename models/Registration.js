const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  prenom: { type: String, required: true, trim: true },
  tel: { type: String, required: true, trim: true },
  telNormalized: { type: String, required: true, index: true },
  niveau: { type: String, trim: true, default: '' },
  formations: {
    type: [String],
    required: true,
    validate: (v) => Array.isArray(v) && v.length > 0,
  },
  total: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Registration', RegistrationSchema);
