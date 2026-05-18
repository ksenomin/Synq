import api from './client'

export const authApi = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },

  register: async (name, email, password, role) => {
    const { data } = await api.post('/auth/register', {
      name,
      email,
      password,
      role,
    })
    return data
  },

  verifyEmail: async (token) => {
    const { data } = await api.post('/auth/verify-email', null, {
      params: { token },
    })
    return data
  },

  resendVerification: async (email) => {
    const { data } = await api.post('/auth/resend-verification', { email })
    return data
  },

  refresh: async (refreshToken) => {
    const { data } = await api.post('/auth/refresh', { refreshToken })
    return data
  },

  logout: async (refreshToken) => {
    const { data } = await api.post('/auth/logout', { refreshToken })
    return data
  },
}
