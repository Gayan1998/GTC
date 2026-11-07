import { useState } from 'react';
import { UploadSimple, Trash, Copy } from '@phosphor-icons/react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { mediaUrl } from '../utils/helpers.js';
import { useToast, useConfirm } from './components/Feedback.jsx';
import Button from '../components/Button.jsx';
import SmartImage from '../components/SmartImage.jsx';
import Pagination from '../components/Pagination.jsx';
import { LoadingState, ErrorState, EmptyState } from '../components/StateBlocks.jsx';

function formatBytes(bytes) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function AdminMedia() {
  const notify = useToast();
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);

  const { data, loading, error, reload } = useFetch(
    () => api.get('/admin/media', { page, per_page: 40 }),
    [page]
  );

  const items = data?.media || [];
  const meta = data?.meta || {};

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        // Sequential uploads keep error reporting simple.
        // eslint-disable-next-line no-await-in-loop
        await api.upload('/admin/media', file);
      }
      notify(`${files.length} image${files.length > 1 ? 's' : ''} uploaded.`);
      reload();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const remove = async (item) => {
    const ok = await confirm({
      title: 'Delete image',
      message: 'Delete this image? Images still used on the website cannot be deleted.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.del(`/admin/media/${item.id}`);
      notify('Image deleted.');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const copyPath = async (item) => {
    try {
      await navigator.clipboard.writeText(item.path);
      notify('Path copied to clipboard.');
    } catch {
      notify('Could not copy the path.', 'error');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">Media</h1>
          <p className="mt-1 text-[13.5px] text-muted">Upload and manage the images used across the website.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-action px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand">
          <UploadSimple size={15} weight="bold" />
          {uploading ? 'Uploading...' : 'Upload images'}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      <div className="mt-6">
        {loading ? (
          <LoadingState variant="spinner" label="Loading media" />
        ) : error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : items.length === 0 ? (
          <EmptyState title="No media yet" message="Upload images to use them on products and website content." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <div key={item.id} className="group overflow-hidden rounded-xl border border-line bg-white shadow-card">
                <div className="aspect-square overflow-hidden bg-mist">
                  <SmartImage src={mediaUrl(item.path)} alt={item.filename} className="h-full w-full object-cover" />
                </div>
                <div className="p-3">
                  <p className="truncate text-[12px] font-medium text-navy" title={item.filename}>
                    {item.filename}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {item.width && item.height ? `${item.width}x${item.height} · ` : ''}
                    {formatBytes(item.size_bytes)}
                  </p>
                  <div className="mt-2 flex gap-1">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => copyPath(item)}>
                      <Copy size={13} />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => remove(item)}>
                      <Trash size={13} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Pagination page={meta.page || page} lastPage={meta.last_page || 1} onChange={setPage} />
    </div>
  );
}
