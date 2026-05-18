import api from './client'

export const categoriesApi = {
  getAll: async () => {
    const { data } = await api.get('/categories')
    return data
  },

  getBySlug: async (slug) => {
    const { data } = await api.get(`/categories/${slug}`)
    return data
  },
}
