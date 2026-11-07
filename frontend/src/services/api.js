// Centralised API client. Handles JSON parsing, error shapes, CSRF tokens and
// multipart uploads. The base path is same-origin by default and can be
// overridden with VITE_API_BASE for a sub-directory deployment.

const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

let csrfToken = null;

export function setCsrfToken(token) {
  csrfToken = token || null;
}

export function getCsrfToken() {
  return csrfToken;
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details || null;
  }
}

async function handle(response) {
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }
  if (!response.ok) {
    const message = payload?.error?.message || `Request failed (${response.status})`;
    throw new ApiError(message, response.status, payload?.error?.details);
  }
  return payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
}

function buildQuery(params) {
  if (!params) return '';
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    usp.append(key, value);
  });
  const query = usp.toString();
  return query ? `?${query}` : '';
}

async function request(path, { method = 'GET', body, signal, form } = {}) {
  const headers = {};
  const options = { method, credentials: 'same-origin', signal, headers };
  if (form) {
    options.body = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  if (csrfToken && method !== 'GET') {
    headers['X-CSRF-Token'] = csrfToken;
  }
  const response = await fetch(`${API_BASE}${path}`, options);
  return handle(response);
}

export const api = {
  get: (path, params) => request(`${path}${buildQuery(params)}`),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  upload: (path, file) => {
    const form = new FormData();
    form.append('file', file);
    return request(path, { method: 'POST', body: form, form: true });
  },
};

export { API_BASE };
