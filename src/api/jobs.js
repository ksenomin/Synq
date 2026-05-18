import api from './client'

export const jobsApi = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/jobs', { params })
    return data
  },

  getById: async (id) => {
    const { data } = await api.get(`/jobs/${id}`)
    return data
  },

  create: async (jobData) => {
    const { data } = await api.post('/jobs', jobData)
    return data
  },

  update: async (id, jobData) => {
    const { data } = await api.put(`/jobs/${id}`, jobData)
    return data
  },

  delete: async (id) => {
    await api.delete(`/jobs/${id}`)
  },

  updateStatus: async (id, status) => {
    const { data } = await api.patch(`/jobs/${id}/status`, { status })
    return data
  },

  getMyJobs: async () => {
    const { data } = await api.get('/jobs/my')
    return data
  },
}
