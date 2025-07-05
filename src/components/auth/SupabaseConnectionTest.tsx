"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import { DataService } from '@/lib/dataService';

interface TestResults {
  auth?: string;
  students?: string;
  ranking?: string;
  error?: string;
}

export function SupabaseConnectionTest() {
  const [testResults, setTestResults] = useState<TestResults>({});
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    setTestResults({});

    try {
      // Test 1: Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();
      setTestResults(prev => ({
        ...prev,
        auth: user ? `Autenticado como: ${user.email}` : 'Não autenticado'
      }));

      // Test 2: Buscar estudantes
      const students = await DataService.getStudents();
      setTestResults(prev => ({
        ...prev,
        students: `Estudantes encontrados: ${students?.length || 0}`
      }));

      // Test 3: Buscar ranking
      const ranking = await DataService.getStudentRanking();
      setTestResults(prev => ({
        ...prev,
        ranking: `Ranking obtido: ${ranking?.length || 0} registros`
      }));

    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        error: `Erro: ${err.message || "Desconhecido"}`
      }));
      console.error("Erro nos testes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-md mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Diagnóstico do Supabase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Executando testes..." : "Testar Conexão"}
        </Button>
        
        {Object.entries(testResults).map(([key, value]) => (
          <div
            key={key}
            className={`mt-2 p-3 rounded ${
              key === 'error' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}
          >
            <strong className="capitalize">{key}:</strong> {value}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
