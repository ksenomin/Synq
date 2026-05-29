import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, Clock, DollarSign, FileText, Eye, XCircle, CheckCircle, Star } from 'lucide-react'
import { Card, Badge, Button } from '../components/common'
import { ReviewModal } from '../components/features'
import { proposalsApi, jobsApi } from '../api'
import { useAppContext } from '../store'
import { formatBudget, formatRelativeDate } from '../utils/helpers'
import { normalizeJob } from '../utils/normalize'

const MyProposalsPage = () => {
  const navigate = useNavigate()
  const { state, openJobModal } = useAppContext()
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [withdrawingId, setWithdrawingId] = useState(null)
  const [notification, setNotification] = useState(null)
  const [selectedProposalForReview, setSelectedProposalForReview] = useState(null)

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const loadProposals = () => {
    setLoading(true)
    proposalsApi.getMyProposals()
      .then((data) => {
        setProposals(data.items || [])
      })
      .catch((err) => {
        console.error('Ошибка получения откликов:', err)
        showNotification('Ошибка загрузки откликов', 'error')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProposals()
  }, [])

  const handleWithdraw = async (proposalId) => {
    if (!confirm('Вы уверены, что хотите отозвать этот отклик?')) return
    
    setWithdrawingId(proposalId)
    try {
      await proposalsApi.withdraw(proposalId)
      showNotification('Отклик успешно отозван')
      // Обновляем список
      loadProposals()
    } catch (err) {
      console.error('Ошибка отзыва отклика:', err)
      showNotification('Ошибка при отзыве отклика', 'error')
    } finally {
      setWithdrawingId(null)
    }
  }

  const handleViewJob = async (jobId) => {
    try {
      const jobData = await jobsApi.getById(jobId)
      if (jobData) {
        openJobModal(normalizeJob(jobData))
      }
    } catch (err) {
      console.error('Ошибка загрузки задания:', err)
      showNotification('Ошибка загрузки задания', 'error')
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'На рассмотрении', variant: 'warning' },
      accepted: { label: 'Принят', variant: 'success' },
      rejected: { label: 'Отклонен', variant: 'error' },
      withdrawn: { label: 'Отозван', variant: 'gray' },
    }
    const statusInfo = statusMap[status?.toLowerCase()] || statusMap.pending
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  if (loading) {
    return (
      <div className="py-12 lg:py-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Уведомления */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                notification.type === 'success' 
                  ? 'bg-success-50 text-success-700 border border-success-200' 
                  : 'bg-error-50 text-error-700 border border-error-200'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <p className="font-medium">{notification.message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Мои отклики
          </h1>
          <p className="text-lg text-gray-600">
            Управляйте своими предложениями на задания
          </p>
        </div>

        {proposals.length === 0 ? (
          <Card className="p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              У вас пока нет откликов
            </h3>
            <p className="text-gray-600 mb-6">
              Найдите интересные задания и отправьте свое предложение
            </p>
            <Button variant="primary" onClick={() => navigate('/jobs')}>
              Найти задания
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {proposals.map((proposal) => (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4 sm:p-6">
                  {/* Заголовок и статус */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                        {proposal.jobTitle}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(proposal.status)}
                        <span className="text-sm text-gray-500">
                          Отклик отправлен {formatRelativeDate(proposal.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {proposal.status?.toLowerCase() === 'accepted' && proposal.jobStatus?.toLowerCase() === 'completed' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedProposalForReview(proposal)}
                        >
                          <Star className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Оставить отзыв</span>
                          <span className="sm:hidden">Отзыв</span>
                        </Button>
                      )}
                      {proposal.status?.toLowerCase() === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleWithdraw(proposal.id)}
                          disabled={withdrawingId === proposal.id}
                          className="text-error hover:text-error hover:bg-error-50"
                        >
                          <XCircle className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">{withdrawingId === proposal.id ? 'Отзыв...' : 'Отозвать'}</span>
                          <span className="sm:hidden">{withdrawingId === proposal.id ? '...' : 'Отозвать'}</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewJob(proposal.jobId)}
                      >
                        <Eye className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Просмотреть задание</span>
                        <span className="sm:hidden">Задание</span>
                      </Button>
                    </div>
                  </div>

                  {/* Детали отклика */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                        <DollarSign className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Ваша ставка</p>
                        <p className="font-bold text-gray-900">
                          {formatBudget(proposal.price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Срок выполнения</p>
                        <p className="font-bold text-gray-900">
                          {proposal.deadlineDays} дней
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Сопроводительное</p>
                        <p className="font-bold text-gray-900 truncate">
                          {proposal.coverLetter
                            ? proposal.coverLetter.substring(0, 50) + '...'
                            : 'Не указано'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Информация о заказчике */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0">
                      {proposal.clientAvatar ? (
                        <img
                          src={proposal.clientAvatar}
                          alt={proposal.clientName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                          {proposal.clientName?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {proposal.clientName}
                      </p>
                      <p className="text-sm text-gray-500">Заказчик</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <ReviewModal
          isOpen={!!selectedProposalForReview}
          onClose={() => setSelectedProposalForReview(null)}
          title="Оставить отзыв заказчику"
          targetName={selectedProposalForReview?.clientName}
          jobTitle={selectedProposalForReview?.jobTitle}
          userId={selectedProposalForReview?.clientId}
          jobId={selectedProposalForReview?.jobId}
          onSuccess={loadProposals}
        />
      </div>
    </div>
  )
}

export default MyProposalsPage
