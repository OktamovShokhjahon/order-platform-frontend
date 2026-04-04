'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { FiSun, FiMoon } from 'react-icons/fi';

const LOCALES = [
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
  { code: 'uz', label: 'UZ' },
] as const;

type LocaleThemeControlsProps = {
  className?: string;
  /** Compact padding for tight toolbars */
  compact?: boolean;
  onLocaleChange?: () => void;
};

export default function LocaleThemeControls({
  className = '',
  compact = false,
  onLocaleChange,
}: LocaleThemeControlsProps) {
  const t = useTranslations('common');
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';
  const { theme, setTheme } = useTheme();

  const switchLocale = (newLocale: string) => {
    const path = pathname?.replace(`/${locale}`, `/${newLocale}`) || `/${newLocale}`;
    router.push(path);
    onLocaleChange?.();
  };

  const pad = compact ? 'px-1.5 py-0.5' : 'px-2 py-1';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex items-center gap-0.5 sm:gap-1 bg-input rounded-lg p-1"
        role="group"
        aria-label={t('language')}
      >
        {LOCALES.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => switchLocale(l.code)}
            className={`${pad} text-xs font-medium rounded-md transition-colors ${
              locale === l.code
                ? 'bg-primary text-white'
                : 'hover:bg-card-hover text-muted'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="p-2 rounded-lg hover:bg-input transition-colors shrink-0 text-foreground"
        aria-label={t('toggle_theme')}
      >
        {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
      </button>
    </div>
  );
}
