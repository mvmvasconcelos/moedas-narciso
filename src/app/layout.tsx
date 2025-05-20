
import type { Metadata } from 'next';
// Removed Inter font import
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';

// const inter = Inter({ // Changed from GeistSans
//   variable: '--font-inter', // Changed CSS variable name
//   subsets: ['latin'],
// });

export const metadata: Metadata = {
  title: 'Moedas Narciso',
  description: 'Plataforma de gerenciamento de contribuições recicláveis e Moedas Narciso.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      {/* Removed inter.variable */}
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
