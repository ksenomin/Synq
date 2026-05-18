import { slugify } from './slug'

export const normalizeJob = (apiJob) => ({
  id: apiJob.id,
  title: apiJob.title,
  description: apiJob.description,
  shortDescription: apiJob.description.substring(0, 120) + '...',
  category: apiJob.categorySlug,
  categoryName: apiJob.categoryName,
  budget: {
    min: apiJob.budgetMin,
    max: apiJob.budgetMax,
    type: apiJob.budgetType?.toLowerCase() || 'fixed',
  },
  deadline: apiJob.deadline ? new Date(apiJob.deadline).toISOString().split('T')[0] : null,
  urgent: apiJob.isUrgent,
  proposalsCount: apiJob.proposalsCount,
  status: apiJob.status?.toLowerCase() || 'open',
  clientId: apiJob.clientId,
  clientName: apiJob.clientName,
  clientAvatar: apiJob.clientAvatar || '',
  skills: apiJob.skills || [],
  attachments: apiJob.attachments?.map((a) => a.fileName) || [],
  createdAt: apiJob.createdAt,
})

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

export const normalizeProposal = (apiProposal) => ({
  id: apiProposal.id,
  jobId: apiProposal.jobId,
  userId: apiProposal.userId,
  userSlug: slugify(apiProposal.userName),
  userName: apiProposal.userName,
  userAvatar: apiProposal.userAvatar || '',
  rating: 0,
  reviewsCount: 0,
  skills: apiProposal.skills || [],
  price: apiProposal.price,
  deadline: `${apiProposal.deadlineDays} дней`,
  coverLetter: apiProposal.coverLetter,
  portfolioItems: 0,
  status: apiProposal.status?.toLowerCase() || 'pending',
  createdAt: apiProposal.createdAt,
})
