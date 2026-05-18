import api from './client'

export const reviewsApi = {
  getByUserId: async (userId) => {
    const { data } = await api.get(`/reviews/user/${userId}`)
    return data
  },

  create: async (reviewData) => {
    const { data } = await api.post('/reviews', reviewData)
    return data
  },
}
