import api from './client'

export const chatsApi = {
  getMyChats: async () => {
    const { data } = await api.get('/chats')
    return data
  },

  create: async (participantId, jobId) => {
    const { data } = await api.post('/chats', { participantId, jobId })
    return data
  },

  getMessages: async (chatId, page = 1, pageSize = 50) => {
    const { data } = await api.get(`/chats/${chatId}/messages`, { params: { page, pageSize } })
    return data
  },

  sendMessage: async (chatId, text) => {
    const { data } = await api.post(`/chats/${chatId}/messages`, { text })
    return data
  },

  markAsRead: async (chatId) => {
    const { data } = await api.post(`/chats/${chatId}/read`)
    return data
  },

  leaveChat: async (chatId) => {
    const { data } = await api.post(`/chats/${chatId}/leave`)
    return data
  },
}
