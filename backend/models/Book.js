const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,  // Référence au modèle User
    ref: 'User',
    required: true
  },
  grade: {
    type: Number,
    required: true
  }
});

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  imageUrl: { type: String, required: true },
  ratings: [ratingSchema],  // Un tableau de notes
  averageRating: { type: Number, default: 0 },  // Note moyenne
  user: {  // Ajoutez ce champ
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
});

module.exports = mongoose.model('Book', bookSchema);