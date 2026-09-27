import React from 'react';
import { translations } from '../i18n.js';

export default function Footer({ lang }) {
  const t = translations[lang] || translations.en;

  return (
    <footer className="footer">
      <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
          🌿 {t.appName} — {t.home.heroTitle}
        </div>
        <div style={{ maxWidth: 660, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          {t.footer.disclaimer}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
          {t.footer.privacy}
        </div>
      </div>
    </footer>
  );
}
