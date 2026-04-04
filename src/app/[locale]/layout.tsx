'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import StoreProvider from '@/store/provider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [messages, setMessages] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    import(`../../../messages/${locale}.json`)
      .then((mod) => setMessages(mod.default))
      .catch(() => import(`../../../messages/en.json`).then((mod) => setMessages(mod.default)));
  }, [locale]);

  if (!messages) return null;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <StoreProvider>
          <div className="min-h-screen flex flex-col bg-background text-foreground">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster position="top-right" />
        </StoreProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
