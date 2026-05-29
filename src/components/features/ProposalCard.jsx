import { motion } from 'framer-motion'
import { Star, MessageSquare, User, Check } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, Avatar, Button, Badge } from '../common'
import { formatBudget } from '../../utils/helpers'
import { useAppContext } from '../../store'
import { chatsApi, proposalsApi } from '../../api'
import { useState } from 'react'

/**
 * Карточка отклика на задание
 * @param {Object} proposal - объект отклика
 */
const proposalStatusMap = {
  pending: { label: 'На рассмотрении', variant: 'warning' },
  accepted: { label: 'Принят', variant: 'success' },
  rejected: { label: 'Отклонен', variant: 'error' },
  withdrawn: { label: 'Отозван', variant: 'gray' },
}

const ProposalCard = ({ proposal, onAccept }) => {
  const { state } = useAppContext()
  const { currentUser } = state
  const isClient = currentUser?.role === 'client'
  const navigate = useNavigate()
  const [isContacting, setIsContacting] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const statusInfo = proposalStatusMap[proposal.status] || proposalStatusMap.pending
  const isPending = proposal.status === 'pending'

  const handleContact = async () => {
    setIsContacting(true)
    try {
      const chat = await chatsApi.create(proposal.userId, proposal.jobId)
      navigate('/chat', { state: { chatId: chat.id } })
    } catch (err) {
      console.error('Ошибка создания чата:', err)
      alert('Не удалось начать чат: ' + (err.response?.data?.message || 'проверьте подключение и попробуйте снова'))
    } finally {
      setIsContacting(false)
    }
  }

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      await proposalsApi.updateStatus(proposal.id, 'Accepted')
      onAccept?.(proposal.id)
    } catch (err) {
      console.error('Ошибка принятия отклика:', err)
      alert('Не удалось принять отклик: ' + (err.response?.data?.message || 'проверьте подключение и попробуйте снова'))
    } finally {
      setIsAccepting(false)
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

        {/* Статус + кнопки действий — только для заказчиков */}
        {isClient && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {!isPending && (
              <Badge variant={statusInfo.variant} size="md">{statusInfo.label}</Badge>
            )}
            {isPending && (
              <Button
                variant="primary"
                size="sm"
                className="flex-1 min-w-[120px]"
                onClick={handleAccept}
                disabled={isAccepting}
              >
                <Check className="w-4 h-4 mr-1 sm:mr-2" />
                {isAccepting ? '...' : 'Принять'}
              </Button>
            )}
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
