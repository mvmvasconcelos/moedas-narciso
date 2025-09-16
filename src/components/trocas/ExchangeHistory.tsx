"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataService } from "@/lib/dataService";
import { Skeleton } from "@/components/ui/skeleton";
import { MATERIAL_LABELS, MATERIAL_TYPES } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SearchIcon,
  FilterIcon,
  ArrowLeft,
  ArrowRight,
  DownloadIcon,
  Pencil,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { ExchangeHistoryRecord } from "@/lib/exchangeTypes";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { calcularTotaisTrocas } from "@/lib/utils";

export function ExchangeHistory() {
  const [loading, setLoading] = useState(true);
  const [exchanges, setExchanges] = useState<ExchangeHistoryRecord[]>([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);
  const [viewError, setViewError] = useState<string | null>(null);
  const { classes, students } = useAuth();
  const { toast } = useToast();

  // Estados para o modal de edição e exclusão
  const [selectedExchange, setSelectedExchange] = useState<ExchangeHistoryRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editedQuantity, setEditedQuantity] = useState<number>(0);
  const [editedMaterial, setEditedMaterial] = useState<string>("");
  const [editedStudentId, setEditedStudentId] = useState<string>("");
  const [processingAction, setProcessingAction] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [studentTotals, setStudentTotals] = useState<any | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filtros
  const [classFilter, setClassFilter] = useState<string>("all");
  const [studentFilter, setStudentFilter] = useState<string>("");
  const [materialFilter, setMaterialFilter] = useState<string>("all");
  const [searchText, setSearchText] = useState("");

  // Estados para ordenação
  const [sortColumn, setSortColumn] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Verificar existência da view quando o componente for montado
  useEffect(() => {
    const checkView = async () => {
      try {
        const viewStatus = await DataService.checkExchangeHistoryView();
        if (!viewStatus.exists) {
          // ...log removido...
          setViewError("A view de histórico não está disponível. Por favor, consulte o administrador do sistema.");
        } else {
          setViewError(null);
        }
        
        // Verificar triggers que possam interferir na exclusão
        await checkDatabaseTriggers();
      } catch (error) {
  // ...log removido...
      }
    };
    
    checkView();
  }, []);

  useEffect(() => {
  // ...log removido...
    loadExchangeHistory();
  }, [page, limit, classFilter, materialFilter, studentFilter]);  // Adicionado limit e studentFilter

  const loadExchangeHistory = async () => {
    setLoading(true);
    try {
  // ...log removido...
      
      const result = await DataService.getExchangeHistory({
        page,
        limit,
        classFilter: classFilter !== "all" ? classFilter : undefined,
        studentFilter: studentFilter || undefined,
        materialFilter: materialFilter !== "all" ? materialFilter : undefined
      });
      
      setExchanges(result.data);
      setTotal(result.total);
    } catch (error) {
  // ...log removido...
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchText) {
      // Para uma busca simples, assumimos que o texto é um nome de aluno ou parte dele
      setStudentFilter(searchText);
    } else {
      setStudentFilter("");
    }
    setPage(0);
    loadExchangeHistory();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const resetFilters = () => {
    setClassFilter("all");
    setStudentFilter("");
    setMaterialFilter("all");
    setSearchText("");
    setSortColumn("date");
    setSortDirection("desc");
    setPage(0);
    loadExchangeHistory();
  };

  // Função para lidar com a ordenação por coluna
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Se já está ordenando por esta coluna, inverte a direção
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Se é uma nova coluna, define como ascendente
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Função para obter o ícone de ordenação
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === "asc" ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  // Função para ordenar os dados
  const sortedExchanges = [...exchanges].sort((a, b) => {
    let comparison = 0;
    
    switch (sortColumn) {
      case "date":
        comparison = new Date(a.dateTimestamp).getTime() - new Date(b.dateTimestamp).getTime();
        break;
      case "student":
        comparison = a.studentName.localeCompare(b.studentName, 'pt-BR');
        break;
      case "class":
        comparison = a.className.localeCompare(b.className, 'pt-BR');
        break;
      case "material":
        const materialA = MATERIAL_LABELS[a.material as keyof typeof MATERIAL_LABELS] || a.material;
        const materialB = MATERIAL_LABELS[b.material as keyof typeof MATERIAL_LABELS] || b.material;
        comparison = materialA.localeCompare(materialB, 'pt-BR');
        break;
      case "quantity":
        comparison = a.quantity - b.quantity;
        break;
      case "teacher":
        comparison = a.teacherName.localeCompare(b.teacherName, 'pt-BR');
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const exportToCsv = () => {
    if (sortedExchanges.length === 0) return;
    
    const headers = ["Data", "Aluno", "Turma", "Material", "Quantidade", "Registrado por"];
    const csvContent = [
      headers.join(','),
      ...sortedExchanges.map(e => [
        e.date,
        e.studentName,
        e.className,
        MATERIAL_LABELS[e.material as keyof typeof MATERIAL_LABELS]?.replace(" (unidades)", "") || e.material,
        e.quantity,
        e.teacherName
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `trocas-${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
  };

  const totalPages = Math.ceil(total / limit);

  // Funções para abrir o modal de edição
  const handleRowClick = (exchange: ExchangeHistoryRecord) => {
    // Garante que os campos estejam corretos, mesmo se vierem do backend com nomes diferentes
    const mappedExchange = {
      ...exchange,
      studentId: exchange.studentId || (exchange as any).student_id,
      material: exchange.material || (exchange as any).material_id,
    };
    setSelectedExchange(mappedExchange);
    setEditedQuantity(mappedExchange.quantity);
    setEditedMaterial(mappedExchange.material);
    setEditedStudentId(mappedExchange.studentId);
    setIsEditModalOpen(true);
  };

  // Função para editar um registro
  const handleEditExchange = async () => {
    if (!selectedExchange) return;
    
    setProcessingAction(true);
    try {
      // Se os valores não mudaram, não faz nada
      if (
        selectedExchange.quantity === editedQuantity &&
        selectedExchange.material === editedMaterial &&
        selectedExchange.studentId === editedStudentId
      ) {
        setIsEditModalOpen(false);
        return;
      }

      try {
        await DataService.updateExchangeWithBalanceCorrection(selectedExchange.id, {
          quantity: editedQuantity,
          material_id: editedMaterial,
          student_id: editedStudentId,
        });
      } catch (error) {
        toast({
          title: "Erro ao atualizar registro",
          description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o registro de troca.",
          variant: "destructive"
        });
        setIsEditModalOpen(false);
        return;
      }

      toast({
        title: "Registro atualizado",
        description: "O registro de troca foi atualizado com sucesso.",
      });

      // Recarregar os dados
      loadExchangeHistory();
      setIsEditModalOpen(false);
    } catch (error) {
  // ...log removido...
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o registro de troca.",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Funções para deletar um registro
  // Estado para armazenar a prévia dos valores pós-exclusão
  const [deletePreview, setDeletePreview] = useState<any | null>(null);
  const openDeleteConfirmation = async () => {
    setIsEditModalOpen(false);
    if (selectedExchange) {
      // Buscar todas as trocas do aluno para o material
      const { studentId, material, id: exchangeId } = selectedExchange;
      const { data: allExchanges } = await supabase
        .from('exchanges')
        .select('id, quantity, coins_earned, conversion_rate, created_at')
        .eq('student_id', studentId)
        .eq('material_id', material)
        .order('created_at', { ascending: true });


      // Remover a troca selecionada da lista
      const exchangesAfterDelete = (allExchanges || []).filter((ex: any) => ex.id !== exchangeId);

      // Usar função utilitária para simular saldo, total e sobra após exclusão
      const { totalMaterial, totalMoedas, pendente } = calcularTotaisTrocas(
        exchangesAfterDelete.map((ex: any) => ({
          quantity: ex.quantity || 0,
          conversion_rate: ex.conversion_rate || 1
        }))
      );

      // Buscar dados atuais do aluno
      const totals = await DataService.getStudentMaterialTotals(studentId);
      // Calcular saldo atual e saldo pós-exclusão
      const saldoAtual = totals.student?.narciso_coins ?? '-';
      const saldoHistorico = totals.student?.total_coins_earned ?? '-';
      // saldoApos deve ser o totalMoedas recalculado
      const saldoApos = totalMoedas;
      // Total de material antes da exclusão
      const totalMaterialAntes = (allExchanges || []).reduce((sum: number, ex: any) => sum + (ex.quantity || 0), 0);

      setStudentTotals(totals);
      setDeletePreview({
        saldoHistorico,
        saldoAtual,
        saldoApos,
        totalMaterialAntes,
        totalMaterial,
        pendente,
  moedasRemovidas: (selectedExchange as any).coins_earned || 0,
        quantidadeRemovida: selectedExchange.quantity || 0,
        data: selectedExchange.date
      });
    }
    setIsDeleteAlertOpen(true);
    checkDatabaseTriggers();
  };

  const handleDeleteExchange = async () => {
    if (!selectedExchange) return;
    setProcessingAction(true);
    try {
      if (hasTriggers) {
  // ...log removido...
      }
      const result = await DataService.deleteExchange(selectedExchange.id);
      // Atualizar os dados imediatamente
      await loadExchangeHistory();
      // Buscar novamente os totais do aluno para exibir após exclusão
      if (selectedExchange) {
        const totals = await DataService.getStudentMaterialTotals(selectedExchange.studentId);
        setStudentTotals(totals);
      }
      setShowSuccessAlert(true);
      // Fechar modal após 1.5s
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => {
        setShowSuccessAlert(false);
        setIsDeleteAlertOpen(false);
      }, 1500);
      // Toast extra para garantir feedback
        toast({
        title: "Registro excluído",
        description: result && typeof result === 'object' && 'newCoinsValue' in result && (result as any).newCoinsValue !== undefined
          ? `Troca excluída e saldo do aluno atualizado para ${(result as any).newCoinsValue} moedas.`
          : "O registro de troca foi excluído com sucesso.",
      });
      if (hasTriggers) {
        toast({
          title: "Atenção: Triggers detectados",
          description: "Foram detectados triggers no banco que podem interferir nos totais. Verifique os valores após a exclusão.",
          duration: 8000,
        });
      }
    } catch (error) {
  // ...log removido...
      const errorMessage = error instanceof Error ? error.message : "Não foi possível excluir o registro de troca.";
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: errorMessage,
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Estado para armazenar informações sobre triggers
  const [hasTriggers, setHasTriggers] = useState<boolean>(false);
  const [triggersInfo, setTriggersInfo] = useState<any[] | null>(null);

  // Função para verificar triggers no banco de dados
  const checkDatabaseTriggers = async () => {
    try {
      const result = await DataService.checkDatabaseTriggers();
      setHasTriggers(result.hasTriggers);
      setTriggersInfo(result.triggers);
      
      if (result.hasTriggers) {
  // ...log removido...
        toast({
          title: "Triggers detectados no banco",
          description: "Existem triggers no banco de dados que podem interferir com operações de exclusão.",
          variant: "destructive",
          duration: 8000
        });
      }
    } catch (error) {
  // ...log removido...
    }
  };

  return (
    <Card className="p-6">
      {/* Primeira linha: Filtros de busca */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Pesquisar por aluno..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={handleSearch}
            >
              <SearchIcon className="h-4 w-4" />
            </Button>
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="md:w-[180px]">
              <SelectValue placeholder="Filtrar por turma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as turmas</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.name}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={materialFilter} onValueChange={setMaterialFilter}>
            <SelectTrigger className="md:w-[180px]">
              <SelectValue placeholder="Filtrar por material" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os materiais</SelectItem>
              <SelectItem value={MATERIAL_TYPES.LIDS}>Tampas</SelectItem>
              <SelectItem value={MATERIAL_TYPES.CANS}>Latas</SelectItem>
              <SelectItem value={MATERIAL_TYPES.OIL}>Óleo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Segunda linha: Botões de ação e seletor de registros */}
        <div className="flex flex-col sm:flex-row gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={resetFilters} className="w-full sm:w-auto">
              <FilterIcon className="mr-2 h-4 w-4" />
              Limpar filtros
            </Button>
            <Button variant="outline" onClick={exportToCsv} disabled={sortedExchanges.length === 0} className="w-full sm:w-auto">
              <DownloadIcon className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
          
          <Select 
            value={limit === 9999 ? "all" : limit.toString()} 
            onValueChange={(value) => {
              const newLimit = value === "all" ? 9999 : parseInt(value);
              setLimit(newLimit);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Registros por página" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 registros</SelectItem>
              <SelectItem value="50">50 registros</SelectItem>
              <SelectItem value="100">100 registros</SelectItem>
              <SelectItem value="500">500 registros</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableCaption>
            {viewError ? (
              viewError
            ) : loading ? (
              "Carregando registros..."
            ) : sortedExchanges.length > 0 ? (
              `Mostrando ${sortedExchanges.length} de ${total} registros de trocas`
            ) : (
              "Nenhum registro de troca encontrado."
            )}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center gap-2">
                  Data
                  {getSortIcon("date")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort("student")}
              >
                <div className="flex items-center gap-2">
                  Aluno
                  {getSortIcon("student")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort("class")}
              >
                <div className="flex items-center gap-2">
                  Turma
                  {getSortIcon("class")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort("material")}
              >
                <div className="flex items-center gap-2">
                  Material
                  {getSortIcon("material")}
                </div>
              </TableHead>
              <TableHead 
                className="text-right cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort("quantity")}
              >
                <div className="flex items-center gap-2 justify-end">
                  Quantidade
                  {getSortIcon("quantity")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort("teacher")}
              >
                <div className="flex items-center gap-2">
                  Registrado por
                  {getSortIcon("teacher")}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {viewError ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-red-500">
                  {viewError}
                  <p className="text-sm mt-2">
                    É necessário criar a view SQL no Supabase conforme as instruções no arquivo 
                    <code className="bg-gray-100 p-1 mx-1 rounded">docs/implementacao_db.md</code>
                  </p>
                </TableCell>
              </TableRow>
            ) : loading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                </TableRow>
              ))
            ) : sortedExchanges.length > 0 ? (
              sortedExchanges.map((exchange) => (
                <TableRow 
                  key={exchange.id} 
                  onClick={() => handleRowClick(exchange)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <TableCell>{exchange.date}</TableCell>
                  <TableCell>{exchange.studentName}</TableCell>
                  <TableCell>{exchange.className}</TableCell>
                  <TableCell>
                    {MATERIAL_LABELS[exchange.material as keyof typeof MATERIAL_LABELS]?.replace(" (unidades)", "") || exchange.material}
                  </TableCell>
                  <TableCell className="text-right">{exchange.quantity}</TableCell>
                  <TableCell className="flex gap-1 items-center">
                    {exchange.teacherName}
                    <span className="ml-auto text-xs text-gray-400"><Pencil className="h-3 w-3 inline" /> Clique para editar</span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Nenhum registro de troca encontrado com os filtros aplicados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && limit < 9999 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages} • Mostrando {limit} registros por página
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal de edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Registro de Troca</DialogTitle>
            <DialogDescription>
              Altere os dados do registro de troca conforme necessário.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-student">Aluno</Label>
                <Select
                    value={editedStudentId}
                    onValueChange={setEditedStudentId}
                  >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-material">Material</Label>
                <Select
                  value={editedMaterial}
                  onValueChange={setEditedMaterial}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MATERIAL_TYPES.LIDS}>Tampas</SelectItem>
                    <SelectItem value={MATERIAL_TYPES.CANS}>Latas</SelectItem>
                    <SelectItem value={MATERIAL_TYPES.OIL}>Óleo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-quantity">Quantidade</Label>
              <Input
                id="edit-quantity"
                type="number"
                value={editedQuantity}
                onChange={(e) => setEditedQuantity(Number(e.target.value))}
                min={1}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between w-full">
            <Button 
              variant="destructive" 
              onClick={openDeleteConfirmation} 
              disabled={processingAction}
              type="button"
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={processingAction}>
                Cancelar
              </Button>
              <Button onClick={handleEditExchange} disabled={processingAction}>
                {processingAction ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alerta de exclusão */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-3">
              Tem certeza que deseja excluir este registro de troca? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
            
            {/* Card de informações detalhadas do aluno */}
            {selectedExchange && studentTotals && deletePreview && (
              <div className="mt-4 p-4 border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 shadow-inner mx-2">
                <div className="font-semibold text-primary mb-2">Situação atual do aluno</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Saldo histórico:</strong> {deletePreview.saldoHistorico} moedas</div>
                  <div><strong>Saldo atual:</strong> {deletePreview.saldoAtual} moedas</div>
                  <div><strong>Total de tampas:</strong> {deletePreview.totalMaterialAntes}</div>
                  <div><strong>tampas sobrando:</strong> {studentTotals.student?.pending_tampas ?? '-'}</div>
                </div>
                <div className="mt-4 font-semibold text-amber-700">Ao excluir esta troca, o sistema irá:</div>
                <ul className="list-disc ml-6 mt-1 text-sm">
                  <li>Reduzir o saldo de moedas do aluno ({deletePreview.moedasRemovidas} moedas)</li>
                  <li>O saldo atual deve ficar: {deletePreview.saldoApos} moedas</li>
                  <li>Reverter os materiais entregues ({deletePreview.quantidadeRemovida} unidades Tampas)</li>
                  <li>Atualizar o total de material para: {deletePreview.totalMaterial} tampas</li>
                  <li>Atualizar o total de material sobrando para: {deletePreview.pendente} tampas</li>
                </ul>
                <div className="mt-4 text-xs text-muted-foreground">Data da troca: <strong>{deletePreview.data}</strong></div>
              </div>
            )}
            {/* Alerta visual de sucesso */}
            {showSuccessAlert && (
              <div className="mt-4 p-3 rounded-md bg-green-100 border border-green-400 text-green-800 text-center font-semibold animate-fade-in">
                Exclusão com sucesso!
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteExchange} 
              disabled={processingAction}
              className="bg-red-600 hover:bg-red-700"
            >
              {processingAction ? "Excluindo..." : "Excluir registro"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
