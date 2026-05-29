import { slugify } from './slug'

export const normalizeJob = (apiJob) => {
  const description = apiJob.description || ''
  return {
    id: apiJob.id,
    title: apiJob.title || '',
    description,
    shortDescription: description.substring(0, 120) + '...',
    category: apiJob.categorySlug || apiJob.category || '',
    categoryName: apiJob.categoryName || '',
    budget: {
      min: apiJob.budgetMin ?? apiJob.budget?.min ?? 0,
      max: apiJob.budgetMax ?? apiJob.budget?.max ?? 0,
      type: apiJob.budgetType?.toLowerCase() || 'fixed',
    },
    deadline: apiJob.deadline ? new Date(apiJob.deadline).toISOString().split('T')[0] : null,
    urgent: apiJob.isUrgent ?? apiJob.urgent ?? false,
    proposalsCount: apiJob.proposalsCount ?? 0,
    status: apiJob.status?.toLowerCase() || 'open',
    clientId: apiJob.clientId,
    clientName: apiJob.clientName || '',
    clientAvatar: apiJob.clientAvatar || '',
    skills: apiJob.skills || [],
    attachments: apiJob.attachments?.map((a) => (typeof a === 'string' ? a : a.fileName)) || [],
    createdAt: apiJob.createdAt,
  }
}

export const normalizeUser = (apiUser) => ({
  id: apiUser.id,
  name: apiUser.name,
  slug: slugify(apiUser.name),
  role: apiUser.role?.toLowerCase() || 'freelancer',
  avatar: apiUser.avatarUrl || apiUser.avatar || '',
  cover: apiUser.coverUrl || apiUser.cover || null,
  bio: apiUser.bio || '',
  location: apiUser.location || '',
  verified: apiUser.isVerified || false,
  rating: apiUser.rating || 0,
  reviewsCount: apiUser.reviewsCount || 0,
  completedJobs: apiUser.completedJobs || 0,
  hourlyRate: apiUser.hourlyRate || 0,
  portfolioUrl: apiUser.portfolioUrl || '',
  yearsOfExperience: apiUser.yearsOfExperience || 0,
  joinDate: apiUser.createdAt,
})

export const normalizeCategory = (apiCategory) => ({
  id: apiCategory.id,
  name: apiCategory.name,
  slug: apiCategory.slug,
  icon: apiCategory.icon,
  description: apiCategory.description,
  jobCount: apiCategory.jobCount || 0,
  image: apiCategory.imageUrl || '',
  color: apiCategory.color || 'from-gray-500 to-gray-400',
  span: 'col-span-1',
})

export const normalizeProposal = (apiProposal) => {
  const userName = apiProposal.userName || ''
  return {
    id: apiProposal.id,
    jobId: apiProposal.jobId,
    jobTitle: apiProposal.jobTitle || '',
    jobStatus: apiProposal.jobStatus?.toLowerCase() || '',
    userId: apiProposal.userId,
    userSlug: userName ? slugify(userName) : '',
    userName,
    userAvatar: apiProposal.userAvatar || '',
    rating: apiProposal.rating ?? 0,
    reviewsCount: apiProposal.reviewsCount ?? 0,
    skills: apiProposal.skills || [],
    price: apiProposal.price ?? 0,
    deadline:
      apiProposal.deadlineDays !== undefined
        ? `${apiProposal.deadlineDays} дней`
        : apiProposal.deadline || '',
    coverLetter: apiProposal.coverLetter || '',
    portfolioItems: apiProposal.portfolioItems ?? 0,
    status: apiProposal.status?.toLowerCase() || 'pending',
    clientId: apiProposal.clientId,
    clientName: apiProposal.clientName || '',
    clientAvatar: apiProposal.clientAvatar || '',
    createdAt: apiProposal.createdAt,
  }
}
