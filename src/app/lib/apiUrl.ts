/**
 * Centralized API URL configuration
 * Detects environment and returns the appropriate backend URL
 */
export function getApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;

  if (envUrl) {
    return envUrl;
  }

  // For browser environment
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000/api';
    }
    return 'https://learnwork-flow.onrender.com/api';
  }

  // Server-side fallback (shouldn't happen in this app)
  return 'http://localhost:8000/api';
}
