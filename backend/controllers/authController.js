const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Génération d'un token JWT (fonction fléchée concise)
const generateToken = user => jwt.sign({ id: user._id }, 'tonSecret', { expiresIn: '1h' });

// Vérification si l'utilisateur existe déjà (fonction fléchée concise)
const checkUserExists = async email => await User.findOne({ email });

// Création d'un nouvel utilisateur (fonction fléchée concise)
const createUser = async (email, password) => {
  const newUser = new User({ email, password });
  await newUser.save();
  return newUser;
};

// Comparaison des mots de passe (fonction fléchée concise)
const comparePassword = async (enteredPassword, storedPassword) => await bcrypt.compare(enteredPassword, storedPassword);

// Inscription (fonction fléchée concise)
exports.signup = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userExists = await checkUserExists(email);
    if (userExists) return res.status(400).json({ message: 'Cet email est déjà utilisé.' });

    const newUser = await createUser(email, password);
    res.status(201).json({ message: 'Utilisateur créé avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de la création de l\'utilisateur.' });
  }
};

// Connexion (fonction fléchée concise)
exports.signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await checkUserExists(email);
    if (!user) return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });

    const token = generateToken(user);
    res.json({ token, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
};