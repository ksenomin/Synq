import { slugify } from './slug'

export const normalizeJob = (apiJob) => {
  const description = apiJob.description || ''
  const clientName = apiJob.clientName || ''
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
    clientName,
    clientSlug: apiJob.clientSlug || slugify(clientName),
    clientAvatar: apiJob.clientAvatar || '',
    skills: apiJob.skills || [],
    attachments: apiJob.attachments?.map((a) => (typeof a === 'string' ? a : a.fileName)) || [],
    createdAt: apiJob.createdAt,
  }
}

export const normalizeUser = (apiUser) => ({
  id: apiUser.id,
  name: apiUser.name,
  slug: apiUser.slug || slugify(apiUser.name),
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
  joinDate: apiUser.createdAt || null,
})

const categoryImageMap = {
  'web-design': '/categories/web_design.png',
  'ui-ux': '/categories/UI_UX_design.png',
  'graphic-design': '/categories/Graphic_design.png',
  'motion': '/categories/Motion_design.png',
  'development': '/categories/Programing.png',
  '3d': '/categories/3D_design.png',
}

export const normalizeCategory = (apiCategory) => ({
  id: apiCategory.id,
  name: apiCategory.name,
  slug: apiCategory.slug,
  icon: apiCategory.icon,
  description: apiCategory.description,
  jobCount: apiCategory.jobCount || 0,
  image: apiCategory.imageUrl || categoryImageMap[apiCategory.slug] || '',
  color: apiCategory.color || 'from-gray-500 to-gray-400',
  span: 'col-span-1',
})

export const normalizeProposal = (apiProposal) => {
  const userName = apiProposal.userName || ''
  const clientName = apiProposal.clientName || ''
  return {
    id: apiProposal.id,
    jobId: apiProposal.jobId,
    jobTitle: apiProposal.jobTitle || '',
    jobStatus: apiProposal.jobStatus?.toLowerCase() || '',
    userId: apiProposal.userId,
    userSlug: apiProposal.userSlug || (userName ? slugify(userName) : ''),
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
    clientName,
    clientSlug: apiProposal.clientSlug || (clientName ? slugify(clientName) : ''),
    clientAvatar: apiProposal.clientAvatar || '',
    createdAt: apiProposal.createdAt,
  }
}

export const normalizeChat = (apiChat) => {
  const participantName = apiChat.participantName || 'Пользователь'
  return {
    id: apiChat.id,
    participantId: apiChat.participantId,
    participantName,
    participantSlug: apiChat.participantSlug || slugify(participantName),
    participantAvatar: apiChat.participantAvatar || '',
    lastMessage: apiChat.lastMessage || '',
    lastMessageAt: apiChat.lastMessageAt,
    unreadCount: apiChat.unreadCount ?? 0,
    jobId: apiChat.jobId,
    jobTitle: apiChat.jobTitle || '',
    createdAt: apiChat.createdAt,
  }
}

export const normalizeMessage = (apiMessage) => {
  const senderName = apiMessage.senderName || 'Пользователь'
  return {
    id: apiMessage.id,
    chatId: apiMessage.chatId,
    senderId: apiMessage.senderId,
    senderName,
    senderSlug: apiMessage.senderSlug || slugify(senderName),
    senderAvatar: apiMessage.senderAvatar || '',
    text: apiMessage.text || '',
    isRead: apiMessage.isRead ?? false,
    attachments: apiMessage.attachments || [],
    createdAt: apiMessage.createdAt,
  }
}

export const normalizeReview = (apiReview) => {
  const authorName = apiReview.authorName || 'Аноним'
  return {
    id: apiReview.id,
    authorId: apiReview.authorId,
    authorName,
    authorSlug: apiReview.authorSlug || slugify(authorName),
    authorAvatar: apiReview.authorAvatar || '',
    rating: apiReview.rating || 0,
    text: apiReview.text || '',
    jobId: apiReview.jobId,
    jobTitle: apiReview.jobTitle || '',
    createdAt: apiReview.createdAt,
  }
}
