
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogInIcon, LeafIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth(); // Agora usa o AuthContext com lógica mockada/local
  const { toast } = useToast();  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Campos Obrigatórios",
        description: "Por favor, preencha o email e a senha.",
      });
      return;
    }
    
    console.log("LoginForm: Tentando login com email:", email);
    setIsLoading(true);
    
    try {
      // Validação extra dos campos
      if (email.trim() === '' || password.trim() === '') {
        throw new Error("Email e senha não podem estar vazios");
      }
      
      await login(email, password); // Agora usa o Supabase com fallback para localStorage
      // O redirecionamento é tratado dentro da função de login do AuthContext
    } catch (error: any) {
      // Mais informações de log para diagnóstico
      console.error("LoginForm: Login attempt failed", {
        message: error.message,
        error: error
      });
      
      // Toast adicional para informar o usuário (além do que é exibido no AuthContext)
      toast({
        variant: "destructive",
        title: "Falha no Login",
        description: "Ocorreu um erro ao tentar fazer login. Verifique o console para mais detalhes.",
      });
    } finally {
      setIsLoading(false);
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
                disabled={isLoading}
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
                disabled={isLoading}
                className="bg-white"
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <LogInIcon className="mr-2 h-5 w-5" />
              )}
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
