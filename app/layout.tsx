import type { Metadata } from 'next';
import { I18nProvider } from '../i18n/context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lokaler Datei-Converter',
  description: 'Bild-Konvertierung vollständig im Browser — keine Datei verlässt dein Gerät.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
