import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/';

const api = axios.create({
  baseURL: BASE,
  // Do not force a Content-Type here so multipart/form-data requests
  // (FormData) can set their own boundary header automatically.
  timeout: 120000, // Increased to 120 seconds for file uploads to Cloudinary
});

export default api;
