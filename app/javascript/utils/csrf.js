// Get CSRF token from Rails meta tag
export function getCSRFToken() {
  const tokenElement = document.querySelector('meta[name="csrf-token"]');
  return tokenElement ? tokenElement.getAttribute('content') : '';
}

// Create headers with CSRF token for fetch requests
export function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCSRFToken()
  };
}
