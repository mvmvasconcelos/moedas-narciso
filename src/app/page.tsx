"use client";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';

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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-blue-50 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-300 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/4 -left-8 w-32 h-32 bg-green-300 rounded-full opacity-15 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-blue-300 rounded-full opacity-25 animate-pulse delay-500"></div>
        <div className="absolute bottom-12 left-12 w-20 h-20 bg-amber-300 rounded-full opacity-20 animate-pulse delay-700"></div>
      </div>

      {/* Conteúdo Principal */}
      <main className="relative z-10 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header com Logo */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <Image 
                  src="/images/logo.png" 
                  alt="Logo Moedas Narciso" 
                  width={200} 
                  height={200}
                  className="drop-shadow-lg hover:scale-105 transition-transform duration-300"
                  priority
                />
                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full opacity-20 blur-xl"></div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-700 via-amber-600 to-green-800 bg-clip-text text-transparent mb-4 leading-tight">
              Projeto Moedas Narciso
            </h1>
            <h2 className="text-2xl md:text-3xl text-gray-700 font-semibold mb-2">
              EMEF Narciso Mariante de Campos
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-green-500 to-amber-500 mx-auto rounded-full"></div>
          </div>
          
          {/* Card principal com conteúdo */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 border border-white/20 relative overflow-hidden">
            {/* Decoração do card */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200 to-amber-200 rounded-bl-full opacity-30"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-200 to-emerald-200 rounded-tr-full opacity-30"></div>
            
            <div className="relative z-10 leading-relaxed text-gray-700">
                            
              <p className="text-lg mb-6 text-justify">
                Boas vindas ao portal do projeto <strong className="text-green-700">Moedas Narciso</strong>, uma iniciativa transformadora da EMEF Narciso Mariante de Campos! Lançado em 2025, o projeto <strong className="text-amber-700">abrange toda a nossa comunidade escolar</strong>, desde as turmas de pré-escola (pré-A e pré-B) até o 5º ano.
              </p>
              
              <div className="bg-gradient-to-r from-green-50 to-amber-50 p-6 rounded-xl mb-6 border-l-4 border-green-500">
                <p className="text-lg text-justify">
                  O Moedas Narciso se inicia com o <strong className="text-green-700">recolhimento de materiais recicláveis</strong>, como tampinhas, latinhas e óleo de cozinha usado, um esforço que vai além da coleta tradicional. Em troca desses materiais, os alunos são recompensados com as <strong className="text-amber-700">Moedas Narciso</strong>, nossa moeda de troca própria da escola, que permite uma experiência de troca imediata e envolvente.
                </p>
              </div>
              
              <p className="text-lg mb-6 text-justify">
                Mais do que uma simples troca, o Moedas Narciso é um projeto multifacetado que integra <strong className="text-green-700">educação ambiental</strong>, <strong className="text-blue-700">educação financeira</strong> e <strong className="text-amber-700">ação social</strong>. Os alunos não apenas contribuem para a limpeza do meio ambiente, recolhendo materiais que seriam descartados, mas também vivenciam na prática conceitos de <strong className="text-green-700">sistema monetário, contagem e cálculo</strong>, gerenciando suas próprias "finanças".
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-green-50 p-6 rounded-xl border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-3 text-lg">🐝 Cooperativa Narciso</h4>
                  <p className="text-gray-700">
                    Eles se tornaram <strong>protagonistas da "Cooperativa Narciso"</strong>, organizando a coleta, a contagem e a separação dos materiais. Com suas Moedas Narciso, podem adquirir itens na <strong>"lojinha" mensal</strong> da escola.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                  <h4 className="font-bold text-amber-800 mb-3 text-lg">💝 Impacto Social</h4>
                  <p className="text-gray-700">
                    Parte do valor arrecadado é revertido para a <strong>compra de cestas básicas para famílias necessitadas</strong> da comunidade escolar. Os alunos também podem usar suas moedas para eventos escolares!
                  </p>
                </div>
              </div>
              
              <div className="text-center bg-gradient-to-r from-green-600 to-amber-600 text-white p-6 rounded-xl mt-8">
                <p className="text-xl font-semibold">
                  🌟 Este site serve como uma janela para o nosso sucesso e o envolvimento de toda a família Narciso! 🌟
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="relative z-10 bg-gradient-to-r from-green-800 via-amber-700 to-green-800 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <div className="w-8 h-1 bg-amber-400 rounded-full mr-3"></div>
              <p className="text-lg font-semibold">
                Sistema desenvolvido para o projeto Moedas Narciso
              </p>
              <div className="w-8 h-1 bg-amber-400 rounded-full ml-3"></div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 inline-block">
              <button 
                onClick={handleAccessSystem}
                className="text-amber-200 hover:text-amber-100 font-bold text-lg transition-colors duration-200 hover:scale-105 transform inline-block"
              >
                🚀 Acessar Sistema
              </button>
            </div>
            
            <div className="mt-6 text-sm text-green-100">
              <p>EMEF Narciso Mariante de Campos - 2025</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
