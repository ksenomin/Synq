import { Navigate } from 'react-router-dom'
import { useAppContext } from '../../store'

const ProtectedRoute = ({ children }) => {
  const { state } = useAppContext()

  if (!state.isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return children
}

export default ProtectedRoute
