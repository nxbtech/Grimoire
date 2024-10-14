// src/services/api.js
import axios from 'axios';

// Définir l'URL de base de l'API
const API_URL = 'http://localhost:3000/api'; // URL de base de ton back-end

// Fonction pour l'inscription (SignUp)
export const signUpUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/signup`, userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Fonction pour la connexion (SignIn)
export const signInUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/signin`, credentials);
    return response.data; // Retourne le token et l'ID utilisateur
  } catch (error) {
    throw error.response.data;
  }
};

// Fonction pour obtenir le profil de l'utilisateur (requête protégée)
export const getProfile = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`, // On envoie le token dans le header
      },
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};