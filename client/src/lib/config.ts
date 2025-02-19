// API configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Utility function to construct API URLs
export const getApiUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_URL}/api/${cleanPath}`;
};
