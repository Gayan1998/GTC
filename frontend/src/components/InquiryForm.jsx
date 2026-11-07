import { useState } from 'react';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { api } from '../services/api.js';
import Button from './Button.jsx';

const CONTACT_SUBJECTS = [
  'Product enquiry',
  'Wholesale supply',
  'Solar lighting',
  'Electrical and power products',
  'Automotive products',
  'China import services',
  'General enquiry',
];

const SHIPPING_METHODS = ['Not sure yet', 'Air cargo', 'Sea cargo', 'Either is fine'];

const EMPTY = {
  name: '',
  business_name: '',
  email: '',
  phone: '',
  subject: '',
  quantity: '',
  shipping_method: '',
  requirements: '',
  message: '',
  website: '', // honeypot
};

function Field({ label, name, error, required, children, hint }) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
        {required ? <span className="ml-0.5 text-action">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="mt-1.5 text-[12px] text-muted">{hint}</p> : null}
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}

export default function InquiryForm({ type = 'contact' }) {
  const isImport = type === 'import';
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [feedback, setFeedback] = useState('');

  const update = (key) => (event) => {
    setValues((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  function validate() {
    const next = {};
    if (!values.name.trim()) next.name = 'Please enter your name.';
    const hasEmail = values.email.trim() !== '';
    const hasPhone = values.phone.trim() !== '';
    if (!hasEmail && !hasPhone) {
      next.email = 'Please provide an email address or telephone number.';
    } else if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      next.email = 'Please enter a valid email address.';
    }
    if (isImport) {
      if (!values.requirements.trim() && !values.message.trim()) {
        next.requirements = 'Please describe what you would like to source.';
      }
    } else if (!values.message.trim()) {
      next.message = 'Please enter your message.';
    }
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      return;
    }
    setStatus('submitting');
    setFeedback('');
    try {
      const response = await api.post('/inquiries', { type, ...values });
      setStatus('success');
      setFeedback(response?.message || 'Thank you. Your inquiry has been received.');
      setValues(EMPTY);
    } catch (error) {
      setStatus('error');
      setFeedback(error.message || 'Your inquiry could not be sent. Please try again.');
      if (error.details && typeof error.details === 'object') {
        setErrors(error.details);
      }
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-8 text-center">
        <CheckCircle size={32} weight="fill" className="mx-auto text-emerald-600" />
        <h3 className="mt-3 text-lg font-semibold text-navy">Inquiry received</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{feedback}</p>
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={() => setStatus('idle')}>
            Send another inquiry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {status === 'error' && feedback ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0" />
          <span>{feedback}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" error={errors.name} required>
          <input
            id="name"
            name="name"
            className="field-input"
            value={values.name}
            onChange={update('name')}
            autoComplete="name"
          />
        </Field>

        {isImport ? (
          <Field label="Business name" name="business_name" error={errors.business_name}>
            <input
              id="business_name"
              name="business_name"
              className="field-input"
              value={values.business_name}
              onChange={update('business_name')}
              autoComplete="organization"
            />
          </Field>
        ) : (
          <Field label="Email address" name="email" error={errors.email} required>
            <input
              id="email"
              name="email"
              type="email"
              className="field-input"
              value={values.email}
              onChange={update('email')}
              autoComplete="email"
            />
          </Field>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isImport ? (
          <Field label="Email address" name="email" error={errors.email} required>
            <input
              id="email"
              name="email"
              type="email"
              className="field-input"
              value={values.email}
              onChange={update('email')}
              autoComplete="email"
            />
          </Field>
        ) : null}

        <Field label="Telephone / WhatsApp" name="phone" error={errors.phone}>
          <input
            id="phone"
            name="phone"
            className="field-input"
            value={values.phone}
            onChange={update('phone')}
            autoComplete="tel"
          />
        </Field>

        {!isImport ? (
          <Field label="Subject" name="subject" error={errors.subject}>
            <select id="subject" name="subject" className="field-input" value={values.subject} onChange={update('subject')}>
              <option value="">Select a subject</option>
              {CONTACT_SUBJECTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
      </div>

      {isImport ? (
        <>
          <Field
            label="Product or sourcing requirements"
            name="requirements"
            error={errors.requirements}
            required
            hint="Describe the products you would like to source and any specific details."
          >
            <textarea
              id="requirements"
              name="requirements"
              rows={4}
              className="field-input resize-y"
              value={values.requirements}
              onChange={update('requirements')}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Estimated quantity" name="quantity" error={errors.quantity}>
              <input
                id="quantity"
                name="quantity"
                className="field-input"
                value={values.quantity}
                onChange={update('quantity')}
                placeholder="e.g. 500 units"
              />
            </Field>
            <Field label="Preferred shipping method" name="shipping_method" error={errors.shipping_method}>
              <select
                id="shipping_method"
                name="shipping_method"
                className="field-input"
                value={values.shipping_method}
                onChange={update('shipping_method')}
              >
                <option value="">Select a method</option>
                {SHIPPING_METHODS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Additional message" name="message" error={errors.message}>
            <textarea
              id="message"
              name="message"
              rows={3}
              className="field-input resize-y"
              value={values.message}
              onChange={update('message')}
            />
          </Field>
        </>
      ) : (
        <Field label="Message" name="message" error={errors.message} required>
          <textarea
            id="message"
            name="message"
            rows={5}
            className="field-input resize-y"
            value={values.message}
            onChange={update('message')}
          />
        </Field>
      )}

      {/* Honeypot: hidden from users, catches simple bots. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={update('website')} />
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] leading-5 text-muted">
          We use your details only to respond to this inquiry.
        </p>
        <Button type="submit" size="lg" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending...' : isImport ? 'Submit import enquiry' : 'Send inquiry'}
        </Button>
      </div>
    </form>
  );
}
