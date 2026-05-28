import { Navigate } from 'react-router-dom'
import { useAppContext } from '../../store'

const ProtectedRoute = ({ children }) => {
  const { state } = useAppContext()

  if (state.isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!state.isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return children
}

export default ProtectedRoute
