const BASE = '/api';

function tokenKey(role) {
  return role === 'admin' ? 'admin_token' : 'student_token';
}

export function getToken(role) {
  return localStorage.getItem(tokenKey(role));
}

export function setToken(role, token) {
  localStorage.setItem(tokenKey(role), token);
}

export function clearToken(role) {
  localStorage.removeItem(tokenKey(role));
}

async function request(role, path, options = {}) {
  const token = getToken(role);
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || '요청에 실패했어요.');
  }
  return data;
}

export const adminApi = {
  login: (password) => request('admin', '/admin/login', { method: 'POST', body: JSON.stringify({ password }) }),
  listStudents: () => request('admin', '/admin/students'),
  createStudent: (payload) => request('admin', '/admin/students', { method: 'POST', body: JSON.stringify(payload) }),
  deleteStudent: (id) => request('admin', `/admin/students/${id}`, { method: 'DELETE' }),
  resetPassword: (id, password) =>
    request('admin', `/admin/students/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) }),
  getStudentStory: (id) => request('admin', `/admin/students/${id}/story`),
};

export const studentApi = {
  login: (username, password) =>
    request('student', '/student/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getStory: () => request('student', '/student/story'),
  saveStory: (payload) => request('student', '/student/story', { method: 'PUT', body: JSON.stringify(payload) }),
};
