"use client";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { DataService } from '@/lib/dataService';

interface DashboardStats {
  generalStats: {
    total_tampas: number;
    total_latas: number;
    total_oleo: number;
    total_coins: number;
  };
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const dashboardStats = await DataService.getDashboardStats();
        if (dashboardStats) {
          setStats(dashboardStats);
        }
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

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
      <main className="relative z-10 px-3 sm:px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header com Logo */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="relative">
                <Image 
                  src="/images/logo.png" 
                  alt="Logo Moedas Narciso" 
                  width={160} 
                  height={160}
                  className="sm:w-[200px] sm:h-[200px] drop-shadow-lg hover:scale-105 transition-transform duration-300"
                  priority
                />
                <div className="absolute -inset-3 sm:-inset-4 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full opacity-20 blur-lg sm:blur-xl"></div>
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-green-700 via-amber-600 to-green-800 bg-clip-text text-transparent mb-3 sm:mb-4 leading-tight px-2">
              Projeto Moedas Narciso
            </h1>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-700 font-semibold mb-2 px-2">
              EMEF Narciso Mariante de Campos
            </h2>
            <div className="w-24 sm:w-32 h-1 bg-gradient-to-r from-green-500 to-amber-500 mx-auto rounded-full"></div>
          </div>
          
          {/* Card principal com conteúdo */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12 border border-white/20 relative overflow-hidden mx-2 sm:mx-0">
            {/* Decoração do card */}
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-yellow-200 to-amber-200 rounded-bl-full opacity-30"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-tr from-green-200 to-emerald-200 rounded-tr-full opacity-30"></div>
            
            <div className="relative z-10 leading-relaxed text-gray-700">
                            
              <p className="text-base sm:text-lg mb-4 sm:mb-6 text-justify">
                Boas vindas ao portal do projeto <strong className="text-green-700">Moedas Narciso</strong>, uma iniciativa transformadora da EMEF Narciso Mariante de Campos! Lançado em 2025, o projeto <strong className="text-amber-700">abrange toda a nossa comunidade escolar</strong>, desde as turmas de pré-escola (pré-A e pré-B) até o 5º ano.
              </p>
              
              <div className="bg-gradient-to-r from-green-50 to-amber-50 p-4 sm:p-6 rounded-lg sm:rounded-xl mb-4 sm:mb-6 border-l-4 border-green-500">
                <p className="text-base sm:text-lg text-justify">
                  O Moedas Narciso se inicia com o <strong className="text-green-700">recolhimento de materiais recicláveis</strong>, como tampinhas, latinhas e óleo de cozinha usado, um esforço que vai além da coleta tradicional. Em troca desses materiais, os alunos são recompensados com as <strong className="text-amber-700">Moedas Narciso</strong>, nossa moeda de troca própria da escola, que permite uma experiência de troca imediata e envolvente.
                </p>
              </div>
              
              <p className="text-base sm:text-lg mb-4 sm:mb-6 text-justify">
                Mais do que uma simples troca, o Moedas Narciso é um projeto multifacetado que integra <strong className="text-green-700">educação ambiental</strong>, <strong className="text-blue-700">educação financeira</strong> e <strong className="text-amber-700">ação social</strong>. Os alunos não apenas contribuem para a limpeza do meio ambiente, recolhendo materiais que seriam descartados, mas também vivenciam na prática conceitos de <strong className="text-green-700">sistema monetário, contagem e cálculo</strong>, gerenciando suas próprias "finanças".
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-green-50 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-2 sm:mb-3 text-base sm:text-lg">🐝 Cooperativa Narciso</h4>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Eles se tornaram <strong>protagonistas da "Cooperativa Narciso"</strong>, organizando a coleta, a contagem e a separação dos materiais. Com suas Moedas Narciso, podem adquirir itens na <strong>"lojinha" mensal</strong> da escola.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-amber-200">
                  <h4 className="font-bold text-amber-800 mb-2 sm:mb-3 text-base sm:text-lg">💝 Impacto Social</h4>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Parte do valor arrecadado é revertido para a <strong>compra de cestas básicas para famílias necessitadas</strong> da comunidade escolar. Os alunos também podem usar suas moedas para eventos escolares!
                  </p>
                </div>
              </div>
              
              <div className="text-center bg-gradient-to-r from-green-600 to-amber-600 text-white p-4 sm:p-6 rounded-lg sm:rounded-xl mt-6 sm:mt-8">
                <p className="text-base sm:text-lg lg:text-xl font-semibold">
                  🌟 Este site serve como uma janela para o nosso sucesso e o envolvimento de toda a família Narciso! 🌟
                </p>
              </div>
            </div>
          </div>
          
          {/* Seção Você Sabia */}
          <div className="mt-12 sm:mt-16 mx-2 sm:mx-0">
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg mb-4 sm:mb-6">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold">🤔 VOCÊ SABIA?</h3>
              </div>
              <p className="text-lg sm:text-xl text-gray-700 font-medium max-w-3xl mx-auto px-2">
                Nós já fazemos a diferença! Veja só a impressionante quantidade de materiais que evitamos que fossem para o lixo:
              </p>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-amber-500"></div>
              </div>
            ) : stats ? (
              <div className="flex justify-center px-2 sm:px-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-4xl w-full">
                  {/* Card Tampinhas - Hexagonal */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <div 
                        className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 bg-gradient-to-br from-blue-500 to-blue-600 flex flex-col items-center justify-center text-white shadow-2xl hover:scale-105 transition-transform duration-300"
                        style={{
                          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                        }}
                      >
                        <div className="text-center">
                          <div className="text-2xl sm:text-3xl mb-1">🔵</div>
                          <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats.generalStats.total_tampas.toLocaleString()}</div>
                          <div className="text-xs sm:text-sm font-medium">Tampinhas</div>
                        </div>
                      </div>
                      <div className="absolute -inset-1 sm:-inset-2 bg-blue-300 opacity-20 blur-md -z-10"
                           style={{
                             clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                           }}></div>
                    </div>
                  </div>

                  {/* Card Latinhas - Hexagonal */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <div 
                        className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 bg-gradient-to-br from-gray-500 to-gray-600 flex flex-col items-center justify-center text-white shadow-2xl hover:scale-105 transition-transform duration-300"
                        style={{
                          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                        }}
                      >
                        <div className="text-center">
                          <div className="text-2xl sm:text-3xl mb-1">🥫</div>
                          <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats.generalStats.total_latas.toLocaleString()}</div>
                          <div className="text-xs sm:text-sm font-medium">Latinhas</div>
                        </div>
                      </div>
                      <div className="absolute -inset-1 sm:-inset-2 bg-gray-300 opacity-20 blur-md -z-10"
                           style={{
                             clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                           }}></div>
                    </div>
                  </div>

                  {/* Card Óleo - Hexagonal */}
                  <div className="flex justify-center sm:col-span-2 lg:col-span-1">
                    <div className="relative">
                      <div 
                        className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 bg-gradient-to-br from-amber-500 to-orange-500 flex flex-col items-center justify-center text-white shadow-2xl hover:scale-105 transition-transform duration-300"
                        style={{
                          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                        }}
                      >
                        <div className="text-center">
                          <div className="text-2xl sm:text-3xl mb-1">🛢️</div>
                          <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats.generalStats.total_oleo.toLocaleString()}</div>
                          <div className="text-xs sm:text-sm font-medium">Litros de Óleo</div>
                        </div>
                      </div>
                      <div className="absolute -inset-1 sm:-inset-2 bg-amber-300 opacity-20 blur-md -z-10"
                           style={{
                             clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                           }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8 sm:py-12">
                <p>Dados não disponíveis no momento</p>
              </div>
            )}
            
            {/* Mensagem adicional */}
            {stats && (
              <div className="text-center mt-8 sm:mt-12 px-2 sm:px-0">
                <div className="bg-gradient-to-r from-green-100 to-amber-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl max-w-2xl mx-auto border border-green-200">
                  <p className="text-base sm:text-lg font-semibold text-gray-700">
                    🎉 Esse material todo já se transformou em <span className="text-green-700 font-bold">{stats.generalStats.total_coins.toLocaleString()} Moedas Narciso</span> para nossos alunos!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="relative z-10 bg-gradient-to-r from-green-800 via-amber-700 to-green-800 text-white py-6 sm:py-8 mt-12 sm:mt-16">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="text-center">
            
            
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3 inline-block">
              <button 
                onClick={handleAccessSystem}
                className="text-amber-200 hover:text-amber-100 font-bold text-base sm:text-lg transition-colors duration-200 hover:scale-105 transform inline-block"
              >
                🚀 Acessar Sistema
              </button>
            </div>
            
            <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-green-100">
              <p>EMEF Narciso Mariante de Campos</p>
              <p>Linha Tangerinas - Venâncio Aires - RS</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
