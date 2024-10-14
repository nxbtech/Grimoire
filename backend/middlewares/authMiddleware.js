const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extraire le token et le décoder
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, 'tonSecret');

      // Récupérer l'utilisateur sans le mot de passe
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token invalide ou non autorisé.' });
    }
  } else {
    return res.status(401).json({ message: 'Accès non autorisé, token manquant.' });
  }
};