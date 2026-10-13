import type { LoginPayload, RegisterPayload, Token, UpdateProfilePayload, User } from '../types'
import { api, LOGIN_PATH } from './client'

export const authApi = {
  async register(payload: RegisterPayload): Promise<User> {
    const { data } = await api.post<User>('/api/auth/register', payload)
    return data
  },

  async login(payload: LoginPayload): Promise<Token> {
    const { data } = await api.post<Token>(LOGIN_PATH, payload)
    return data
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/api/auth/me')
    return data
  },

  async updateMe(payload: UpdateProfilePayload): Promise<User> {
    const { data } = await api.patch<User>('/api/auth/me', payload)
    return data
  },
}
