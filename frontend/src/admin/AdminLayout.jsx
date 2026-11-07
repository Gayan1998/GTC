import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  SquaresFour,
  Package,
  Tag,
  FileText,
  EnvelopeSimple,
  Images,
  GearSix,
  List,
  SignOut,
  ArrowSquareOut,
  X,
} from '@phosphor-icons/react';
import { useAdminAuth } from './AdminAuthContext.jsx';
import { useSite } from '../services/SiteContext.jsx';
import { mediaUrl } from '../utils/helpers.js';

const NAV = [
  { to: '/admin', label: 'Dashboard', Icon: SquaresFour, end: true },
  { to: '/admin/products', label: 'Products', Icon: Package },
  { to: '/admin/categories', label: 'Categories', Icon: Tag },
  { to: '/admin/content', label: 'Website Content', Icon: FileText },
  { to: '/admin/inquiries', label: 'Inquiries', Icon: EnvelopeSimple },
  { to: '/admin/media', label: 'Media', Icon: Images },
  { to: '/admin/navigation', label: 'Navigation', Icon: List },
  { to: '/admin/settings', label: 'Settings', Icon: GearSix },
];

export default function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const { settings } = useSite();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
        <img src={mediaUrl(settings.logo_mark)} alt="" className="h-8 w-auto" />
        <div className="leading-tight">
          <p className="font-display text-[13px] font-bold text-white">GTC Holdings</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">Admin panel</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} weight="duotone" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowSquareOut size={18} weight="duotone" />
          View website
        </a>
        <div className="mt-1 flex items-center justify-between gap-2 rounded-lg px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white">{user?.username}</p>
            <p className="truncate text-[11px] text-white/50">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <SignOut size={16} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-mist/50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-navy lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy/40" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-64 bg-navy">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 text-white/60 hover:text-white"
            >
              <X size={18} weight="bold" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-navy"
          >
            <List size={18} weight="bold" />
          </button>
          <span className="font-display text-sm font-bold text-navy">GTC Admin</span>
          <Link to="/" className="text-[12px] font-medium text-brand">
            Website
          </Link>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
