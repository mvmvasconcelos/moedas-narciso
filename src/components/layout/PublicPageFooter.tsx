'use client';

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

export default function PublicPageFooter() {
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
    )
}
