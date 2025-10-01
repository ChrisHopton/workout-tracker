const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

function resolveEndpoint(endpoint) {
  if (!endpoint.startsWith('/')) {
    return `${API_BASE}/${endpoint}`;
  }
  return `${API_BASE}${endpoint}`;
}

export async function apiRequest(endpoint, options = {}) {
  const config = { method: options.method || 'GET', headers: options.headers || {} };
  if (options.body !== undefined) {
    config.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(resolveEndpoint(endpoint), config);
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.error?.message || `Request failed with status ${response.status}`;
    const details = payload?.error?.details;
    const error = new Error(message);
    error.details = details;
    error.status = response.status;
    throw error;
  }

  return payload?.data ?? payload;
}

export { API_BASE };
