import { useState, useEffect } from 'react'

/**
 * Кастомный хук для фильтрации и сортировки заданий
 * @param {Array} jobs - массив заданий
 * @param {Object} filters - объект фильтров из store
 * @returns {Array} отфильтрованный и отсортированный массив заданий
 */
export function useFilteredJobs(jobs, filters) {
  const [filteredJobs, setFilteredJobs] = useState(jobs)

  useEffect(() => {
    let result = [...jobs]

    // Фильтрация по поисковому запросу
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(searchLower) ||
          job.description.toLowerCase().includes(searchLower) ||
          job.categoryName.toLowerCase().includes(searchLower)
      )
    }

    // Фильтрация по категории
    if (filters.category) {
      result = result.filter((job) => job.category === filters.category)
    }

    // Фильтрация по бюджету
    if (filters.budgetMin) {
      result = result.filter((job) => job.budget.max >= filters.budgetMin)
    }
    if (filters.budgetMax) {
      result = result.filter((job) => job.budget.min <= filters.budgetMax)
    }

    // Сортировка
    switch (filters.sortBy) {
      case 'newest':
        result.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
        break
      case 'budget-high':
        result.sort((a, b) => b.budget.max - a.budget.max)
        break
      case 'budget-low':
        result.sort((a, b) => a.budget.min - b.budget.min)
        break
      case 'proposals':
        result.sort((a, b) => b.proposalsCount - a.proposalsCount)
        break
      default:
        break
    }

    setFilteredJobs(result)
  }, [jobs, filters])

  return filteredJobs
}

/**
 * Кастомный хук для получения откликов по jobId
 * @param {Array} proposals - массив всех откликов
 * @param {string} jobId - id задания
 * @returns {Array} отклики для конкретного задания
 */
export function useJobProposals(proposals, jobId) {
  const [jobProposals, setJobProposals] = useState([])

  useEffect(() => {
    const filtered = proposals.filter((p) => p.jobId === jobId)
    setJobProposals(filtered)
  }, [proposals, jobId])

  return jobProposals
}

/**
 * Кастомный хук для получения публикаций пользователя
 * @param {Array} posts - массив всех публикаций
 * @param {string} userId - id пользователя
 * @returns {Array} публикации пользователя
 */
export function useUserPosts(posts, userId) {
  const [userPosts, setUserPosts] = useState([])

  useEffect(() => {
    const filtered = posts.filter((p) => p.userId === userId)
    setUserPosts(filtered)
  }, [posts, userId])

  return userPosts
}

/**
 * Кастомный хук для получения отзывов пользователя
 * @param {Array} reviews - массив всех отзывов
 * @param {string} userId - id пользователя
 * @returns {Array} отзывы пользователя
 */
export function useUserReviews(reviews, userId) {
  const [userReviews, setUserReviews] = useState([])

  useEffect(() => {
    const filtered = reviews.filter((r) => r.userId === userId)
    setUserReviews(filtered)
  }, [reviews, userId])

  return userReviews
}

/**
 * Кастомный хук для получения сообщений чата
 * @param {Array} messages - массив всех сообщений
 * @param {string} chatId - id чата
 * @returns {Array} сообщения чата
 */
export function useChatMessages(messages, chatId) {
  const [chatMessages, setChatMessages] = useState([])

  useEffect(() => {
    const filtered = messages.filter((m) => m.chatId === chatId)
    setChatMessages(filtered)
  }, [messages, chatId])

  return chatMessages
}
