import { useCallback, useEffect, useState } from 'react';
import { UploadSimple, Images, Trash, X } from '@phosphor-icons/react';
import { api } from '../../services/api.js';
import { mediaUrl } from '../../utils/helpers.js';
import Button from '../../components/Button.jsx';
import SmartImage from '../../components/SmartImage.jsx';
import { LoadingState, ErrorState } from '../../components/StateBlocks.jsx';
import { useToast } from './Feedback.jsx';

/** Modal media library used to pick an existing image. */
function MediaLibraryModal({ open, onClose, onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const notify = useToast();

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get('/admin/media', { per_page: 120 })
      .then((data) => setItems(data.media || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const remove = async (item) => {
    try {
      await api.del(`/admin/media/${item.id}`);
      notify('Image deleted.');
      load();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy/40 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[85dvh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-lift">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-navy">Media library</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600">
            <X size={18} weight="bold" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <LoadingState variant="spinner" label="Loading media" />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">No images uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {items.map((item) => (
                <div key={item.id} className="group relative overflow-hidden rounded-lg border border-line">
                  <button type="button" onClick={() => onSelect(item.path)} className="block w-full">
                    <SmartImage src={mediaUrl(item.path)} alt={item.filename} className="aspect-square w-full object-cover" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete image"
                    onClick={() => remove(item)}
                    className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-red-600 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash size={14} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Image field with preview, upload and media-library selection.
 * Stores the relative media path (e.g. uploads/2025/06/abc.webp).
 */
export default function ImagePicker({ value, onChange, label = 'Image' }) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const notify = useToast();

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const data = await api.upload('/admin/media', file);
      onChange(data.path);
      notify('Image uploaded.');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="h-28 w-40 shrink-0 overflow-hidden rounded-lg border border-line bg-mist">
          <SmartImage src={mediaUrl(value)} alt={label} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-navy transition-colors hover:border-brand hover:text-brand">
            <UploadSimple size={15} weight="bold" />
            {uploading ? 'Uploading...' : 'Upload'}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          <Button type="button" variant="outline" size="sm" onClick={() => setLibraryOpen(true)}>
            <Images size={15} weight="bold" />
            Library
          </Button>
          {value ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      <MediaLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={(path) => {
          onChange(path);
          setLibraryOpen(false);
        }}
      />
    </div>
  );
}
