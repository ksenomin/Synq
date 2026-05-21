import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Layout,
  Palette,
  PenTool,
  Film,
  Code,
  Box,
  ArrowRight,
} from 'lucide-react'
import { Card, Badge } from '../components/common'
import { categoriesApi } from '../api'
import { normalizeCategory } from '../utils/normalize'

const iconMap = {
  Layout,
  Palette,
  PenTool,
  Image: PenTool,
  Film,
  Code,
  Box,
}

const CategoriesPage = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    categoriesApi.getAll().then((data) => {
      const normalized = data.map((c) => normalizeCategory(c))
      normalized[0].span = 'md:col-span-2'
      normalized[3].span = 'md:col-span-2'
      setCategories(normalized)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

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
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            Категории услуг
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Выберите нужную категорию и найдите специалиста для вашего проекта
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category, index) => {
            const Icon = iconMap[category.icon] || Box
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={category.span}
              >
                <Link to={`/jobs?category=${category.slug}`}>
                  <Card hoverable className="overflow-hidden group h-full">
                    <div
                      className={`h-40 bg-gradient-to-r ${category.color} relative flex items-center justify-center`}
                    >
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                      <Icon className="w-16 h-16 text-white/80 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                    </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-900">
                          {category.name}
                        </h3>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        {category.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="primary" size="sm">
                          {category.jobCount} заданий
                        </Badge>
                        <span className="text-sm text-primary-600 font-medium group-hover:underline">
                          Смотреть
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-20 text-center">
          <p className="text-6xl lg:text-8xl font-black text-gray-100 select-none">
            SYNQ
          </p>
          <p className="text-lg text-gray-500 mt-4">
            Платформа для digital-специалистов
          </p>
        </div>
      </div>
    </div>
  )
}

export default CategoriesPage
