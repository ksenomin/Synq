import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Users, Filter, X } from 'lucide-react'
import { Button, Card, Badge, Input } from '../components/common'
import { ProposalCard } from '../components/features'
import { jobsApi, proposalsApi } from '../api'
import { normalizeJob, normalizeProposal } from '../utils/normalize'
import { jobs, proposals as mockProposals } from '../data'

const JobProposalsPage = () => {
  const { id } = useParams()

  const [job, setJob] = useState(null)
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filterPriceMin, setFilterPriceMin] = useState('')
  const [filterPriceMax, setFilterPriceMax] = useState('')
  const [filterRating, setFilterRating] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [appliedPriceMin, setAppliedPriceMin] = useState('')
  const [appliedPriceMax, setAppliedPriceMax] = useState('')
  const [appliedRating, setAppliedRating] = useState('')
  const [appliedSortBy, setAppliedSortBy] = useState('newest')
  const debounceRef = useRef(null)

  // Загрузка данных
  useEffect(() => {
    setLoading(true)
    Promise.all([
      jobsApi.getById(id),
      proposalsApi.getByJobId(id),
    ])
      .then(([jobData, proposalsData]) => {
        setJob(normalizeJob(jobData))
        setProposals((proposalsData || []).map((p) => normalizeProposal(p)))
      })
      .catch((err) => {
        console.error('Ошибка загрузки откликов на задание:', err)
        // Fallback to mock data
        const mockJob = jobs.find((j) => j.id === id)
        if (mockJob) {
          setJob(mockJob)
        }
        const mockList = mockProposals.filter((p) => p.jobId === id)
        setProposals(mockList.map((p) => normalizeProposal(p)))
      })
      .finally(() => setLoading(false))
  }, [id])

  // Debounce для фильтров
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setAppliedPriceMin(filterPriceMin)
      setAppliedPriceMax(filterPriceMax)
      setAppliedRating(filterRating)
      setAppliedSortBy(sortBy)
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [filterPriceMin, filterPriceMax, filterRating, sortBy])

  const handleResetFilters = () => {
    setFilterPriceMin('')
    setFilterPriceMax('')
    setFilterRating('')
    setSortBy('newest')
    setAppliedPriceMin('')
    setAppliedPriceMax('')
    setAppliedRating('')
    setAppliedSortBy('newest')
  }

  const filteredProposals = useMemo(
    () =>
      proposals
        .filter((p) => {
          if (appliedPriceMin && p.price < Number(appliedPriceMin)) return false
          if (appliedPriceMax && p.price > Number(appliedPriceMax)) return false
          if (appliedRating && p.rating < Number(appliedRating)) return false
          return true
        })
        .sort((a, b) => {
          if (appliedSortBy === 'price-asc') return a.price - b.price
          if (appliedSortBy === 'price-desc') return b.price - a.price
          if (appliedSortBy === 'rating') return b.rating - a.rating
          return new Date(b.createdAt) - new Date(a.createdAt)
        }),
    [proposals, appliedPriceMin, appliedPriceMax, appliedRating, appliedSortBy]
  )

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Задание не найдено
        </h2>
        <Link to="/jobs">
          <Button variant="primary">Вернуться к заданиям</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="py-12 lg:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-8">
          <Link to="/jobs" className="shrink-0">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              Отклики на задание
            </h1>
            <p className="text-base sm:text-lg text-gray-600 truncate">{job.title}</p>
          </div>
        </div>

        <Card className="p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                <span className="text-lg font-bold text-gray-900">
                  {filteredProposals.length}
                </span>
                <span className="text-gray-500">откликов</span>
              </div>
              <Badge variant="primary" size="md">
                {job.categoryName}
              </Badge>
              {job.urgent && <Badge variant="error" size="md">Срочно</Badge>}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4 mr-2" />
              Фильтр
            </Button>
          </div>
        </Card>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="p-4 sm:p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Фильтры</h3>
                  <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Input
                    type="number"
                    label="Цена от (₽)"
                    placeholder="0"
                    value={filterPriceMin}
                    onChange={(e) => setFilterPriceMin(e.target.value)}
                  />
                  <Input
                    type="number"
                    label="Цена до (₽)"
                    placeholder="500000"
                    value={filterPriceMax}
                    onChange={(e) => setFilterPriceMax(e.target.value)}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Мин. рейтинг
                    </label>
                    <select
                      value={filterRating}
                      onChange={(e) => setFilterRating(e.target.value)}
                      className="input-base"
                    >
                      <option value="">Любой</option>
                      <option value="4">4+</option>
                      <option value="4.5">4.5+</option>
                      <option value="4.8">4.8+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Сортировка
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="input-base"
                    >
                      <option value="newest">Сначала новые</option>
                      <option value="price-asc">Цена (возр.)</option>
                      <option value="price-desc">Цена (убыв.)</option>
                      <option value="rating">По рейтингу</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                    <X className="w-3 h-3 mr-1" />
                    Сбросить
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredProposals.length > 0 ? (
          <div className="space-y-4">
            {filteredProposals.map((proposal, index) => (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProposalCard proposal={proposal} />
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Пока нет откликов
            </h3>
            <p className="text-gray-600">
              Отклики появятся здесь, когда специалисты откликнутся на ваше задание
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

export default JobProposalsPage
