import { motion } from 'framer-motion'
import { Star, MessageSquare, User, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, Avatar, Button, Badge } from '../common'
import { formatBudget } from '../../utils/helpers'
import { useAppContext } from '../../store'

/**
 * Карточка отклика на задание
 * @param {Object} proposal - объект отклика
 */
const ProposalCard = ({ proposal }) => {
  const { state } = useAppContext()
  const { currentUser } = state
  const isClient = currentUser?.role === 'client'
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-6">
        {/* Шапка: аватар + имя + рейтинг */}
        <div className="flex items-start gap-4 mb-4">
          <Link to={`/profile/${proposal.userSlug}`}>
            <Avatar
              src={proposal.userAvatar}
              name={proposal.userName}
              size="lg"
            />
          </Link>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <Link
                to={`/profile/${proposal.userSlug}`}
                className="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors"
              >
                {proposal.userName}
              </Link>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-semibold">{proposal.rating}</span>
                <span className="text-gray-500 text-sm">
                  ({proposal.reviewsCount})
                </span>
              </div>
            </div>

            {/* Навыки */}
            <div className="flex flex-wrap gap-2 mt-2">
              {proposal.skills.map((skill) => (
                <Badge key={skill} variant="gray" size="sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Сопроводительное письмо */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            {proposal.coverLetter}
          </p>
        </div>

        {/* Цена и срок */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Цена</p>
            <p className="text-xl font-bold text-primary-600">
              {formatBudget(proposal.price)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Срок</p>
            <p className="text-lg font-semibold text-gray-900">
              {proposal.deadline}
            </p>
          </div>
        </div>

        {/* Кнопки действий — только для заказчиков */}
        {isClient && (
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" className="flex-1">
              <Check className="w-4 h-4 mr-2" />
              Принять
            </Button>
            <Button variant="secondary" size="sm" className="flex-1">
              <MessageSquare className="w-4 h-4 mr-2" />
              Связаться
            </Button>
            <Link to={`/profile/${proposal.userSlug}`}>
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}
        {!isClient && (
          <Link to={`/profile/${proposal.userSlug}`}>
            <Button variant="ghost" size="sm" className="w-full">
              <User className="w-4 h-4 mr-2" />
              Просмотреть профиль
            </Button>
          </Link>
        )}
      </Card>
    </motion.div>
  )
}

export default ProposalCard
