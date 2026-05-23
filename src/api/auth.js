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

  logout: async () => {
    const { data } = await api.post('/auth/logout')
    return data
  },

  me: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },
}
