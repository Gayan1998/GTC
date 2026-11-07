import { WhatsappLogo } from '@phosphor-icons/react';
import { useSite } from '../services/SiteContext.jsx';
import { whatsappUrl } from '../utils/helpers.js';
import Button from './Button.jsx';

/**
 * Click-to-chat WhatsApp link. The destination number comes from site settings
 * so it is never hardcoded per component.
 */
export default function WhatsAppButton({
  message,
  label = 'WhatsApp inquiry',
  iconOnly = false,
  variant = 'whatsapp',
  size = 'md',
  className = '',
}) {
  const { settings } = useSite();
  const href = whatsappUrl(settings, message);

  if (!settings?.whatsapp_number || !href) {
    return null;
  }

  return (
    <Button
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variant={variant}
      size={size}
      className={className}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
    >
      <WhatsappLogo size={iconOnly ? 18 : 16} weight="fill" />
      {iconOnly ? null : <span>{label}</span>}
    </Button>
  );
}
