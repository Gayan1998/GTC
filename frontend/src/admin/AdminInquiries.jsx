import { useEffect, useState } from 'react';
import { EnvelopeSimple, Phone, Buildings, Trash, PaperPlaneTilt } from '@phosphor-icons/react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { formatDateTime } from '../utils/helpers.js';
import { useToast, useConfirm } from './components/Feedback.jsx';
import Button from '../components/Button.jsx';
import Pagination from '../components/Pagination.jsx';
import { LoadingState, ErrorState, EmptyState } from '../components/StateBlocks.jsx';

const STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

const STATUS_STYLES = {
  new: 'bg-blue-50 text-blue-700',
  contacted: 'bg-amber-50 text-amber-700',
  in_progress: 'bg-purple-50 text-purple-700',
  completed: 'bg-emerald-50 text-emerald-700',
};

export default function AdminInquiries() {
  const notify = useToast();
  const confirm = useConfirm();
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState('');

  const { data, loading, error, reload } = useFetch(
    () => api.get('/admin/inquiries', { status, type, page, per_page: 20 }),
    [status, type, page]
  );
  const { data: detail, reload: reloadDetail } = useFetch(
    () => (selectedId ? api.get(`/admin/inquiries/${selectedId}`) : Promise.resolve(null)),
    [selectedId]
  );

  useEffect(() => {
    setNote('');
  }, [selectedId]);

  const inquiries = data?.inquiries || [];
  const meta = data?.meta || {};

  const updateStatus = async (nextStatus) => {
    try {
      await api.put(`/admin/inquiries/${selectedId}`, { status: nextStatus });
      notify('Status updated.');
      reload();
      reloadDetail();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    try {
      await api.post(`/admin/inquiries/${selectedId}/notes`, { note });
      setNote('');
      reloadDetail();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const remove = async (inquiry) => {
    const ok = await confirm({
      title: 'Delete inquiry',
      message: `Delete the inquiry from ${inquiry.name}? This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.del(`/admin/inquiries/${inquiry.id}`);
      notify('Inquiry deleted.');
      if (selectedId === inquiry.id) setSelectedId(null);
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy">Inquiries</h1>
        <p className="mt-1 text-[13.5px] text-muted">Messages submitted through the website contact and import forms.</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <select className="field-input sm:max-w-[170px]" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select className="field-input sm:max-w-[170px]" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} aria-label="Filter by type">
          <option value="">All types</option>
          <option value="contact">Contact</option>
          <option value="import">Import</option>
        </select>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-xl border border-line bg-white shadow-card">
          {loading ? (
            <LoadingState variant="spinner" label="Loading inquiries" />
          ) : error ? (
            <div className="p-4">
              <ErrorState message={error.message} onRetry={reload} />
            </div>
          ) : inquiries.length === 0 ? (
            <div className="p-4">
              <EmptyState title="No inquiries" message="Submitted inquiries will appear here." />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {inquiries.map((inquiry) => (
                <li key={inquiry.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(inquiry.id)}
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors ${
                      selectedId === inquiry.id ? 'bg-mist' : 'hover:bg-mist/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13.5px] font-medium text-navy">{inquiry.name}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[inquiry.status] || 'bg-slate-100 text-slate-600'}`}>
                        {STATUSES.find((item) => item.value === inquiry.status)?.label || inquiry.status}
                      </span>
                    </div>
                    <span className="truncate text-[12.5px] text-muted">{inquiry.subject || inquiry.email || inquiry.phone || 'No subject'}</span>
                    <span className="text-[11.5px] text-slate-400">
                      {inquiry.type === 'import' ? 'Import enquiry' : 'Contact'} &middot; {formatDateTime(inquiry.created_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-line bg-white p-5 shadow-card sm:p-6">
          {!selectedId || !detail ? (
            <p className="py-16 text-center text-sm text-muted">Select an inquiry to view its details.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[16px] font-semibold text-navy">{detail.name}</h2>
                  <p className="text-[12px] text-muted">
                    {detail.type === 'import' ? 'Import enquiry' : 'Contact enquiry'} &middot; {formatDateTime(detail.created_at)}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="text-red-600" onClick={() => remove(detail)}>
                  <Trash size={14} />
                  Delete
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {STATUSES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => updateStatus(item.value)}
                    className={`rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors ${
                      detail.status === item.value ? 'border-action bg-action text-white' : 'border-line bg-white text-ink hover:border-brand hover:text-brand'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-2 rounded-lg border border-line bg-mist/40 p-4 text-[13.5px]">
                {detail.email ? (
                  <p className="flex items-center gap-2">
                    <EnvelopeSimple size={15} className="text-brand" />
                    <a href={`mailto:${detail.email}`} className="text-navy hover:text-brand">{detail.email}</a>
                  </p>
                ) : null}
                {detail.phone ? (
                  <p className="flex items-center gap-2">
                    <Phone size={15} className="text-brand" />
                    <a href={`tel:${detail.phone}`} className="text-navy hover:text-brand">{detail.phone}</a>
                  </p>
                ) : null}
                {detail.business_name ? (
                  <p className="flex items-center gap-2">
                    <Buildings size={15} className="text-brand" />
                    <span className="text-navy">{detail.business_name}</span>
                  </p>
                ) : null}
              </div>

              {detail.subject ? (
                <div className="mt-4">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Subject</p>
                  <p className="mt-1 text-[13.5px] text-ink">{detail.subject}</p>
                </div>
              ) : null}

              {detail.requirements ? (
                <div className="mt-4">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Requirements</p>
                  <p className="mt-1 whitespace-pre-line text-[13.5px] leading-6 text-ink">{detail.requirements}</p>
                </div>
              ) : null}

              {detail.quantity || detail.shipping_method ? (
                <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-ink">
                  {detail.quantity ? <span><strong>Quantity:</strong> {detail.quantity}</span> : null}
                  {detail.shipping_method ? <span><strong>Shipping:</strong> {detail.shipping_method}</span> : null}
                </div>
              ) : null}

              {detail.message ? (
                <div className="mt-4">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Message</p>
                  <p className="mt-1 whitespace-pre-line text-[13.5px] leading-6 text-ink">{detail.message}</p>
                </div>
              ) : null}

              <div className="mt-6 border-t border-line pt-5">
                <h3 className="text-[13.5px] font-semibold text-navy">Internal notes</h3>
                <div className="mt-3 space-y-2">
                  {(detail.notes || []).length === 0 ? (
                    <p className="text-[12.5px] text-muted">No notes yet.</p>
                  ) : (
                    (detail.notes || []).map((item) => (
                      <div key={item.id} className="rounded-lg border border-line bg-mist/40 px-3.5 py-2.5">
                        <p className="text-[13px] text-ink">{item.note}</p>
                        <p className="mt-1 text-[11px] text-muted">{formatDateTime(item.created_at)}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    className="field-input"
                    placeholder="Add a note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addNote();
                      }
                    }}
                  />
                  <Button size="sm" onClick={addNote} type="button">
                    <PaperPlaneTilt size={14} weight="fill" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Pagination page={meta.page || page} lastPage={meta.last_page || 1} onChange={setPage} />
    </div>
  );
}
