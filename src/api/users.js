import api from './client'

export const usersApi = {
  getMe: async () => {
    const { data } = await api.get('/users/me')
    return data
  },

  getById: async (id) => {
    const { data } = await api.get(`/users/${id}`)
    return data
  },

  getBySlug: async (slug) => {
    const { data } = await api.get(`/users/slug/${slug}`)
    return data
  },

  update: async (id, userData) => {
    const { data } = await api.put(`/users/${id}`, userData)
    return data
  },

  uploadAvatar: async (id, file) => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post(`/users/${id}/avatar`, formData)
    return data
  },

  uploadCover: async (id, file) => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post(`/users/${id}/cover`, formData)
    return data
  },

  getFreelancers: async (page = 1, pageSize = 20) => {
    const { data } = await api.get('/users/freelancers', { params: { page, pageSize } })
    return data
  },
}
