// API configuration
export const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

// Utility function to construct API URLs
export const getApiUrl = (path: string) => {
  // Remove any leading slashes from the path
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // If the path already starts with 'api/', don't add it again
  const apiPath = cleanPath.startsWith('api/') ? cleanPath : `api/${cleanPath}`;

  // Construct the full URL
  return `${API_URL}/${apiPath}`;
};