import { motion } from 'framer-motion'
import { Star, MessageSquare, User, Check } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, Avatar, Button, Badge } from '../common'
import { formatBudget } from '../../utils/helpers'
import { useAppContext } from '../../store'
import { chatsApi } from '../../api'
import { useState } from 'react'

/**
 * Карточка отклика на задание
 * @param {Object} proposal - объект отклика
 */
const ProposalCard = ({ proposal }) => {
  const { state } = useAppContext()
  const { currentUser } = state
  const isClient = currentUser?.role === 'client'
  const navigate = useNavigate()
  const [isContacting, setIsContacting] = useState(false)

  const handleContact = async () => {
    setIsContacting(true)
    try {
      const chat = await chatsApi.create(proposal.userId, proposal.jobId)
      navigate('/chat', { state: { chatId: chat.id } })
    } catch (err) {
      console.error('Error creating chat:', err)
      alert('Не удалось начать чат: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsContacting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-4 sm:p-6">
        {/* Шапка: аватар + имя + рейтинг */}
        <div className="flex items-start gap-3 sm:gap-4 mb-4">
          <Link to={`/profile/${proposal.userSlug}`} className="shrink-0">
            <Avatar
              src={proposal.userAvatar}
              name={proposal.userName}
              size="lg"
            />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <Link
                to={`/profile/${proposal.userSlug}`}
                className="text-base sm:text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors truncate"
              >
                {proposal.userName}
              </Link>
              <div className="flex items-center gap-1 text-yellow-500 shrink-0">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span className="font-semibold text-sm sm:text-base">{proposal.rating}</span>
                <span className="text-gray-500 text-xs sm:text-sm">
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
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button variant="primary" size="sm" className="flex-1 min-w-[120px]">
              <Check className="w-4 h-4 mr-1 sm:mr-2" />
              Принять
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 min-w-[120px]"
              onClick={handleContact}
              disabled={isContacting}
            >
              <MessageSquare className="w-4 h-4 mr-1 sm:mr-2" />
              {isContacting ? '...' : 'Связаться'}
            </Button>
            <Link to={`/profile/${proposal.userSlug}`} className="shrink-0">
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
