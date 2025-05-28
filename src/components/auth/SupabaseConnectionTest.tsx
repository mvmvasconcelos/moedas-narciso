"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';

export function SupabaseConnectionTest() {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Verificar se as variáveis de ambiente estão definidas
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Variáveis de ambiente não configuradas corretamente");
      }
      
      // Teste simples para verificar se o cliente supabase está funcionando
      const { data, error } = await supabase.from('teachers').select('count').limit(1);
      
      if (error) {
        throw error;
      }
      
      setTestResult("Conexão com Supabase bem sucedida! Dados recebidos.");
      console.log("Teste de conexão Supabase:", data);
    } catch (err: any) {
      setError(`Erro: ${err.message || "Desconhecido"}`);
      console.error("Erro ao testar conexão:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-md mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Teste de Conexão Supabase</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={testConnection} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Testando..." : "Testar Conexão"}
        </Button>
        
        {testResult && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
            {testResult}
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
