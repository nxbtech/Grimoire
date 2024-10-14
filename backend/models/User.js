const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Définition du schéma de l'utilisateur
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Avant de sauvegarder l'utilisateur, on crypte son mot de passe
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // Si le mot de passe n'est pas modifié, passe à l'étape suivante
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt); // Hashage du mot de passe
  next();
});

// Comparer les mots de passe pour l'authentification
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;