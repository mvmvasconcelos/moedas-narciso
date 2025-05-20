"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogInIcon, LeafIcon } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState(''); // Using email as a stand-in for teacher identifier
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd validate credentials against a backend.
    // For this demo, any non-empty email/password combination works.
    if (email && password) {
      // Using email as teacher name for simplicity
      login(email.split('@')[0] || "Professor(a)"); 
    } else {
      alert("Por favor, preencha o email e a senha.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <LeafIcon className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Moedas Narciso</CardTitle>
          <CardDescription>Bem-vindo(a)! Faça login para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@escola.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white"
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              <LogInIcon className="mr-2 h-5 w-5" />
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
