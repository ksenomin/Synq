import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Clock,
  MapPin,
  Briefcase,
  MessageSquare,
  ChevronRight,
} from 'lucide-react'
import { Card, Badge, Avatar } from '../common'
import { formatBudgetRange, formatRelativeDate, getCategoryBadgeColor } from '../../utils/helpers'

/**
 * Карточка задания для списка
 * @param {Object} job - объект задания
 */
const JobCard = ({ job }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card hoverable className="p-4 sm:p-6 h-full flex flex-col">
        {/* Шапка: категория и срочность */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <Badge variant={getCategoryBadgeColor(job.category)} size="sm" className="truncate">
            {job.categoryName}
          </Badge>
          {job.urgent && (
            <Badge variant="error" size="sm">
              Срочно
            </Badge>
          )}
        </div>

        {/* Заголовок */}
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {job.title}
        </h3>

        {/* Описание */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
          {job.shortDescription}
        </p>

        {/* Навыки */}
        <div className="flex flex-wrap gap-2 mb-4">
          {job.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
              +{job.skills.length - 3}
            </span>
          )}
        </div>

        {/* Футер: бюджет, дедлайн, отклики */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-gray-100 gap-2">
          <div>
            <p className="text-xs sm:text-sm text-gray-500">Бюджет</p>
            <p className="text-base sm:text-lg font-bold text-primary-600">
              {formatBudgetRange(job.budget.min, job.budget.max)}
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {formatRelativeDate(job.deadline)}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {job.proposalsCount}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default JobCard
