import { Link } from 'react-router-dom';
import { Package, Tag, EnvelopeSimple, Plus, FileText, ArrowRight } from '@phosphor-icons/react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { formatDateTime } from '../utils/helpers.js';
import { LoadingState, ErrorState } from '../components/StateBlocks.jsx';

const STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  in_progress: 'In progress',
  completed: 'Completed',
};

export default function AdminDashboard() {
  const { data, loading, error, reload } = useFetch(() => api.get('/admin/dashboard'), []);

  const stats = [
    { label: 'Published products', value: data?.published_products ?? 0, Icon: Package, to: '/admin/products' },
    { label: 'Categories', value: data?.categories ?? 0, Icon: Tag, to: '/admin/categories' },
    { label: 'New inquiries', value: data?.new_inquiries ?? 0, Icon: EnvelopeSimple, to: '/admin/inquiries' },
    { label: 'Total inquiries', value: data?.total_inquiries ?? 0, Icon: FileText, to: '/admin/inquiries' },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">Dashboard</h1>
          <p className="mt-1 text-[13.5px] text-muted">A summary of your website content and inquiries.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-lg bg-action px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand"
          >
            <Plus size={15} weight="bold" />
            Add product
          </Link>
          <Link
            to="/admin/content"
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-navy transition-colors hover:border-brand hover:text-brand"
          >
            <FileText size={15} weight="bold" />
            Edit content
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mt-6">
          <ErrorState message={error.message} onRetry={reload} />
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map(({ label, value, Icon, to }) => (
              <Link
                key={label}
                to={to}
                className="rounded-xl border border-line bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-mist text-brand">
                  <Icon size={20} weight="duotone" />
                </span>
                <p className="mt-3 font-display text-2xl font-semibold text-navy">
                  {loading ? '-' : value}
                </p>
                <p className="text-[12.5px] text-muted">{label}</p>
              </Link>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-line bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-[15px] font-semibold text-navy">Recent inquiries</h2>
              <Link to="/admin/inquiries" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:text-navy">
                View all <ArrowRight size={13} weight="bold" />
              </Link>
            </div>

            {loading ? (
              <LoadingState variant="spinner" label="Loading inquiries" />
            ) : (data?.recent_inquiries || []).length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">No inquiries have been received yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {(data?.recent_inquiries || []).map((inquiry) => (
                  <li key={inquiry.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium text-navy">
                        {inquiry.name}
                        <span className="ml-2 rounded-full bg-mist px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                          {inquiry.type === 'import' ? 'Import' : 'Contact'}
                        </span>
                      </p>
                      <p className="truncate text-[12.5px] text-muted">
                        {inquiry.subject || inquiry.email || inquiry.phone || 'No subject'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-muted">
                      <span>{formatDateTime(inquiry.created_at)}</span>
                      <span className="rounded-full border border-line px-2.5 py-0.5 font-medium text-navy">
                        {STATUS_LABELS[inquiry.status] || inquiry.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
