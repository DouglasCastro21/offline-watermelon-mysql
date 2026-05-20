import { API_URL } from './config';
import { AuthUser } from '../types/session';

type RequestOptions = RequestInit & {
  token?: string;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Erro ao comunicar com o servidor.');
  }

  return data as T;
}

export async function login(loginValue: string, senha: string) {
  return request<{ token: string; user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login: loginValue, senha })
  });
}

export async function me(token: string) {
  return request<{ user: AuthUser }>('/auth/me', {
    method: 'GET',
    token
  });
}

export async function postJson<T>(path: string, token: string, body: unknown) {
  return request<T>(path, {
    method: 'POST',
    token,
    body: JSON.stringify(body)
  });
}
