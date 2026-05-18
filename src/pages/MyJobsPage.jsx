import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Briefcase, Plus, Users, Clock, DollarSign, Eye, Edit3, Trash2 } from 'lucide-react'
import { Card, Badge, Button } from '../components/common'
import { jobsApi } from '../api'
import { useAppContext } from '../store'
import { formatBudget, formatRelativeDate } from '../utils/helpers'

const MyJobsPage = () => {
  const navigate = useNavigate()
  const { state } = useAppContext()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    jobsApi.getMyJobs()
      .then((data) => {
        setJobs(data.items || [])
      })
      .catch((err) => {
        console.error('Error fetching my jobs:', err)
      })
      .finally(() => setLoading(false))
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
        console.error('Error deleting job:', err)
        alert('Ошибка при удалении задания')
      }
    }
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
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Заголовок и статус */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
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
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/job/${job.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Просмотр
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/job/${job.id}/proposals`)}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Отклики ({job.proposalsCount || 0})
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/create-job?edit=${job.id}`)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-error hover:text-error"
                        onClick={() => handleDeleteJob(job.id)}
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
                        <DollarSign className="w-5 h-5 text-primary-600" />
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
      </div>
    </div>
  )
}

export default MyJobsPage
