"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';

export function SupabaseUserDiagnostic() {
  const [userStatus, setUserStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verifica automaticamente quando o componente é montado
  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Verificar se as variáveis de ambiente estão definidas
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Variáveis de ambiente não configuradas corretamente");
      }
      
      // Verificar se há uma sessão ativa
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      if (!sessionData.session) {
        setUserStatus({
          status: "não autenticado",
          message: "Nenhuma sessão ativa encontrada"
        });
        return;
      }
      
      // Verificar se há um perfil de professor
      const { data: profileData, error: profileError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single();
      
      if (profileError) {
        if (profileError.code === 'PGRST116') {
          setUserStatus({
            status: "autenticado sem perfil",
            user: sessionData.session.user,
            message: "Usuário autenticado, mas sem perfil de professor"
          });
          return;
        }
        throw profileError;
      }
      
      setUserStatus({
        status: "autenticado com perfil",
        user: sessionData.session.user,
        profile: profileData,
        message: "Usuário autenticado e com perfil de professor válido"
      });
    } catch (err: any) {
      setError(`Erro: ${err.message || "Desconhecido"}`);
      console.error("Erro ao verificar status do usuário:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-md mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Diagnóstico de Usuário Supabase</CardTitle>
        <CardDescription>Verifica o status do usuário atual no Supabase</CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={checkUserStatus} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Verificando..." : "Verificar Status de Usuário"}
        </Button>
        
        {userStatus && (
          <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded">
            <h3 className="font-bold">Status: {userStatus.status}</h3>
            <p>{userStatus.message}</p>
            {userStatus.user && (
              <div className="mt-2">
                <p><strong>ID:</strong> {userStatus.user.id}</p>
                <p><strong>Email:</strong> {userStatus.user.email}</p>
              </div>
            )}
            {userStatus.profile && (
              <div className="mt-2">
                <p><strong>Nome:</strong> {userStatus.profile.name}</p>
              </div>
            )}
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
