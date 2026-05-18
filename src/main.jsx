import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Точка входа приложения
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BrowserRouter оборачивает всё приложение для работы роутинга */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
