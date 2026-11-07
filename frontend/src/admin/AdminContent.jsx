import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash, FloppyDisk, Eye, EyeSlash } from '@phosphor-icons/react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useToast, useConfirm } from './components/Feedback.jsx';
import ImagePicker from './components/ImagePicker.jsx';
import Button from '../components/Button.jsx';
import { LoadingState, ErrorState } from '../components/StateBlocks.jsx';

const PAGE_LABELS = {
  home: 'Homepage',
  about: 'About Us',
  'solar-lighting': 'Solar Lighting',
  'china-import': 'China Import',
  contact: 'Contact',
  products: 'Products',
};

const SECTION_GROUPS = {
  home: [
    ['home.hero', 'Hero'],
    ['home.hero.cta2', 'Hero - second button'],
    ['home.intro', 'Company introduction'],
    ['home.categories', 'Product categories heading'],
    ['home.featured', 'Featured products heading'],
    ['home.solar', 'Solar lighting section'],
    ['home.why', 'Why choose us heading'],
    ['home.why.1', 'Why - item 1'],
    ['home.why.2', 'Why - item 2'],
    ['home.why.3', 'Why - item 3'],
    ['home.why.4', 'Why - item 4'],
    ['home.why.5', 'Why - item 5'],
    ['home.why.6', 'Why - item 6'],
    ['home.import', 'China import section'],
    ['home.wholesale', 'Retail and wholesale'],
    ['home.cta', 'Final call to action'],
  ],
  'solar-lighting': [
    ['solar.hero', 'Hero'],
    ['solar.intro', 'Introduction'],
    ['solar.benefits', 'Benefits heading'],
    ['solar.benefit.1', 'Benefit 1'],
    ['solar.benefit.2', 'Benefit 2'],
    ['solar.benefit.3', 'Benefit 3'],
    ['solar.benefit.4', 'Benefit 4'],
    ['solar.benefit.5', 'Benefit 5'],
    ['solar.applications', 'Applications heading'],
    ['solar.application.1', 'Application 1'],
    ['solar.application.2', 'Application 2'],
    ['solar.application.3', 'Application 3'],
    ['solar.application.4', 'Application 4'],
    ['solar.application.5', 'Application 5'],
    ['solar.application.6', 'Application 6'],
    ['solar.application.7', 'Application 7'],
    ['solar.cta', 'Final call to action'],
  ],
  'china-import': [
    ['import.hero', 'Hero'],
    ['import.intro', 'Introduction'],
    ['import.services', 'Services heading'],
    ['import.service.1', 'Service 1'],
    ['import.service.2', 'Service 2'],
    ['import.service.3', 'Service 3'],
    ['import.service.4', 'Service 4'],
    ['import.service.5', 'Service 5'],
    ['import.service.6', 'Service 6'],
    ['import.service.7', 'Service 7'],
    ['import.service.8', 'Service 8'],
    ['import.service.9', 'Service 9'],
    ['import.locations', 'Sourcing locations'],
    ['import.process', 'Process heading'],
    ['import.step.1', 'Process step 1'],
    ['import.step.2', 'Process step 2'],
    ['import.step.3', 'Process step 3'],
    ['import.step.4', 'Process step 4'],
    ['import.cta', 'Final call to action'],
  ],
  products: [
    ['products.hero', 'Hero'],
    ['products.empty', 'Empty results message'],
  ],
};

function labelFor(section) {
  const map = SECTION_GROUPS[section.page_slug] || [];
  const found = map.find(([key]) => key === section.section_key);
  if (found) return found[1];
  return section.section_key.replace(/[._]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminContent() {
  const notify = useToast();
  const confirm = useConfirm();
  const { data: pages } = useFetch(() => api.get('/admin/pages'), []);
  const [pageSlug, setPageSlug] = useState('home');
  const [pageDraft, setPageDraft] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState('');

  const { data: sections, loading, error, reload } = useFetch(
    () => api.get('/admin/sections', { page: pageSlug }),
    [pageSlug]
  );

  const page = useMemo(() => (pages || []).find((item) => item.slug === pageSlug), [pages, pageSlug]);

  useEffect(() => {
    setPageDraft(page ? { ...page } : null);
  }, [page]);

  useEffect(() => {
    setSelectedId(null);
    setDraft(null);
  }, [pageSlug]);

  const selectSection = (section) => {
    setSelectedId(section.id);
    setDraft({ ...section });
  };

  const saveSection = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await api.put(`/admin/sections/${draft.id}`, draft);
      notify('Section saved.');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const addSection = async () => {
    const key = newKey.trim();
    if (!key) {
      notify('Enter a section key.', 'error');
      return;
    }
    try {
      await api.post('/admin/sections', { page_slug: pageSlug, section_key: key, is_visible: 1 });
      notify('Section added.');
      setNewKey('');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const removeSection = async (section) => {
    const ok = await confirm({
      title: 'Delete section',
      message: `Delete "${labelFor(section)}"? This removes the content block from the website.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.del(`/admin/sections/${section.id}`);
      notify('Section deleted.');
      if (selectedId === section.id) {
        setSelectedId(null);
        setDraft(null);
      }
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const savePage = async () => {
    if (!pageDraft) return;
    try {
      await api.put(`/admin/pages/${pageDraft.id}`, pageDraft);
      notify('Page settings saved.');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const list = sections || [];

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy">Website Content</h1>
        <p className="mt-1 text-[13.5px] text-muted">
          Edit the text and images shown on each public page. Layout stays fixed; only content changes.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(pages || []).map((item) => (
          <button
            key={item.slug}
            type="button"
            onClick={() => setPageSlug(item.slug)}
            className={`rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors ${
              pageSlug === item.slug ? 'border-action bg-action text-white' : 'border-line bg-white text-ink hover:border-brand hover:text-brand'
            }`}
          >
            {PAGE_LABELS[item.slug] || item.title}
          </button>
        ))}
      </div>

      {pageDraft ? (
        <div className="mt-6 rounded-xl border border-line bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-navy">Page settings</h2>
            <Button size="sm" variant="outline" onClick={savePage}>
              Save page settings
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div>
              <label htmlFor="page-title" className="field-label">
                Page title
              </label>
              <input
                id="page-title"
                className="field-input"
                value={pageDraft.title || ''}
                onChange={(event) => setPageDraft({ ...pageDraft, title: event.target.value })}
              />
            </div>
            <div>
              <label htmlFor="page-seo-title" className="field-label">
                SEO title
              </label>
              <input
                id="page-seo-title"
                className="field-input"
                value={pageDraft.seo_title || ''}
                onChange={(event) => setPageDraft({ ...pageDraft, seo_title: event.target.value })}
              />
            </div>
            <div>
              <label htmlFor="page-seo-desc" className="field-label">
                SEO description
              </label>
              <input
                id="page-seo-desc"
                className="field-input"
                value={pageDraft.seo_description || ''}
                onChange={(event) => setPageDraft({ ...pageDraft, seo_description: event.target.value })}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.3fr]">
        <div className="rounded-xl border border-line bg-white shadow-card">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-[14px] font-semibold text-navy">Content blocks</h2>
          </div>
          {loading ? (
            <LoadingState variant="spinner" label="Loading content" />
          ) : error ? (
            <div className="p-4">
              <ErrorState message={error.message} onRetry={reload} />
            </div>
          ) : (
            <ul className="max-h-[520px] divide-y divide-line overflow-y-auto">
              {list.map((section) => (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => selectSection(section)}
                    className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors ${
                      selectedId === section.id ? 'bg-mist' : 'hover:bg-mist/60'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-medium text-navy">{labelFor(section)}</span>
                      <span className="block truncate text-[11.5px] text-muted">{section.section_key}</span>
                    </span>
                    {section.is_visible ? (
                      <Eye size={15} className="shrink-0 text-emerald-600" />
                    ) : (
                      <EyeSlash size={15} className="shrink-0 text-slate-400" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-line p-4">
            <label htmlFor="new-section" className="field-label">
              Add a new content block
            </label>
            <div className="flex gap-2">
              <input
                id="new-section"
                className="field-input"
                placeholder={`e.g. ${pageSlug}.custom.1`}
                value={newKey}
                onChange={(event) => setNewKey(event.target.value)}
              />
              <Button size="sm" onClick={addSection} type="button">
                <Plus size={14} weight="bold" />
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-white p-5 shadow-card sm:p-6">
          {!draft ? (
            <p className="py-16 text-center text-sm text-muted">Select a content block to edit it.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold text-navy">{labelFor(draft)}</h2>
                  <p className="text-[11.5px] text-muted">{draft.section_key}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" type="button" onClick={() => removeSection(draft)} className="text-red-600">
                    <Trash size={14} />
                    Delete
                  </Button>
                  <Button size="sm" type="button" onClick={saveSection} disabled={saving}>
                    <FloppyDisk size={14} />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="s-heading" className="field-label">
                    Heading
                  </label>
                  <input id="s-heading" className="field-input" value={draft.heading || ''} onChange={(event) => setDraft({ ...draft, heading: event.target.value })} />
                </div>
                <div>
                  <label htmlFor="s-subheading" className="field-label">
                    Subheading / short text
                  </label>
                  <textarea id="s-subheading" rows={2} className="field-input resize-y" value={draft.subheading || ''} onChange={(event) => setDraft({ ...draft, subheading: event.target.value })} />
                </div>
                <div>
                  <label htmlFor="s-body" className="field-label">
                    Body text
                  </label>
                  <textarea id="s-body" rows={5} className="field-input resize-y" value={draft.body || ''} onChange={(event) => setDraft({ ...draft, body: event.target.value })} />
                  <p className="mt-1.5 text-[12px] text-muted">Leave a blank line between paragraphs.</p>
                </div>
                <ImagePicker label="Image" value={draft.image || ''} onChange={(value) => setDraft({ ...draft, image: value })} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="s-cta-label" className="field-label">
                      Button label
                    </label>
                    <input id="s-cta-label" className="field-input" value={draft.cta_label || ''} onChange={(event) => setDraft({ ...draft, cta_label: event.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="s-cta-url" className="field-label">
                      Button link
                    </label>
                    <input id="s-cta-url" className="field-input" value={draft.cta_url || ''} onChange={(event) => setDraft({ ...draft, cta_url: event.target.value })} placeholder="/contact" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="s-order" className="field-label">
                      Display order
                    </label>
                    <input id="s-order" type="number" className="field-input" value={draft.display_order ?? 0} onChange={(event) => setDraft({ ...draft, display_order: event.target.value })} />
                  </div>
                  <label className="mt-6 flex items-center gap-3 text-[13.5px] text-ink">
                    <input type="checkbox" className="h-4 w-4 rounded border-line text-action" checked={!!draft.is_visible} onChange={(event) => setDraft({ ...draft, is_visible: event.target.checked ? 1 : 0 })} />
                    Visible on the website
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
