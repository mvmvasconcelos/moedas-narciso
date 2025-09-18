
import Image from 'next/image';

export default function PublicPageHeader() {
  return (
    <div className="text-center mb-12 sm:mb-16">
      {/* Header com Logo */}
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
  );
}
