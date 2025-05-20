import { LoginForm } from '@/components/auth/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Moedas Narciso',
};

export default function LoginPage() {
  return <LoginForm />;
}
