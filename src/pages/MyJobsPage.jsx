import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Briefcase, Plus, Users, Clock, Eye, Edit3, Trash2, CheckCircle } from 'lucide-react'
import { Card, Badge, Button } from '../components/common'
import { CloseJobReviewModal } from '../components/features'
import { jobsApi } from '../api'
import { useAppContext } from '../store'
import { formatBudget, formatRelativeDate } from '../utils/helpers'
import { normalizeJob } from '../utils/normalize'

const MyJobsPage = () => {
  const navigate = useNavigate()
  const { state, openJobModal } = useAppContext()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJobForClose, setSelectedJobForClose] = useState(null)

  const fetchJobs = () => {
    setLoading(true)
    jobsApi.getMyJobs()
      .then((data) => {
        setJobs(data.items || [])
      })
      .catch((err) => {
        console.error('Ошибка получения моих заданий:', err)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const getStatusBadge = (status) => {
    const statusMap = {
      open: { label: 'Открыто', variant: 'success' },
      inprogress: { label: 'В работе', variant: 'warning' },
      completed: { label: 'Завершено', variant: 'gray' },
      cancelled: { label: 'Отменено', variant: 'error' },
    }
    const statusInfo = statusMap[status?.toLowerCase()] || statusMap.open
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Вы уверены, что хотите удалить это задание?')) {
      try {
        await jobsApi.delete(jobId)
        setJobs(jobs.filter((job) => job.id !== jobId))
      } catch (err) {
        console.error('Ошибка удаления задания:', err)
        alert('Ошибка при удалении задания')
      }
    }
  }

  const handleCloseSuccess = () => {
    fetchJobs()
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
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Мои задания
            </h1>
            <p className="text-lg text-gray-600">
              Управляйте своими заданиями и откликами на них
            </p>
          </div>
          <Button variant="primary" onClick={() => navigate('/create-job')}>
            <Plus className="w-5 h-5 mr-2" />
            Создать задание
          </Button>
        </div>

        {jobs.length === 0 ? (
          <Card className="p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              У вас пока нет заданий
            </h3>
            <p className="text-gray-600 mb-6">
              Создайте свое первое задание и найдите исполнителя
            </p>
            <Button variant="primary" onClick={() => navigate('/create-job')}>
              <Plus className="w-5 h-5 mr-2" />
              Создать задание
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border-2 border-primary-200 shadow-sm overflow-hidden hover:border-primary-400 hover:shadow-md transition-all"
              >
                <div className="p-4 sm:p-6">
                  {/* Заголовок и статус */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(job.status)}
                        {job.isUrgent && (
                          <Badge variant="error">Срочно</Badge>
                        )}
                        <span className="text-sm text-gray-500">
                          Создано {formatRelativeDate(job.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {job.status?.toLowerCase() === 'inprogress' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedJobForClose(job)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Завершить</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openJobModal(normalizeJob(job))}
                      >
                        <Eye className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Просмотр</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/job/${job.id}/proposals`)}
                      >
                        <Users className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Отклики</span>
                        <span className="sm:hidden">({job.proposalsCount || 0})</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/create-job?edit=${job.id}`)}
                        aria-label="Редактировать"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-error hover:text-error"
                        onClick={() => handleDeleteJob(job.id)}
                        aria-label="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Описание */}
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {job.description}
                  </p>

                  {/* Детали задания */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg font-bold text-primary-600">₽</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Бюджет</p>
                        <p className="font-bold text-gray-900">
                          {formatBudget(job.budgetMin)} - {formatBudget(job.budgetMax)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Дедлайн</p>
                        <p className="font-bold text-gray-900">
                          {job.deadline
                            ? new Date(job.deadline).toLocaleDateString('ru-RU')
                            : 'Не указан'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Откликов</p>
                        <p className="font-bold text-gray-900">
                          {job.proposalsCount || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <CloseJobReviewModal
          isOpen={!!selectedJobForClose}
          onClose={() => setSelectedJobForClose(null)}
          job={selectedJobForClose}
          onSuccess={handleCloseSuccess}
        />
      </div>
    </div>
  )
}

export default MyJobsPage
