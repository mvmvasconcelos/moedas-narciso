
import { LoginForm } from '@/components/auth/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Moedas Narciso',
};

// We expect LoginForm to handle the redirect to /dashboard upon successful login.
export default function LoginPage() {
  return <LoginForm />;
}
