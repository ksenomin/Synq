import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Clock,
  MapPin,
  Briefcase,
  MessageSquare,
  Paperclip,
  Star,
  ArrowRight,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Badge, Avatar } from '../common'
import { useAppContext } from '../../store'
import { formatBudgetRange, formatDate, getCategoryBadgeColor } from '../../utils/helpers'
import { proposalsApi } from '../../api'
import { normalizeProposal } from '../../utils/normalize'

const JobModal = () => {
  const { state, closeJobModal } = useAppContext()
  const { selectedJob, isJobModalOpen, currentUser } = state

  const [jobProposals, setJobProposals] = useState([])
  const [userProposal, setUserProposal] = useState(null)
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [proposalPrice, setProposalPrice] = useState('')
  const [proposalDays, setProposalDays] = useState('')
  const [proposalLetter, setProposalLetter] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (selectedJob?.id && isJobModalOpen) {
      proposalsApi.getByJobId(selectedJob.id).then((data) => {
        const proposals = (data || []).map((p) => normalizeProposal(p))
        setJobProposals(proposals)
        
        // Проверяем, есть ли отклик от текущего пользователя
        const currentUserProposal = proposals.find(p => p.userId === currentUser?.id)
        setUserProposal(currentUserProposal || null)
      }).catch(() => {
        setJobProposals([])
        setUserProposal(null)
      })
    }
  }, [selectedJob?.id, isJobModalOpen, currentUser?.id])

  // Сбрасываем форму при открытии нового модала
  useEffect(() => {
    if (isJobModalOpen) {
      setShowProposalForm(false)
      setProposalPrice('')
      setProposalDays('')
      setProposalLetter('')
      setIsSubmitting(false)
      setUserProposal(null)
    }
  }, [isJobModalOpen, selectedJob?.id])

  const handleSubmitProposal = async () => {
    if (!proposalPrice || !proposalDays) return
    
    setIsSubmitting(true)
    try {
      const newProposal = await proposalsApi.create(selectedJob.id, {
        price: parseFloat(proposalPrice),
        deadlineDays: parseInt(proposalDays),
        coverLetter: proposalLetter
      })
      
      alert('Отклик успешно отправлен!')
      setShowProposalForm(false)
      
      // Обновляем список откликов и отмечаем, что пользователь откликнулся
      const data = await proposalsApi.getByJobId(selectedJob.id)
      const proposals = (data || []).map((p) => normalizeProposal(p))
      setJobProposals(proposals)
      
      const currentUserProposal = proposals.find(p => p.userId === currentUser?.id)
      setUserProposal(currentUserProposal || null)
    } catch (err) {
      console.error('Error submitting proposal:', err)
      alert('Ошибка при отправке отклика: ' + (err.response?.data?.message || err.message))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!selectedJob) return null

  return (
    <AnimatePresence>
      {isJobModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeJobModal}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
                <Badge
                  variant={getCategoryBadgeColor(selectedJob.category)}
                  size="md"
                >
                  {selectedJob.categoryName}
                </Badge>
                <button
                  onClick={closeJobModal}
                  className="p-2 hover:bg-gray-800 rounded-xl transition-colors"
                  aria-label="Закрыть"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  {selectedJob.title}
                </h2>

                <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-400">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Дедлайн: {formatDate(selectedJob.deadline)}
                  </span>
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    {selectedJob.proposalsCount} откликов
                  </span>
                  {selectedJob.urgent && (
                    <Badge variant="error" size="sm">
                      Срочно
                    </Badge>
                  )}
                </div>

                <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-400 mb-1">Бюджет</p>
                  <p className="text-2xl font-bold text-white">
                    {formatBudgetRange(selectedJob.budget.min, selectedJob.budget.max)}
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Описание проекта
                  </h3>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {selectedJob.description}
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Требуемые навыки
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm rounded-lg border border-gray-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedJob.attachments && selectedJob.attachments.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Вложения
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {selectedJob.attachments.map((file) => (
                        <div
                          key={file}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-xl border border-gray-700"
                        >
                          <Paperclip className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-300">{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {jobProposals.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">
                        Отклики ({jobProposals.length})
                      </h3>
                      <Link
                        to={`/job/${selectedJob.id}/proposals`}
                        className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
                      >
                        Все отклики
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>

                    <div className="space-y-3">
                      {jobProposals.slice(0, 2).map((proposal) => (
                        <div
                          key={proposal.id}
                          className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50"
                        >
                          <Avatar
                            src={proposal.userAvatar}
                            name={proposal.userName}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-white">
                                {proposal.userName}
                              </p>
                              <div className="flex items-center gap-1 text-yellow-400">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-sm">{proposal.rating}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-400 line-clamp-2">
                              {proposal.coverLetter}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Форма отклика */}
              <AnimatePresence>
                {showProposalForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-700/50 overflow-hidden"
                  >
                    <div className="p-6 bg-gray-800/30">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Ваше предложение
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">
                            Ваша цена (₽)
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="number"
                              value={proposalPrice}
                              onChange={(e) => setProposalPrice(e.target.value)}
                              placeholder="10000"
                              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">
                            Срок выполнения (дней)
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="number"
                              value={proposalDays}
                              onChange={(e) => setProposalDays(e.target.value)}
                              placeholder="7"
                              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">
                          Сопроводительное письмо
                        </label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <textarea
                            value={proposalLetter}
                            onChange={(e) => setProposalLetter(e.target.value)}
                            placeholder="Опишите, почему вы подходите для этого задания..."
                            rows={3}
                            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => setShowProposalForm(false)}
                          disabled={isSubmitting}
                        >
                          Отмена
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleSubmitProposal}
                          disabled={!proposalPrice || !proposalDays || isSubmitting}
                          className="flex-1"
                        >
                          {isSubmitting ? 'Отправка...' : 'Отправить отклик'}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-6 border-t border-gray-700/50 flex items-center gap-3">
                {!showProposalForm && (
                  <>
                    {userProposal && userProposal.status !== 'withdrawn' ? (
                      <div className="flex-1 flex items-center justify-between bg-success-500/10 border border-success-500/20 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-success-400" />
                          <span className="text-success-300 font-medium">
                            Вы уже откликнулись на это задание
                          </span>
                        </div>
                        <span className="text-sm text-success-400">
                          Статус: {userProposal.status === 'pending' ? 'На рассмотрении' : userProposal.status}
                        </span>
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="primary"
                          fullWidth
                          onClick={() => setShowProposalForm(true)}
                        >
                          Откликнуться
                        </Button>
                        <Button
                          variant="secondary"
                          className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Связаться
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default JobModal
