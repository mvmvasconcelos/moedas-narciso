"use client";

import { useState } from 'react';
import { SaleForm } from "@/components/trocas/SaleForm";
import { StudentSelector } from "@/components/trocas/StudentSelector";
import { ShoppingCartIcon, HistoryIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { DataService } from "@/lib/dataService";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import type { Student } from "@/lib/constants";

interface SaleHistoryItem {
  id: string;
  coins_spent: number;
  item_description: string;
  sale_date: string;
  students: { name: string } | null;
  teachers: { name: string } | null;
}

export default function LojinhaPage() {
  const [showHistory, setShowHistory] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [salesHistory, setSalesHistory] = useState<SaleHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { students, refreshStudents } = useAuth();

  const handleSaleComplete = async () => {
    // Atualizar dados dos estudantes para refletir o novo saldo
    await refreshStudents();
    
    // Atualizar histórico se estiver visível
    if (showHistory) {
      loadSalesHistory();
    }
    
    // Limpar seleção de aluno após completar venda
    setSelectedStudent(null);
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    // Abrir modal automaticamente ao selecionar aluno
    setShowSaleModal(true);
  };

  const loadSalesHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await DataService.getSalesHistory();
      setSalesHistory(history);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
    if (!showHistory && salesHistory.length === 0) {
      loadSalesHistory();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalStudentsWithCoins = students.filter(student => 
    (student.currentCoinBalance ?? student.narcisoCoins) > 0
  ).length;

  // Função para converter Student para o formato esperado pelo SaleForm
  const mapStudentForSaleForm = (student: Student | null) => {
    if (!student) return null;
    return {
      id: student.id,
      nome: student.name,
      saldo: student.currentCoinBalance ?? student.narcisoCoins,
      foto_url: student.photo_url || undefined
    };
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCartIcon className="h-8 w-8" />
            Lojinha Escolar
          </h1>
          <p className="text-muted-foreground mt-2">
            Selecione um aluno para abrir automaticamente o formulário de venda
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={toggleHistory}
            className="flex items-center gap-2"
          >
            <HistoryIcon className="h-4 w-4" />
            {showHistory ? "Ocultar Histórico" : "Ver Histórico"}
          </Button>
        </div>
      </div>

      {/* Seleção de Aluno */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Aluno</CardTitle>
          <CardDescription>
            O formulário de venda abrirá automaticamente ao selecionar um aluno
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Aluno</Label>
            <StudentSelector 
              onStudentSelect={handleStudentSelect}
            />
            {selectedStudent && (
              <Alert>
                <ShoppingCartIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>{selectedStudent.name}</strong> selecionado - Modal abrirá automaticamente
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      <Alert>
        <ShoppingCartIcon className="h-4 w-4" />
        <AlertTitle>Resumo da Lojinha</AlertTitle>
        <AlertDescription>
          {totalStudentsWithCoins} alunos possuem moedas disponíveis para gastar
        </AlertDescription>
      </Alert>

      {/* Histórico de Vendas */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5" />
              Histórico de Vendas
            </CardTitle>
            <CardDescription>
              Últimas vendas registradas na lojinha
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando histórico...</p>
              </div>
            ) : salesHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma venda registrada ainda</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Selecione um aluno acima para começar a registrar vendas
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {salesHistory.map((sale) => (
                  <div 
                    key={sale.id}
                    className="border rounded-lg p-3 space-y-1"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{sale.students?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {sale.item_description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${sale.coins_spent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {sale.coins_spent > 0 ? '-' : '+'}
                          {Math.abs(sale.coins_spent)} moedas
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(sale.sale_date)}
                        </p>
                      </div>
                    </div>
                    {sale.teachers?.name && (
                      <p className="text-xs text-muted-foreground">
                        Registrado por: {sale.teachers.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Venda */}
      <SaleForm 
        isOpen={showSaleModal}
        onClose={() => {
          setShowSaleModal(false);
          setSelectedStudent(null); // Limpar seleção ao fechar modal
        }}
        student={mapStudentForSaleForm(selectedStudent)}
      />
    </div>
  );
}
