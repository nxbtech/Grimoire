const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');

const app = express();
app.use(express.json());
app.use(cors());

// Servir les fichiers statiques
app.use('/uploads', express.static('uploads'));

// Connexion à MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/monprojetdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connexion à MongoDB réussie'))
  .catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Utilisation des routes
// Ajustement dans server.js
app.use('/api', authRoutes); // Cela rendra les routes disponibles à /api/signin et /api/signup
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});