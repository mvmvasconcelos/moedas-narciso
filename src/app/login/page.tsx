
import { LoginForm } from '@/components/auth/LoginForm';
import { SupabaseConnectionTest } from '@/components/auth/SupabaseConnectionTest';
import { SupabaseUserDiagnostic } from '@/components/auth/SupabaseUserDiagnostic';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Moedas Narciso',
};

// We expect LoginForm to handle the redirect to /dashboard upon successful login.
export default function LoginPage() {
  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <LoginForm />
      {/* Componentes temporários para diagnóstico */}
      <div className="w-full max-w-md">
        <SupabaseConnectionTest />
        <SupabaseUserDiagnostic />
      </div>
    </div>
  );
}
