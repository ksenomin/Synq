import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  ChevronDown,
} from 'lucide-react'
import { Button, Input, Card, Badge } from '../components/common'
import { JobCard } from '../components/features'
import { useAppContext } from '../store'
import { jobsApi, categoriesApi } from '../api'
import { normalizeJob, normalizeCategory } from '../utils/normalize'

const JobsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const { state, openJobModal, setJobFilters, resetJobFilters } = useAppContext()
  const jobFilters = state.jobFilters

  const [jobs, setJobs] = useState([])
  const [categories, setCategories] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const [localFilters, setLocalFilters] = useState(jobFilters)
  const hasSyncedUrl = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const urlSearch = params.get('search') || ''
    const urlCategory = params.get('category') || null

    const updates = {}
    if (urlSearch !== jobFilters.search) updates.search = urlSearch
    if (urlCategory !== jobFilters.category) updates.category = urlCategory

    if (Object.keys(updates).length > 0) {
      setJobFilters(updates)
      setLocalFilters((prev) => ({ ...prev, ...updates }))
    } else {
      hasSyncedUrl.current = true
    }
  }, [location.search, jobFilters, setJobFilters, setLocalFilters])

  useEffect(() => {
    categoriesApi.getAll().then((data) => {
      setCategories(data.map((c) => normalizeCategory(c)))
    }).catch((err) => console.error('Ошибка загрузки категорий:', err))
  }, [])

  useEffect(() => {
    if (!hasSyncedUrl.current) return

    const params = {
      page: 1,
      pageSize: 50,
    }
    if (jobFilters.search) params.search = jobFilters.search
    if (jobFilters.category) params.category = jobFilters.category
    if (jobFilters.budgetMin) params.budgetMin = jobFilters.budgetMin
    if (jobFilters.budgetMax) params.budgetMax = jobFilters.budgetMax
    if (jobFilters.sortBy) params.sortBy = jobFilters.sortBy

    setLoading(true)
    jobsApi.getAll(params).then((data) => {
      setJobs(data.items.map((j) => normalizeJob(j)))
      setTotalCount(data.totalCount)
    }).catch((err) => console.error('Ошибка загрузки заданий:', err)).finally(() => setLoading(false))
  }, [jobFilters])

  const categoryPills = [
    { id: null, slug: null, label: 'Все' },
    ...categories.map((c) => ({ id: c.id, slug: c.slug, label: c.name })),
  ]

  if (loading && jobs.length === 0) {
    return (
      <div className="py-12 lg:py-20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Задания
          </h1>
          <p className="text-lg text-gray-600">
            Найдите проект по душе среди {totalCount} активных заданий
          </p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Поиск по названию, описанию или навыкам..."
                value={localFilters.search}
                onChange={(e) => setLocalFilters((prev) => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Фильтры
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categoryPills.map((pill) => (
              <button
                key={pill.slug || 'all'}
                onClick={() => {
                  const nextParams = new URLSearchParams(searchParams)
                  if (pill.slug) {
                    nextParams.set('category', pill.slug)
                  } else {
                    nextParams.delete('category')
                  }
                  setSearchParams(nextParams)
                  setLocalFilters((prev) => ({ ...prev, category: pill.slug }))
                  setJobFilters({ category: pill.slug })
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  localFilters.category === pill.slug
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Input
                    type="number"
                    label="Бюджет от (₽)"
                    placeholder="0"
                    value={localFilters.budgetMin || ''}
                    onChange={(e) =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        budgetMin: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                  />
                  <Input
                    type="number"
                    label="Бюджет до (₽)"
                    placeholder="500000"
                    value={localFilters.budgetMax || ''}
                    onChange={(e) =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        budgetMax: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Сортировка
                    </label>
                    <select
                      value={localFilters.sortBy}
                      onChange={(e) => setLocalFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                      className="input-base"
                    >
                      <option value="newest">Сначала новые</option>
                      <option value="budget">По бюджету (убыв.)</option>
                      <option value="deadline">По дедлайну</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => setJobFilters(localFilters)}
                      className="flex items-center gap-2"
                    >
                      Применить
                    </Button>
                    <Button
                      variant="ghost"
                      fullWidth
                      onClick={() => {
                        resetJobFilters()
                        setLocalFilters({
                          search: '',
                          category: null,
                          budgetMin: null,
                          budgetMax: null,
                          sortBy: 'newest',
                        })
                      }}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Сбросить
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500">
            Найдено: {jobs.length} заданий
          </p>
        </div>

        {jobs.length > 0 ? (
          <div className="masonry">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="masonry-item cursor-pointer"
                onClick={() => openJobModal(job)}
              >
                <JobCard job={job} />
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Ничего не найдено
            </h3>
            <p className="text-gray-600 mb-6">
              Попробуйте изменить параметры поиска или сбросить фильтры
            </p>
            <Button
              variant="primary"
              onClick={() => {
                resetJobFilters()
                setLocalFilters({
                  search: '',
                  category: null,
                  budgetMin: null,
                  budgetMax: null,
                  sortBy: 'newest',
                })
              }}
            >
              Сбросить фильтры
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}

export default JobsPage
