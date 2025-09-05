
import type { Metadata } from 'next';
// Removed Inter font import
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Moedas Narciso - Cooperativa do Bem',
  description:
    'Conheça o Moedas Narciso, um projeto da EMEF Narciso Mariante de Campos que une reciclagem, educação financeira e solidariedade com alunos do pré ao 5º ano.',
  metadataBase: new URL('https://moedasnarciso.com.br'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Moedas Narciso - Cooperativa do Bem',
    description:
      'Conheça o Moedas Narciso, um projeto da EMEF Narciso Mariante de Campos que une reciclagem, educação financeira e solidariedade com alunos do pré ao 5º ano.',
    url: 'https://moedasnarciso.com.br',
    siteName: 'Moedas Narciso',
    type: 'website',
    images: [
      {
        url: '/images/retangulo.png',
        alt: 'Imagem retangular Moedas Narciso',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Moedas Narciso - Cooperativa do Bem',
    description:
      'Conheça o Moedas Narciso, um projeto da EMEF Narciso Mariante de Campos que une reciclagem, educação financeira e solidariedade com alunos do pré ao 5º ano.',
  images: ['/images/retangulo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* JSON-LD básico para organização/site */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Moedas Narciso',
              url: 'https://moedasnarciso.com.br',
              description:
                'Conheça o Moedas Narciso, um projeto da EMEF Narciso Mariante de Campos que une reciclagem, educação financeira e solidariedade com alunos do pré ao 5º ano.',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://moedasnarciso.com.br/?s={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
