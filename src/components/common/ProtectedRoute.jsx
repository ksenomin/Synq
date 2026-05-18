import { Navigate } from 'react-router-dom'
import { useAppContext } from '../../store'

const ProtectedRoute = ({ children }) => {
  const { state } = useAppContext()
  const token = localStorage.getItem('accessToken')

  if (!state.isAuthenticated || !token) {
    return <Navigate to="/auth" replace />
  }

  return children
}

export default ProtectedRoute
