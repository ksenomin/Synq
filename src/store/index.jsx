import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { authApi } from '../api'
import { slugify } from '../utils/slug'

const normalizeUser = (apiUser) => ({
  id: apiUser.id,
  name: apiUser.name,
  slug: slugify(apiUser.name),
  role: apiUser.role?.toLowerCase() || 'client',
  avatar: apiUser.avatarUrl || apiUser.avatar || '',
  cover: apiUser.coverUrl || apiUser.cover || '',
  bio: apiUser.bio || '',
  location: apiUser.location || '',
  verified: apiUser.isVerified || false,
  rating: apiUser.rating || 0,
  reviewsCount: apiUser.reviewsCount || 0,
  completedJobs: apiUser.completedJobs || 0,
  hourlyRate: apiUser.hourlyRate || 0,
})

const loadUserFromStorage = () => {
  try {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      return { currentUser: JSON.parse(userStr) }
    }
  } catch {
    // ignore
  }
  return { currentUser: null }
}

const userState = loadUserFromStorage()

const initialState = {
  selectedJob: null,
  isJobModalOpen: false,

  activeChat: null,

  jobFilters: {
    search: '',
    category: null,
    budgetMin: null,
    budgetMax: null,
    sortBy: 'newest',
  },

  isAuthenticated: false,
  currentUser: userState.currentUser,

  notifications: [],
}

// Типы действий
const ACTIONS = {
  OPEN_JOB_MODAL: 'OPEN_JOB_MODAL',
  CLOSE_JOB_MODAL: 'CLOSE_JOB_MODAL',
  SET_ACTIVE_CHAT: 'SET_ACTIVE_CHAT',
  SET_JOB_FILTERS: 'SET_JOB_FILTERS',
  RESET_JOB_FILTERS: 'RESET_JOB_FILTERS',
  SET_CURRENT_USER: 'SET_CURRENT_USER',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
}

// Редьюсер
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.OPEN_JOB_MODAL:
      return { ...state, selectedJob: action.payload, isJobModalOpen: true }

    case ACTIONS.CLOSE_JOB_MODAL:
      return { ...state, selectedJob: null, isJobModalOpen: false }

    case ACTIONS.SET_ACTIVE_CHAT:
      return { ...state, activeChat: action.payload }

    case ACTIONS.SET_JOB_FILTERS:
      return {
        ...state,
        jobFilters: { ...state.jobFilters, ...action.payload },
      }

    case ACTIONS.RESET_JOB_FILTERS:
      return {
        ...state,
        jobFilters: initialState.jobFilters,
      }

    case ACTIONS.SET_CURRENT_USER:
      return { ...state, currentUser: action.payload }

    case ACTIONS.LOGIN: {
      const normalizedUser = normalizeUser(action.payload)
      localStorage.setItem('user', JSON.stringify(normalizedUser))
      return {
        ...state,
        isAuthenticated: true,
        currentUser: normalizedUser,
      }
    }

    case ACTIONS.LOGOUT:
      localStorage.removeItem('user')
      return { ...state, isAuthenticated: false, currentUser: null }

    case ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      }

    case ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      }

    default:
      return state
  }
}

// Создаём контекст
const AppContext = createContext(null)

/**
 * Провайдер состояния приложения
 * Оборачивает всё приложение в main.jsx или App.jsx
 */
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    // Check active cookie session on mount
    authApi.me()
      .then((data) => {
        if (data.user) {
          dispatch({ type: ACTIONS.LOGIN, payload: data.user })
        }
      })
      .catch(() => {
        // Not authenticated, keep current state
      })
  }, [])

  // Мемоизированные действия
  const openJobModal = useCallback((job) => {
    dispatch({ type: ACTIONS.OPEN_JOB_MODAL, payload: job })
  }, [])

  const closeJobModal = useCallback(() => {
    dispatch({ type: ACTIONS.CLOSE_JOB_MODAL })
  }, [])

  const setActiveChat = useCallback((chat) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_CHAT, payload: chat })
  }, [])

  const setJobFilters = useCallback((filters) => {
    dispatch({ type: ACTIONS.SET_JOB_FILTERS, payload: filters })
  }, [])

  const resetJobFilters = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_JOB_FILTERS })
  }, [])

  const setCurrentUser = useCallback((user) => {
    dispatch({ type: ACTIONS.SET_CURRENT_USER, payload: user })
  }, [])

  const login = useCallback((user) => {
    dispatch({ type: ACTIONS.LOGIN, payload: user })
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore server errors on logout
    }
    dispatch({ type: ACTIONS.LOGOUT })
  }, [])

  const addNotification = useCallback((notification) => {
    dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: notification })
  }, [])

  const removeNotification = useCallback((id) => {
    dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: id })
  }, [])

  const value = {
    state,
    openJobModal,
    closeJobModal,
    setActiveChat,
    setJobFilters,
    resetJobFilters,
    setCurrentUser,
    login,
    logout,
    addNotification,
    removeNotification,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

/**
 * Хук для доступа к состоянию и действиям
 * Использование: const { state, openJobModal } = useAppContext()
 */
export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}
