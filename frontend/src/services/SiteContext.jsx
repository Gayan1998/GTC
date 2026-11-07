import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api.js';

const SiteContext = createContext(null);

const FALLBACK_SETTINGS = {
  company_name: 'GTC Holdings Int (Pvt) Ltd',
  company_short_name: 'GTC Holdings',
  company_tagline: 'Importers, Wholesalers, Retailers & China Sourcing',
  phone_mobile: '',
  phone_office: '',
  email: '',
  address: '',
  whatsapp_number: '',
  whatsapp_greeting: 'Hello GTC Holdings,',
  contact_strip_message: '',
  logo: null,
  logo_mark: null,
  favicon: null,
  footer_description: '',
  footer_copyright: 'GTC Holdings Int (Pvt) Ltd. All rights reserved.',
  social_facebook: '',
  social_instagram: '',
  social_linkedin: '',
  social_youtube: '',
  seo_default_title: 'GTC Holdings Int (Pvt) Ltd',
  seo_default_description: '',
  og_image: null,
};

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK_SETTINGS);
  const [navigation, setNavigation] = useState({ header: [], footer_quick: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/site-settings');
      setSettings({ ...FALLBACK_SETTINGS, ...data });
      setNavigation(data.navigation || { header: [], footer_quick: [] });
    } catch (err) {
      setError(err.message || 'Unable to load site settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(
    () => ({ settings, navigation, loading, error, reload: load }),
    [settings, navigation, loading, error, load]
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
}
