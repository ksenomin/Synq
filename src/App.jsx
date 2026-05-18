import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AppProvider } from './store'

import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import ProtectedRoute from './components/common/ProtectedRoute'

import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import CategoriesPage from './pages/CategoriesPage'
import JobsPage from './pages/JobsPage'
import ProfilePage from './pages/ProfilePage'
import ChatPage from './pages/ChatPage'
import CreateJobPage from './pages/CreateJobPage'
import JobProposalsPage from './pages/JobProposalsPage'
import MyProposalsPage from './pages/MyProposalsPage'
import MyJobsPage from './pages/MyJobsPage'

import JobModal from './components/features/JobModal'

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />

              <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
              <Route path="/jobs" element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
              <Route path="/job/:id/proposals" element={<ProtectedRoute><JobProposalsPage /></ProtectedRoute>} />
              <Route path="/profile/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/create-job" element={<ProtectedRoute><CreateJobPage /></ProtectedRoute>} />
              <Route path="/my-proposals" element={<ProtectedRoute><MyProposalsPage /></ProtectedRoute>} />
              <Route path="/my-jobs" element={<ProtectedRoute><MyJobsPage /></ProtectedRoute>} />
            </Routes>
          </AnimatePresence>
        </main>

        <Footer />

        <JobModal />
      </div>
    </AppProvider>
  )
}

export default App