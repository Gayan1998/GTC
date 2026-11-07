import { Routes, Route } from 'react-router-dom';
import { AdminAuthProvider } from './AdminAuthContext.jsx';
import { ToastProvider, ConfirmProvider } from './components/Feedback.jsx';
import RequireAdmin from './RequireAdmin.jsx';
import AdminLayout from './AdminLayout.jsx';
import AdminLogin from './AdminLogin.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import AdminProducts from './AdminProducts.jsx';
import AdminProductForm from './AdminProductForm.jsx';
import AdminCategories from './AdminCategories.jsx';
import AdminContent from './AdminContent.jsx';
import AdminInquiries from './AdminInquiries.jsx';
import AdminMedia from './AdminMedia.jsx';
import AdminSettings from './AdminSettings.jsx';
import AdminNavigation from './AdminNavigation.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Routes>
            <Route path="login" element={<AdminLogin />} />
            <Route element={<RequireAdmin />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/new" element={<AdminProductForm />} />
                <Route path="products/:id" element={<AdminProductForm />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="inquiries" element={<AdminInquiries />} />
                <Route path="media" element={<AdminMedia />} />
                <Route path="navigation" element={<AdminNavigation />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Routes>
        </ConfirmProvider>
      </ToastProvider>
    </AdminAuthProvider>
  );
}
