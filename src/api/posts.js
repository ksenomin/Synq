import api from './client'

export const postsApi = {
  getByUserId: async (userId, page = 1, pageSize = 20) => {
    const { data } = await api.get(`/posts/user/${userId}`, { params: { page, pageSize } })
    return data
  },

  create: async (postData) => {
    const { data } = await api.post('/posts', postData)
    return data
  },

  update: async (id, postData) => {
    const { data } = await api.put(`/posts/${id}`, postData)
    return data
  },

  delete: async (id) => {
    await api.delete(`/posts/${id}`)
  },

  toggleLike: async (id) => {
    const { data } = await api.post(`/posts/${id}/like`)
    return data
  },
}
