import { http } from '@/utils/request'
import type { AuthResult, LoginPayload, RegisterPayload, User } from '@/types'

export function login(payload: LoginPayload): Promise<AuthResult> {
  return http.post<AuthResult>('/auth/login', payload)
}

export function register(payload: RegisterPayload): Promise<AuthResult> {
  return http.post<AuthResult>('/auth/register', payload)
}

export function fetchProfile(): Promise<User> {
  return http.get<User>('/auth/me')
}

export function logout(): Promise<{ ok: boolean }> {
  return http.post<{ ok: boolean }>('/auth/logout')
}
