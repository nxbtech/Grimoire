const express = require('express');
const { addBook, getBooks, getBookById, updateBook, getBestRatedBooks, rateBook, deleteBook } = require('../controllers/bookController');
const { protect } = require('../middlewares/authMiddleware');
const multer = require('multer');
const fs = require('fs');

const router = express.Router();

// Fonction pour créer le répertoire d'upload s'il n'existe pas
const ensureUploadDirExists = (path) => {
  if (!fs.existsSync(path)) fs.mkdirSync(path);
};

// Configuration du stockage Multer (fonction fléchée)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    ensureUploadDirExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

// Middleware d'upload d'image
const upload = multer({ storage });

// Routes pour les livres
router.get('/bestrating', getBestRatedBooks);  // Livres les mieux notés
router.post('/', protect, upload.single('image'), addBook);  // Ajout d'un livre
router.get('/', getBooks);  // Récupération de tous les livres
router.get('/:id', getBookById);  // Récupération d'un livre par ID
router.put('/:id', protect, upload.single('image'), updateBook);  // Mise à jour d'un livre
router.post('/:id/rating', protect, rateBook);  // Notation d'un livre
router.delete('/:id', protect, deleteBook);  // Suppression d'un livre

module.exports = router;