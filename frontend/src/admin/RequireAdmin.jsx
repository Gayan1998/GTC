import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthContext.jsx';
import { LoadingState } from '../components/StateBlocks.jsx';

export default function RequireAdmin() {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <LoadingState variant="spinner" label="Checking your session" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}
