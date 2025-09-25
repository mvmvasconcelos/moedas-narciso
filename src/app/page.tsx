'use client';
import { useEffect, useState } from 'react';
import { DataService } from '@/lib/dataService';
import PublicPageHeader from '@/components/layout/PublicPageHeader';
import PublicPageFooter from '@/components/layout/PublicPageFooter';

interface DashboardStats {
  generalStats: {
    total_tampas: number;
    total_latas: number;
    total_oleo: number;
    total_coins: number;
  };
}

export default function HomePage() {
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

  // Calcula o peso aproximado (em kg) a partir dos totais: tampas, latas e óleo.
  // 1 tampa = 0.002 kg, 1 lata = 0.015 kg, 1 litro de óleo = 0.960 kg
  const approxKg = stats
    ? Math.ceil(
        stats.generalStats.total_tampas * 0.002 +
          stats.generalStats.total_latas * 0.016 +
          stats.generalStats.total_oleo * 0.96
      )
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-blue-50 relative overflow-hidden">
      {/* Elementos decorativos de fundo (hexágonos, compatível com /linha-do-tempo) */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-300 opacity-20 animate-pulse"
          style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
        ></div>
        <div
          className="absolute top-1/4 -left-8 w-32 h-32 bg-green-300 opacity-15 animate-pulse delay-1000"
          style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-blue-300 opacity-25 animate-pulse delay-500"
          style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
        ></div>
        <div
          className="absolute bottom-12 left-12 w-20 h-20 bg-amber-300 opacity-20 animate-pulse delay-700"
          style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
        ></div>
      </div>

      {/* Conteúdo Principal */}
      <main className="relative z-10 px-3 sm:px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          <PublicPageHeader />
          
          {/* Card principal com conteúdo */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12 border border-white/20 relative overflow-hidden mx-2 sm:mx-0">
            {/* Decoração do card (hexágonos) */}
            <div
              className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-yellow-200 to-amber-200 opacity-30"
              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
            ></div>
            <div
              className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-tr from-green-200 to-emerald-200 opacity-30"
              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
            ></div>
            
            <div className="relative z-10 leading-relaxed text-gray-700">
                            
              <p className="text-base sm:text-lg mb-4 sm:mb-6 text-justify">
                Boas vindas ao portal do projeto <strong className="text-green-700">Moedas Narciso</strong>, uma iniciativa transformadora da Escola Municipal de Ensino Fundamental Narciso Mariante de Campos, uma escola rural de Linha Tangerinas, no interior de Venâncio Aires - RS! Lançado em 2025, o projeto <strong className="text-amber-700">abrange toda a nossa comunidade escolar</strong>, desde as turmas de pré-escola (pré-A e pré-B) até o 5º ano.
              </p>
              
              <div className="bg-gradient-to-r from-green-50 to-amber-50 p-4 sm:p-6 rounded-lg sm:rounded-xl mb-4 sm:mb-6 border-l-4 border-green-500">
                <p className="text-base sm:text-lg text-justify">
                  Moedas Narciso se inicia com o <strong className="text-green-700">recolhimento de materiais recicláveis</strong>, como tampinhas, latinhas de aluminio e óleo de cozinha usado, um esforço que vai além da coleta tradicional. Em troca desses materiais, os alunos são recompensados com as <strong className="text-amber-700">Moedas Narciso</strong>, a moeda da nossa própria da escola, que permite aos alunos uma conciência monetária desde cedo, juntamente com uma recompensa e experiência de troca imediata.
                </p>
              </div>
              
              <p className="text-base sm:text-lg mb-4 sm:mb-6 text-justify">
                Mais do que uma simples troca, o Moedas Narciso é um projeto multifacetado que integra <strong className="text-green-700">educação ambiental</strong>, <strong className="text-blue-700">educação financeira</strong> e <strong className="text-amber-700">ação social</strong>. Os alunos não apenas contribuem para a limpeza do meio ambiente, recolhendo materiais que seriam descartados, mas também vivenciam na prática conceitos de <strong className="text-green-700">sistema monetário, contagem e cálculo</strong>, gerenciando suas próprias "finanças".
              </p>

              <p className="text-base sm:text-lg mb-4 sm:mb-6 text-justify">
                A iniciativa também promove a <strong className="text-amber-700">solidariedade</strong>, com uma parcela do valor arrecadado sendo destinado à compra de cestas básicas para famílias necessitadas da <strong className="text-blue-700">comunidade</strong>. Assim, o projeto não só beneficia o meio ambiente e a educação dos alunos, mas também fortalece os laços comunitários e o espírito de solidariedade.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-green-50 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-2 sm:mb-3 text-base sm:text-lg">🐝 Cooperativa Narciso</h4>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Eles se tornaram <strong>protagonistas da "Cooperativa Narciso"</strong>, organizando a coleta, a contagem e a separação dos materiais. Com suas Moedas Narciso, podem adquirir itens na <strong>lojinha mensal</strong> da escola além de outros benefícios.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-amber-200">
                  <h4 className="font-bold text-amber-800 mb-2 sm:mb-3 text-base sm:text-lg">💝 Impacto Social Já É Realidade</h4>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Como parte do valor arrecadado é revertido para a <strong>compra de cestas básicas</strong> para famílias necessitadas da comunidade. Em apenas <span className="underline decoration-amber-700 underline-offset-2 text-gray-700">4 meses de projeto</span>, duas já foram beneficiadas, mostrando o impacto rápido e positivo que o Moedas Narciso está gerando.
                  </p>
                </div>
              </div>
              
              <div className="text-center bg-gradient-to-r from-green-600 to-amber-600 text-white p-4 sm:p-6 rounded-lg sm:rounded-xl mt-6 sm:mt-8">
                <p className="text-base sm:text-lg lg:text-xl font-semibold">
                  🌟 Assista a um resumo da nossa apresentação! 🌟
                </p>
              </div>

              {/* Player do YouTube responsivo - centralizado e com largura compatível com os outros blocos */}
              <div className="max-w-3xl mx-auto my-6">
                <div className="w-full aspect-video">
                  <iframe
                    className="w-full h-full rounded-lg shadow-lg"
                    src="https://www.youtube.com/embed/m0D_5nJ13TE"
                    title="Apresentação Moedas Narciso"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
          
          {/* Seção Você Sabia */}
          <div className="mt-12 sm:mt-16 mx-2 sm:mx-0">
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg mb-4 sm:mb-6">
                <span className="font-bold text-xl sm:text-2xl">🤔 Você sabia? 🤔</span>
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
                    Isso são aproximadamente <span className="text-green-700 font-bold">{approxKg?.toLocaleString()} quilos</span> de materiais que, ao invés de acabar descartado no meio ambiente, foram transformados em <span className="text-green-700 font-bold">{stats.generalStats.total_coins.toLocaleString()} Moedas Narciso</span> para os nossos alunos e em <span className="text-green-700 font-bold">duas cestas básicas</span> para a comunidade!
                  </p>
                </div>
              </div>
            )}
            {/* Link para apresentação em PDF */}
            {stats && (
              <div className="text-lg sm:text-xl text-gray-700 font-medium max-w-3xl mx-auto px-2 mt-6 sm:mt-8 text-center underline decoration-gray-400 underline-offset-2">
                <a
                  href="https://drive.google.com/file/d/1oe0epei9Ajc7HUqkm1YPcIDViDsKWCb4/view?usp=drive_link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Clique aqui para ler a nossa apresentação em PDF.
                </a>
              </div>
            )}
          </div>
        </div>
      </main>

      <PublicPageFooter />
      {process.env.NODE_ENV === 'production' && <AnalyticsLoader />}
    </div>
  );
}

function AnalyticsLoader() {
  const [loaded, setLoaded] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import('@vercel/analytics/next');
        if (mounted && mod && mod.Analytics) {
          const Comp = mod.Analytics;
          setLoaded(<Comp />);
        }
      } catch (e) {
        // Não tratar como erro em dev local
        // eslint-disable-next-line no-console
        console.info('Vercel Analytics não disponível neste ambiente.');
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return loaded;
}