const API_URL = 'http://localhost:3000';
export const API_ROUTES = {
  SIGN_UP: `${API_URL}/api/signup`, // Change ici, supprime /auth
  SIGN_IN: `${API_URL}/api/signin`, // Change ici aussi
  BOOKS: `${API_URL}/api/books`,
  BEST_RATED: `${API_URL}/api/books/bestrating`,
};

export const APP_ROUTES = {
  SIGN_UP: '/Inscription',
  SIGN_IN: '/Connexion',
  ADD_BOOK: '/Ajouter',
  BOOK: '/livre/:id',
  UPDATE_BOOK: 'livre/modifier/:id',
};
