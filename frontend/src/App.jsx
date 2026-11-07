import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { SiteProvider } from './services/SiteContext.jsx';
import PublicLayout from './layouts/PublicLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import SolarLightingPage from './pages/SolarLightingPage.jsx';
import ChinaImportPage from './pages/ChinaImportPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// The admin panel is only downloaded when a user opens /admin.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

function AdminFallback() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center text-sm text-muted">Loading admin panel...</div>
  );
}

export default function App() {
  return (
    <SiteProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/categories/:slug" element={<CategoryPage />} />
          <Route path="/solar-lighting" element={<SolarLightingPage />} />
          <Route path="/china-import" element={<ChinaImportPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<AdminFallback />}>
              <AdminApp />
            </Suspense>
          }
        />
      </Routes>
    </SiteProvider>
  );
}
