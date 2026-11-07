// Small shared formatting/URL helpers.

const MEDIA_BASE = (import.meta.env.VITE_MEDIA_BASE || '').replace(/\/$/, '');

/** Turn a stored relative media path into a usable URL. */
export function mediaUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
  return `${MEDIA_BASE}/${String(path).replace(/^\//, '')}`;
}

/** Digits-only international WhatsApp number. */
export function whatsappNumber(settings) {
  return String(settings?.whatsapp_number || '').replace(/\D/g, '');
}

/** Build a click-to-chat WhatsApp link with an optional message. */
export function whatsappUrl(settings, message) {
  const number = whatsappNumber(settings);
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${number}${text}`;
}

/** Product-specific WhatsApp inquiry message. */
export function productWhatsAppMessage(settings, product) {
  const greeting = settings?.whatsapp_greeting || 'Hello GTC Holdings,';
  const name = product?.name || 'your products';
  return `${greeting} I would like to inquire about the ${name}. Please share the available options and pricing.`;
}

export function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPrice(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (Number.isNaN(number)) return null;
  return `Rs. ${number.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function telHref(phone) {
  return `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;
}
