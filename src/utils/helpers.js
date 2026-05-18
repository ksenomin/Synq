import { formatDistanceToNow, format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

/**
 * Форматирует дату в относительное время (например, "2 часа назад")
 */
export function formatRelativeDate(dateString) {
  return formatDistanceToNow(parseISO(dateString), {
    addSuffix: true,
    locale: ru,
  })
}

/**
 * Форматирует дату в читаемый формат (например, "15 января 2024")
 */
export function formatDate(dateString) {
  return format(parseISO(dateString), 'd MMMM yyyy', {
    locale: ru,
  })
}

/**
 * Форматирует дату в короткий формат (например, "15 янв 2024")
 */
export function formatShortDate(dateString) {
  return format(parseISO(dateString), 'd MMM yyyy', {
    locale: ru,
  })
}

/**
 * Форматирует время (например, "14:30")
 */
export function formatTime(dateString) {
  return format(parseISO(dateString), 'HH:mm')
}

/**
 * Форматирует бюджет в читаемый формат (например, "120 000 ₽")
 */
export function formatBudget(amount) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Форматирует диапазон бюджета (например, "80 000 — 150 000 ₽")
 */
export function formatBudgetRange(min, max) {
  if (min && max) {
    return `${formatBudget(min)} — ${formatBudget(max)}`
  }
  if (min) {
    return `от ${formatBudget(min)}`
  }
  if (max) {
    return `до ${formatBudget(max)}`
  }
  return 'Договорная'
}

/**
 * Сокращает текст до указанной длины с добавлением многоточия
 */
export function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Генерирует инициалы из имени (например, "Алексей Петров" → "АП")
 */
export function getInitials(name) {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Получает URL аватара или генерирует placeholder с инициалами
 */
export function getAvatarUrl(user) {
  if (user.avatar) return user.avatar
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff&size=150`
}

/**
 * Класс для получения цвета badge по категории
 */
export function getCategoryBadgeColor(category) {
  const colors = {
    'web-design': 'badge-primary',
    'ui-ux': 'bg-purple-100 text-purple-700',
    'graphic-design': 'bg-orange-100 text-orange-700',
    'motion': 'bg-green-100 text-green-700',
    'development': 'bg-indigo-100 text-indigo-700',
    '3d': 'bg-red-100 text-red-700',
  }
  return colors[category] || 'badge-primary'
}

/**
 * Получает название роли пользователя на русском
 */
export function getRoleName(role) {
  const roles = {
    designer: 'Дизайнер',
    developer: 'Разработчик',
    motion: 'Motion Designer',
    client: 'Заказчик',
    freelancer: 'Фрилансер',
  }
  return roles[role] || role
}

/**
 * Преобразует текст в URL-безопасный slug (транслитерация)
 */
export { slugify } from './slug'
