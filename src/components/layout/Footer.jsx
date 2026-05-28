import { Link } from 'react-router-dom'

/**
 * Footer — подвал сайта с ссылками, соцсетями и копирайтом
 */
const Footer = () => {
  const currentYear = new Date().getFullYear()

  // Колонки ссылок
  const footerLinks = [
    {
      title: 'Платформа',
      links: [
        { label: 'Главная', href: '/' },
        { label: 'Категории', href: '/categories' },
        { label: 'Задания', href: '/jobs' },
        { label: 'Создать задание', href: '/create-job' },
      ],
    },
  ]

  return (
    <footer className="bg-gray-900 text-white">
      {/* Основной контент */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Бренд */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img
                src="/synq-logo.jpg"
                alt="SYNQ"
                className="h-10 w-auto rounded-xl object-contain"
              />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
              Платформа для digital-специалистов: дизайнеров, разработчиков,
              motion-дизайнеров. Находите проекты и таланты в одном месте.
            </p>
          </div>

          {/* Ссылки */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Нижняя строка */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {currentYear} SYNQ. Все права защищены.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
              Конфиденциальность
            </a>
            <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
              Условия
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
