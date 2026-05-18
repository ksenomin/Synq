import api from './client'

export const proposalsApi = {
  getByJobId: async (jobId) => {
    const { data } = await api.get(`/proposals/job/${jobId}`)
    return data
  },

  create: async (jobId, proposalData) => {
    const { data } = await api.post(`/proposals/job/${jobId}`, proposalData)
    return data
  },

  updateStatus: async (id, status) => {
    const { data } = await api.patch(`/proposals/${id}/status`, { status })
    return data
  },

  withdraw: async (id) => {
    const { data } = await api.post(`/proposals/${id}/withdraw`)
    return data
  },

  getMyProposals: async () => {
    const { data } = await api.get('/proposals/my')
    return data
  },
}
