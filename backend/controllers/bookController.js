const Book = require('../models/Book');
const sharp = require('sharp');
const fs = require('fs');

// Fonction pour gérer l'upload et le traitement d'image
const processImage = async (file) => {
  const imagePath = `uploads/${Date.now()}-${file.originalname}`;
  await sharp(file.path).resize({ width: 500 }).toFile(imagePath);
  fs.unlinkSync(file.path);
  console.log(`Image uploadée et redimensionnée : ${imagePath}`);
  return imagePath;
};

// Fonction utilitaire pour formater un livre
const formatBook = (book) => ({
  ...book._doc,
  id: book._id,
  userId: book.user ? book.user.toString() : null,  // Définit 'userId' à null si 'book.user' est indéfini
  imageUrl: `http://localhost:3000${book.imageUrl}`,
});

// Ajout d'un livre
exports.addBook = async (req, res) => {
  try {
    const { book } = req.body;
    console.log('Requête reçue pour ajouter un livre :', book);
    console.log('Utilisateur connecté (req.user) :', req.user);  // Vérifie si l'utilisateur est connecté

    if (!req.file) {
      console.log('Erreur : Image manquante');
      return res.status(400).json({ error: 'Image manquante.' });
    }

    if (!req.user || !req.user._id) {
      console.log('Erreur : Utilisateur non authentifié');
      return res.status(401).json({ error: 'Authentification requise.' });
    }

    const imagePath = await processImage(req.file);
    console.log('Image processee et sauvegardee :', imagePath);

    const newBook = new Book({
      ...JSON.parse(book),
      imageUrl: `/${imagePath}`,
      user: req.user._id  // Vérifie que req.user est bien défini
    });

    const savedBook = await newBook.save();
    console.log('Livre sauvegardé avec succès :', savedBook);

    res.status(201).json({
      message: 'Livre ajouté avec succès',
      book: formatBook(savedBook),  // Utilise la fonction formatBook pour formater la réponse
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du livre :', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'ajout du livre.' });
  }
};

// Récupération de tous les livres avec chemin complet de l'image
exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find();
    console.log('Livres récupérés :', books);
    res.status(200).json(books.map(formatBook));  // Utilise la fonction formatBook
  } catch (error) {
    console.error('Erreur lors de la récupération des livres :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des livres.' });
  }
};

// Récupération d'un livre par ID
exports.getBookById = async (req, res) => {
  try {
    console.log('Requête reçue pour récupérer un livre avec ID :', req.params.id);
    console.log('Utilisateur connecté (req.user) :', req.user);

    const book = await Book.findById(req.params.id);
    if (!book) {
      console.log('Livre non trouvé, ID :', req.params.id);
      return res.status(404).json({ message: 'Livre non trouvé.' });
    }

    console.log('Livre trouvé :', book);

    res.status(200).json(formatBook(book));  // Utilise la fonction formatBook
  } catch (error) {
    console.error('Erreur lors de la récupération du livre :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération du livre.' });
  }
};

// Mise à jour d'un livre (l'utilisateur doit être l'auteur)
exports.updateBook = async (req, res) => {
  try {
    console.log('Requête reçue pour mettre à jour le livre avec ID :', req.params.id);
    console.log('Utilisateur connecté (req.user) :', req.user);

    const book = await Book.findById(req.params.id);

    if (!book) {
      console.log('Livre non trouvé pour la mise à jour, ID :', req.params.id);
      return res.status(404).json({ message: 'Livre non trouvé.' });
    }

    if (!req.user || !req.user._id) {
      console.log('Erreur : Utilisateur non authentifié');
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    // Vérification que l'utilisateur est bien l'auteur du livre
    console.log('Auteur du livre (book.user) :', book.user);
    const isOwner = book.user && book.user.toString() === req.user._id.toString();
    console.log(`Utilisateur est l'auteur : ${isOwner}`);

    if (!isOwner) {
      console.log('Erreur : Utilisateur non autorisé à modifier ce livre');
      return res.status(403).json({ message: 'Non autorisé à modifier ce livre.' });
    }

    // Mise à jour des données du livre
    const updatedData = { ...req.body };
    if (req.file) {
      updatedData.imageUrl = `/${await processImage(req.file)}`;
    }

    const updatedBook = await Book.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    console.log('Livre mis à jour avec succès :', updatedBook);

    res.status(200).json({
      message: 'Livre mis à jour avec succès',
      book: formatBook(updatedBook),  // Utilise la fonction formatBook
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du livre :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du livre.' });
  }
};

// Récupération des livres les mieux notés
exports.getBestRatedBooks = async (req, res) => {
  try {
    console.log('Requête reçue pour récupérer les livres les mieux notés');
    const bestRatedBooks = await Book.find({ averageRating: { $gt: 0 } })
      .sort({ averageRating: -1 })
      .limit(5);

    if (!bestRatedBooks.length) {
      console.log('Aucun livre trouvé avec une note.');
      return res.status(404).json({ message: 'Aucun livre trouvé avec une note.' });
    }

    console.log('Livres les mieux notés récupérés :', bestRatedBooks);
    res.status(200).json(bestRatedBooks.map(formatBook));  // Utilise la fonction formatBook
  } catch (error) {
    console.error('Erreur lors de la récupération des livres les mieux notés :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des livres les mieux notés.' });
  }
};

// Notation d'un livre
exports.rateBook = async (req, res) => {
  try {
    console.log('Requête reçue pour noter un livre avec ID :', req.params.id);
    console.log('Utilisateur connecté (req.user) :', req.user);

    const { rating } = req.body;
    console.log('Note reçue :', rating);

    if (!req.user || !req.user._id) {
      console.log('Erreur : Utilisateur non authentifié');
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      console.log('Livre non trouvé, ID :', req.params.id);
      return res.status(404).json({ message: 'Livre non trouvé.' });
    }

    const existingRating = book.ratings.find(r => r.userId.toString() === req.user._id.toString());
    console.log('Évaluation existante de l\'utilisateur :', existingRating);

    if (existingRating) {
      existingRating.grade = rating;
    } else {
      book.ratings.push({ userId: req.user._id, grade: rating });
    }

    book.averageRating = book.ratings.reduce((sum, rate) => sum + rate.grade, 0) / book.ratings.length;
    const updatedBook = await book.save();
    console.log('Livre mis à jour avec la nouvelle note :', updatedBook);

    res.status(200).json(formatBook(updatedBook));  // Utilise la fonction formatBook
  } catch (error) {
    console.error('Erreur lors de la notation du livre :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la notation du livre.' });
  }
};

// Suppression d'un livre (l'utilisateur doit être l'auteur)
exports.deleteBook = async (req, res) => {
  try {
    console.log('Requête reçue pour supprimer le livre avec ID :', req.params.id);
    console.log('Utilisateur connecté (req.user) :', req.user);

    const book = await Book.findById(req.params.id);

    if (!book) {
      console.log('Livre non trouvé pour la suppression, ID :', req.params.id);
      return res.status(404).json({ message: 'Livre non trouvé.' });
    }

    if (!req.user || !req.user._id) {
      console.log('Erreur : Utilisateur non authentifié');
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    // Vérification que l'utilisateur est bien l'auteur du livre
    console.log('Auteur du livre (book.user) :', book.user);
    const isOwner = book.user && book.user.toString() === req.user._id.toString();
    console.log(`Utilisateur est l'auteur : ${isOwner}`);

    if (!isOwner) {
      console.log('Erreur : Utilisateur non autorisé à supprimer ce livre');
      return res.status(403).json({ message: 'Non autorisé à supprimer ce livre.' });
    }

    // Suppression du livre
    await book.deleteOne();
    console.log('Livre supprimé avec succès :', book);

    res.status(200).json({ message: 'Livre supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression du livre :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du livre.' });
  }
};