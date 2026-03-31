// Exemple de configuration (dans votre fichier api.ts ou config)
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // ou votre méthode de stockage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
