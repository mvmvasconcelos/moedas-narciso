"use client";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleAccessSystem = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/sistema');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col">
      {/* Conteúdo Principal */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Boas Vindas ao projeto Moedas Narciso
          </h1>
          
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Sistema de gerenciamento de trocas de materiais recicláveis e Moedas Narciso.
          </p>
          
          <Button 
            onClick={handleAccessSystem}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Acessar Sistema
          </Button>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-600">
            Sistema desenvolvido para o projeto Moedas Narciso
          </p>
          <p className="text-sm text-gray-500 mt-2">
            <button 
              onClick={handleAccessSystem}
              className="text-green-600 hover:text-green-700 underline font-medium"
            >
              Acessar Sistema
            </button>
          </p>
        </div>
      </footer>
    </div>
  );
}
