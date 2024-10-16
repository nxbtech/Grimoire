const Book = require('../models/Book');
const sharp = require('sharp');
const fs = require('fs');

// Fonction pour gérer l'upload et le traitement d'image
const processImage = async (file) => {
  // Génère un chemin unique pour l'image uploadée en fonction du nom de fichier et de la date actuelle
  const imagePath = `uploads/${Date.now()}-${file.originalname}`;
  
  // Utilise Sharp pour redimensionner l'image à une largeur de 500px et la sauvegarde dans le chemin généré
  await sharp(file.path).resize({ width: 500 }).toFile(imagePath);
  
  // Supprime l'image temporaire originale après traitement
  fs.unlinkSync(file.path);
  
  // Retourne le chemin final de l'image traitée
  return imagePath;
};

// Fonction utilitaire pour formater un livre avant de le renvoyer dans la réponse
const formatBook = (book) => ({
  ...book._doc, // Utilise l'opérateur spread pour copier toutes les propriétés du livre
  id: book._id, // Ajoute un champ 'id' avec la valeur de _id
  userId: book.user, // Ajoute un champ 'userId' avec la référence de l'utilisateur ayant créé le livre
  imageUrl: `http://localhost:3000${book.imageUrl}`, // Construit l'URL complète de l'image
});

// Ajout d'un livre
exports.addBook = async (req, res) => {
  try {
    const { book } = req.body; // Récupère les informations du livre à partir du corps de la requête

    // Vérifie si une image a bien été uploadée
    if (!req.file) {
      return res.status(400).json({ error: 'Image manquante.' });
    }

    // Vérifie si l'utilisateur est authentifié
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Authentification requise.' });
    }

    // Traite l'image uploadée
    const imagePath = await processImage(req.file);

    // Crée un nouvel objet livre avec les informations fournies par l'utilisateur
    const newBook = new Book({
      ...JSON.parse(book), // Parse les informations du livre envoyées sous forme de chaîne JSON
      imageUrl: `/${imagePath}`, // Assigne le chemin de l'image traitée
      user: req.user._id // Lie le livre à l'utilisateur authentifié
    });

    // Sauvegarde le nouveau livre dans la base de données
    const savedBook = await newBook.save();

    // Envoie une réponse avec le livre formaté
    res.status(201).json({
      message: 'Livre ajouté avec succès',
      book: formatBook(savedBook),
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de l\'ajout du livre.' });
  }
};

// Récupération de tous les livres avec chemin complet de l'image
exports.getBooks = async (req, res) => {
  try {
    // Récupère tous les livres dans la base de données
    const books = await Book.find();
    
    // Retourne les livres formatés
    res.status(200).json(books.map(formatBook));  
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des livres.' });
  }
};

// Récupération d'un livre par ID
exports.getBookById = async (req, res) => {
  try {
    // Récupère un livre par son ID
    const book = await Book.findById(req.params.id);

    // Si le livre n'est pas trouvé, renvoie une erreur 404
    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé.' });
    }

    // Retourne le livre formaté
    res.status(200).json(formatBook(book));
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la récupération du livre.' });
  }
};

// Mise à jour d'un livre (l'utilisateur doit être l'auteur)
exports.updateBook = async (req, res) => {
  try {
    // Récupère le livre par son ID
    const book = await Book.findById(req.params.id);

    // Si le livre n'est pas trouvé, renvoie une erreur 404
    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé.' });
    }

    // Vérifie si l'utilisateur est authentifié
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    // Vérifie si l'utilisateur connecté est bien l'auteur du livre
    const isOwner = book.user && book.user.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({ message: 'Non autorisé à modifier ce livre.' });
    }

    // Prépare les nouvelles données à mettre à jour
    const updatedData = { ...req.body };
    if (req.file) {
      // Si une nouvelle image est uploadée, traite-la
      updatedData.imageUrl = `/${await processImage(req.file)}`;
    }

    // Met à jour le livre dans la base de données et renvoie le livre mis à jour
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    res.status(200).json({
      message: 'Livre mis à jour avec succès',
      book: formatBook(updatedBook),
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du livre.' });
  }
};

// Récupération des livres les mieux notés
exports.getBestRatedBooks = async (req, res) => {
  try {
    // Récupère les livres avec une moyenne de notes supérieure à 0 et les trie par ordre décroissant
    const bestRatedBooks = await Book.find({ averageRating: { $gt: 0 } })
      .sort({ averageRating: -1 })
      .limit(5);

    // Si aucun livre n'a de note, renvoie une erreur 404
    if (!bestRatedBooks.length) {
      return res.status(404).json({ message: 'Aucun livre trouvé avec une note.' });
    }

    // Retourne les livres les mieux notés formatés
    res.status(200).json(bestRatedBooks.map(formatBook));
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des livres les mieux notés.' });
  }
};

// Notation d'un livre
exports.rateBook = async (req, res) => {
  try {
    const { rating } = req.body; // Récupère la note envoyée par l'utilisateur

    // Vérifie si l'utilisateur est authentifié
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    // Récupère le livre par son ID
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé.' });
    }

    // Vérifie si l'utilisateur a déjà noté ce livre
    const existingRating = book.ratings.find(r => r.userId.toString() === req.user._id.toString());
    if (existingRating) {
      // Si une note existe, la met à jour
      existingRating.grade = rating;
    } else {
      // Sinon, ajoute une nouvelle note
      book.ratings.push({ userId: req.user._id, grade: rating });
    }

    // Recalcule la moyenne des notes
    book.averageRating = book.ratings.reduce((sum, rate) => sum + rate.grade, 0) / book.ratings.length;

    // Sauvegarde les modifications du livre et renvoie le livre mis à jour
    const updatedBook = await book.save();

    res.status(200).json(formatBook(updatedBook));
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la notation du livre.' });
  }
};

// Suppression d'un livre (l'utilisateur doit être l'auteur)
exports.deleteBook = async (req, res) => {
  try {
    // Récupère le livre par son ID
    const book = await Book.findById(req.params.id);

    // Si le livre n'est pas trouvé, renvoie une erreur 404
    if (!book) {
      return res.status(404).json({ message: 'Livre non trouvé.' });
    }

    // Vérifie si l'utilisateur est authentifié
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    // Vérifie si l'utilisateur connecté est bien l'auteur du livre
    const isOwner = book.user && book.user.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(403).json({ message: 'Non autorisé à supprimer ce livre.' });
    }

    // Supprime le livre de la base de données
    await book.deleteOne();

    res.status(200).json({ message: 'Livre supprimé avec succès.' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du livre.' });
  }
};