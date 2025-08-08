// Serviço de dados que abstrai o acesso ao armazenamento
// Utiliza exclusivamente o Supabase para todas as operações de dados

import { type Student, type MaterialType, MATERIAL_TYPES } from './constants';
import { supabase } from './supabase';
// Importar tipos do arquivo exchangeTypes.ts
import type { 
  ExchangeHistoryParams, 
  ExchangeHistoryResult, 
  ExchangeHistoryRecord
} from './exchangeTypes';

// Interface para autenticação
interface AuthData {
  username: string;
  isAuthenticated: boolean;
}

// Cache para taxas de conversão
let conversionRatesCache: Record<MaterialType, number> | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos em milissegundos

// Valores padrão para fallback
const DEFAULT_CONVERSION_RATES: Record<MaterialType, number> = {
  [MATERIAL_TYPES.LIDS]: 20,
  [MATERIAL_TYPES.CANS]: 30,
  [MATERIAL_TYPES.OIL]: 2,
};

// Interface para troca de materiais
interface Exchange {
  id?: string;
  student_id: string;
  material_id: MaterialType;
  quantity: number;
  teacher_id: string;
  created_at?: string;
}

// Interface para venda de itens
export interface Sale {
  student_id: string;
  coins_spent: number;
  item_description: string;
  teacher_id: string;
  sale_date?: string; // Opcional, usa now() se não fornecido
}

// As interfaces para o histórico de trocas foram movidas para exchangeTypes.ts



// Classe que gerencia as operações de dados
export class DataService {
  // MÉTODOS DE CARREGAMENTO DE DADOS
  static async getStudents(): Promise<Student[]> {
    try {
      // Buscar dados da view v_student_list que agora inclui photo_url
      const { data, error } = await supabase
        .from('v_student_list')
        .select('*')
        .order('name');

      if (error) {
        console.error("Erro ao buscar estudantes:", error);
        throw error;
      }

      // Converter dados da view para o formato do frontend
      const students = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        className: row.class_name || 'Sem turma',
        gender: row.gender,
        photo_url: row.photo_url || null, // Campo agora disponível na view
        exchanges: {
          [MATERIAL_TYPES.LIDS]: row.exchange_tampas || 0,
          [MATERIAL_TYPES.CANS]: row.exchange_latas || 0,
          [MATERIAL_TYPES.OIL]: row.exchange_oleo || 0
        },
        pendingExchanges: {
          [MATERIAL_TYPES.LIDS]: row.pending_tampas || 0,
          [MATERIAL_TYPES.CANS]: row.pending_latas || 0,
          [MATERIAL_TYPES.OIL]: row.pending_oleo || 0
        },
        narcisoCoins: row.effective_narciso_coins || 0,
        currentCoinBalance: row.current_coin_balance || 0 // Saldo atual após vendas
      }));

      return students;
    } catch (error) {
      console.error("Erro ao buscar estudantes:", error);
      throw error;
    }
  }
  static async getClasses() {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          teacher_id`);
      
      if (error) {
        console.error("Erro ao buscar turmas:", error);
        throw error;
      }
      
      // Ordenação personalizada: Prés primeiro, depois os anos em ordem crescente
      const sortedClasses = [...(data || [])].sort((a, b) => {
        // Função para extrair o "peso" de ordenação de uma turma
        const getOrderWeight = (className: string): number => {
          const nameLower = className.toLowerCase();
          
          // Os Prés têm prioridade máxima
          if (nameLower.includes('pré')) {
            return nameLower.includes('manhã') ? 1 : 2; // Pré Manhã vem antes de Pré Tarde
          }
          
          // Extrair o número do ano (1º, 2º, etc.)
          const yearMatch = className.match(/(\d+)º/);
          if (yearMatch && yearMatch[1]) {
            return 10 + parseInt(yearMatch[1], 10); // 1º ano = 11, 2º ano = 12, etc.
          }
          
          // Se não conseguir determinar, coloca no final
          return 100;
        };
        
        return getOrderWeight(a.name) - getOrderWeight(b.name);
      });
      
      return sortedClasses;
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
      throw error;
    }
  }

  // Métodos para gerenciamento de alunos
  static async addStudent(student: Omit<Student, 'id'>) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const { data: profile } = await supabase
        .from('teachers')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role !== 'teacher') {
        throw new Error('Apenas professores podem gerenciar alunos');
      }

      // Buscar o class_id baseado no nome da classe
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('name', student.className)
        .single();

      if (classError) {
        console.error('Erro ao buscar classe:', classError);
        throw new Error(`Classe "${student.className}" não encontrada`);
      }

      const { data, error } = await supabase
        .from('students')
        .insert([{
          name: student.name,
          class_id: classData.id,
          gender: student.gender,
          narciso_coins: 0,
          pending_tampas: 0,
          pending_latas: 0,
          pending_oleo: 0
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao adicionar aluno:', error);
      throw error;
    }
  }

  static async updateStudent(student: Student) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const { data: profile } = await supabase
        .from('teachers')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role !== 'teacher') {
        throw new Error('Apenas professores podem gerenciar alunos');
      }

      console.log('Atualizando aluno:', {
        id: student.id,
        name: student.name,
        className: student.className,
        gender: student.gender
      });

      // Buscar o class_id baseado no nome da classe
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('name', student.className)
        .single();

      if (classError) {
        console.error('Erro ao buscar classe:', classError);
        throw new Error(`Classe "${student.className}" não encontrada`);
      }

      const { data, error } = await supabase
        .from('students')
        .update({
          name: student.name,
          class_id: classData.id,
          gender: student.gender
        })
        .eq('id', student.id)
        .select()
        .single();

      if (error) {
        console.error('Erro do Supabase ao atualizar aluno:', error);
        throw new Error(`Erro ao atualizar aluno: ${error.message || 'Erro desconhecido'}`);
      }

      if (!data) {
        throw new Error('Nenhum dado retornado após atualização');
      }

      console.log('Aluno atualizado com sucesso:', data);
      return data;
    } catch (error) {
      console.error('Erro ao atualizar aluno:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Erro desconhecido ao atualizar aluno: ${JSON.stringify(error)}`);
      }
    }
  }

  static async deleteStudent(studentId: string) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const { data: profile } = await supabase
        .from('teachers')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role !== 'teacher') {
        throw new Error('Apenas professores podem gerenciar alunos');
      }

      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir aluno:', error);
      throw error;
    }
  }

  static async getStudentWithTotals(studentId: string) {
    try {
      const { data, error } = await supabase
        .from('v_students_effective_values')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao carregar dados do aluno:', error);
      throw error;
    }
  }

  static async getStudentRanking() {
    try {
      const { data, error } = await supabase
        .from('v_student_coin_ranking_with_adjustments')
        .select('*')
        .order('narciso_coins', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar ranking:", error);
      throw error;
    }
  }
  static async registerExchange(
    studentId: string, 
    materialId: MaterialType, 
    quantity: number,
    teacherId: string
  ): Promise<Exchange[]> {
    try {
      console.log(`Registrando troca: Aluno ${studentId}, Material ${materialId}, Quantidade ${quantity}`);
      
      // 1. Buscar informações atuais do aluno para calcular o novo saldo
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (studentError) {
        console.error("Erro ao buscar dados do aluno:", studentError);
        throw studentError;
      }
      
      if (!studentData) {
        throw new Error("Aluno não encontrado");
      }

      // 2. Buscar a taxa de conversão atual para o material do banco de dados
      const conversionRates = await this.getCurrentConversionRates();
      const unitsPerCoin = conversionRates[materialId];
      if (!unitsPerCoin) {
        throw new Error(`Taxa de conversão não definida para o material ${materialId}`);
      }
      
      // 3. Calcular o total pendente após a troca
      let pendingField: string;
      switch(materialId) {
        case MATERIAL_TYPES.LIDS:
          pendingField = 'pending_tampas';
          break;
        case MATERIAL_TYPES.CANS:
          pendingField = 'pending_latas';
          break;
        case MATERIAL_TYPES.OIL:
          pendingField = 'pending_oleo';
          break;
        default:
          throw new Error(`Tipo de material não reconhecido: ${materialId}`);
      }
      
      const currentPending = studentData[pendingField] || 0;
      const totalUnits = currentPending + quantity;
      
      // 4. Calcular moedas completas e novo saldo pendente
      const earnedCoins = Math.floor(totalUnits / unitsPerCoin);
      const newPendingValue = totalUnits % unitsPerCoin;
      
      console.log(`Cálculo de troca: Pendente atual ${currentPending}, Total ${totalUnits}, Moedas ganhas ${earnedCoins}, Novo pendente ${newPendingValue}`);
      
      // 5. Iniciar uma transação para manter a consistência dos dados
      // 5.1 Registrar a troca
      const { data, error } = await supabase
        .from('exchanges')
        .insert([{
          student_id: studentId,
          material_id: materialId,
          quantity: quantity,
          coins_earned: earnedCoins, // Registrar as moedas ganhas nesta troca
          teacher_id: teacherId
        }])
        .select();
        
      if (error) {
        console.error("Erro ao registrar troca:", error);
        throw error;
      }
      
      // 5.2 Atualizar o saldo do aluno (pendentes e moedas)
      if (earnedCoins > 0) {
        const updateData = {
          narciso_coins: studentData.narciso_coins + earnedCoins,
          [pendingField]: newPendingValue,
          updated_at: new Date()
        };
        
        const { error: updateError } = await supabase
          .from('students')
          .update(updateData)
          .eq('id', studentId);
          
        if (updateError) {
          console.error("Erro ao atualizar saldo do aluno:", updateError);
          throw updateError;
        }
        
        console.log(`Saldo do aluno atualizado: +${earnedCoins} moedas, ${pendingField}=${newPendingValue}`);
      } else if (currentPending !== newPendingValue) {
        // Se não ganhou moedas mas o saldo pendente mudou, atualize apenas o pendente
        const { error: updateError } = await supabase
          .from('students')
          .update({
            [pendingField]: newPendingValue,
            updated_at: new Date()
          })
          .eq('id', studentId);
          
        if (updateError) {
          console.error("Erro ao atualizar saldo pendente:", updateError);
          throw updateError;
        }
        
        console.log(`Saldo pendente atualizado: ${pendingField}=${newPendingValue}`);
      }
      
      return data || [];
    } catch (error) {
      console.error("Erro ao registrar troca:", error);
      throw error;
    }
  }  static async getDashboardStats() {
    try {
      // Verificar configuração do Supabase
      const { verifySupabaseConfig } = await import('./supabase');
      verifySupabaseConfig();
      
      console.log("Iniciando requisição de estatísticas...");
      
      const { data: generalStats, error: statsError } = await supabase
        .from('v_general_stats')
        .select('*')
        .single();
      
      console.log("Resposta da view v_general_stats:", { generalStats, statsError });
      
      if (statsError) {
        console.error("Erro na view v_general_stats:", statsError);
        throw statsError;
      }
      
      return {
        generalStats: generalStats || {
          total_tampas: 0,
          total_latas: 0,
          total_oleo: 0,
          total_coins: 0
        }
      };
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      return {
        generalStats: {
          total_tampas: 0,
          total_latas: 0,
          total_oleo: 0,
          total_coins: 0
        },
        currentPeriod: null
      };
    }
  }

  // Novos métodos auxiliares
  static async validateDataIntegrity() {
    const checks = {
      students: false,
      exchanges: false,
      materials: false,
      coins: false
    };

    try {
      // Verificar alunos
      const { count: studentCount } = await supabase
        .from('students')
        .select('count', { count: 'exact' });
      checks.students = studentCount !== null && studentCount > 0;

      // Verificar trocas
      const { count: exchangeCount } = await supabase
        .from('exchanges')
        .select('count', { count: 'exact' });
      checks.exchanges = exchangeCount !== null;

      // Verificar materiais
      const { count: materialCount } = await supabase
        .from('materials')
        .select('count', { count: 'exact' });
      checks.materials = materialCount !== null && materialCount === 3; // tampas, latas, oleo

      return checks;
    } catch (error) {
      console.error('Erro na validação de integridade:', error);
      throw error;
    }
  }

  // Função de diagnóstico para ajudar a depurar problemas de correspondência entre alunos e turmas
  static async diagnoseClassStudentRelationship() {
    try {
      const { data: students, error: studentsError } = await supabase
        .from('v_student_list')
        .select('id, name, class_name')
        .order('name');
      
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');
      
      if (studentsError) throw studentsError;
      if (classesError) throw classesError;
      
      // Verificar quais turmas têm alunos associados
      const classesWithStudents = new Map();
      const orphanedStudents: Array<{id: string, name: string, class_name: string}> = [];
      
      classes?.forEach(cls => {
        classesWithStudents.set(cls.name, {
          id: cls.id,
          count: 0,
          students: []
        });
      });
      
      students?.forEach(student => {
        if (classesWithStudents.has(student.class_name)) {
          const classInfo = classesWithStudents.get(student.class_name);
          classInfo.count++;
          classInfo.students.push({ id: student.id, name: student.name });
        } else {
          orphanedStudents.push({
            id: student.id,
            name: student.name,
            class_name: student.class_name
          });
        }
      });
      
      return {
        classesWithStudents: Object.fromEntries(classesWithStudents),
        orphanedStudents,
        totalClasses: classes?.length || 0,
        totalStudents: students?.length || 0
      };
      
    } catch (error) {
      console.error("Erro ao diagnosticar relacionamento entre alunos e turmas:", error);
      throw error;
    }
  }

  static async getExchangeHistory({
    page = 0,
    limit = 15,
    classFilter,
    studentFilter,
    materialFilter
  }: ExchangeHistoryParams): Promise<ExchangeHistoryResult> {
    try {
      console.log('Buscando histórico de trocas com filtros:', { classFilter, studentFilter, materialFilter });
      
      // Consulta otimizada usando a view v_exchange_history
      let query = supabase
        .from('v_exchange_history')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
      
      // Aplicar filtros
      if (materialFilter && materialFilter !== "all") {
        query = query.eq('material_id', materialFilter);
      }
      
      if (classFilter && classFilter !== "all") {
        query = query.eq('class_name', classFilter);
      }
      
      if (studentFilter && studentFilter.trim() !== "") {
        query = query.ilike('student_name', `%${studentFilter}%`);
      }

      // Aplicar paginação
      const from = page * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Executar a consulta
      const { data: exchanges, error, count } = await query;
      console.log('Resultado da consulta:', { exchanges: exchanges?.length || 0, error, count });

      if (error) {
        console.error("Erro ao buscar histórico de trocas:", error);
        throw error;
      }

      if (!exchanges || exchanges.length === 0) {
        console.log('Nenhum registro encontrado');
        return { data: [], total: 0 };
      }
      
      // Transformar os dados das trocas no formato esperado
      const formattedData: ExchangeHistoryRecord[] = exchanges.map(exchange => {
        // Determinar a data de exibição
        const displayDate = exchange.exchange_date || exchange.created_at;
        
        return {
          id: exchange.id,
          date: new Date(displayDate).toLocaleDateString('pt-BR'),
          dateTimestamp: displayDate, // Manter o timestamp original para ordenação
          dateTimestamp: displayDate, // Manter o timestamp original para ordenação
          material: exchange.material_id,
          quantity: exchange.quantity,
          studentId: exchange.student_id,
          studentName: exchange.student_name || "Aluno desconhecido",
          className: exchange.class_name || "Turma desconhecida",
          teacherId: exchange.teacher_id || '',
          teacherName: exchange.teacher_name || "Sistema"
        };
      });

      console.log('Dados formatados:', formattedData.length);
      return {
        data: formattedData,
        total: count || 0
      };
    } catch (error) {
      console.error("Erro ao buscar histórico de trocas:", error);
      return {
        data: [],
        total: 0
      };
    }
  }
  
  // Método para verificar se a view v_exchange_history existe
  static async checkExchangeHistoryView() {
    try {
      const { data, error } = await supabase
        .from('v_exchange_history')
        .select('id')
        .limit(1);
      
      return { exists: !error, error };
    } catch (error) {
      console.error('Erro ao verificar view de histórico:', error);
      return { exists: false, error };
    }
  }
  
  // Método para atualizar um registro de troca
  static async updateExchange(
    exchangeId: string,
    data: { 
      material_id?: string;
      quantity?: number;
      student_id?: string;
      teacher_id?: string;
    }
  ) {
    try {
      console.log('Atualizando troca:', exchangeId, data);
      const { data: updatedExchange, error } = await supabase
        .from('exchanges')
        .update(data)
        .eq('id', exchangeId)
        .select();
      
      if (error) throw error;
      return updatedExchange;
    } catch (error) {
      console.error('Erro ao atualizar troca:', error);
      throw error;
    }
  }
  
  // Método para excluir um registro de troca com correção de saldo
  static async deleteExchange(exchangeId: string) {
    try {
      console.log('Excluindo troca com correção de saldo:', exchangeId);
      
      // 1. Buscar informações da troca original
      const { data: originalExchange, error: exchangeError } = await supabase
        .from('exchanges')
        .select('*')
        .eq('id', exchangeId)
        .single();
      
      if (exchangeError || !originalExchange) {
        console.error("Erro ao buscar troca para exclusão:", exchangeError);
        throw exchangeError || new Error("Troca não encontrada");
      }
      
      // Obter detalhes da troca original
      const originalStudentId = originalExchange.student_id;
      const originalMaterialId = originalExchange.material_id;
      const originalQuantity = originalExchange.quantity;
      const originalCoinsEarned = originalExchange.coins_earned || 0;
      
      // Antes da exclusão, verificar totais atuais do aluno
      console.log("Buscando totais ANTES da exclusão...");
      const totalsBefore = await this.getStudentMaterialTotals(originalStudentId);
      console.log("Totais ANTES da exclusão:", totalsBefore);
      
      // 2. Buscar informações atuais do aluno incluindo campos relevantes
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', originalStudentId)
        .single();
      
      if (studentError || !studentData) {
        console.error("Erro ao buscar dados do aluno:", studentError);
        throw studentError || new Error("Aluno não encontrado");
      }
      
      // 3. Determinar campos pendentes para o material
      let pendingField: string;
      let totalExchangedField: string;
      
      switch(originalMaterialId) {
        case MATERIAL_TYPES.LIDS:
          pendingField = 'pending_tampas';
          totalExchangedField = 'total_tampas_exchanged';
          break;
        case MATERIAL_TYPES.CANS:
          pendingField = 'pending_latas';
          totalExchangedField = 'total_latas_exchanged';
          break;
        case MATERIAL_TYPES.OIL:
          pendingField = 'pending_oleo';
          totalExchangedField = 'total_oleo_exchanged';
          break;
        default:
          throw new Error(`Tipo de material não reconhecido: ${originalMaterialId}`);
      }
      
      // 4. Verificar se o aluno tem moedas suficientes para reverter
      const currentCoins = studentData.narciso_coins;
      if (currentCoins < originalCoinsEarned) {
        throw new Error(`Não é possível excluir esta troca. O aluno precisaria ter pelo menos ${originalCoinsEarned} moedas para reverter a troca.`);
      }
      
      // 5. Calcular o novo valor de moedas após a exclusão
      const newCoinsValue = currentCoins - originalCoinsEarned;
      
      // 6. Obter o valor pendente atual
      const currentPending = studentData[pendingField] || 0;
      
      console.log(`Exclusão de troca: 
        Material: ${originalMaterialId}
        Quantidade total: ${originalQuantity}
        Moedas ganhas a reverter: ${originalCoinsEarned}
        Moedas antes: ${currentCoins}
        Moedas depois: ${newCoinsValue}
        Pendente antes: ${currentPending}
      `);
      
      // 7. PRIMEIRA ETAPA: Excluir o registro da troca
      // Isso é feito primeiro para que as views atualizem corretamente
      const { error } = await supabase
        .from('exchanges')
        .delete()
        .eq('id', exchangeId);
      
      if (error) {
        console.error("Erro ao excluir registro de troca:", error);
        throw error;
      }
      
      // 8. SEGUNDA ETAPA: Atualizar o saldo do aluno (moedas e outros campos)
      // Obter os dados completos do aluno para fazer uma atualização abrangente
      const { data: completeStudentData } = await supabase
        .from('v_student_material_totals')
        .select('*')
        .eq('student_id', originalStudentId)
        .single();
        
      console.log("Dados completos do aluno da view:", completeStudentData);
      
      // Preparar os campos para atualização, incluindo os totais de materiais
      const updateData = {
        narciso_coins: newCoinsValue,
        // Atualizar também os totais de materiais trocados
        total_tampas_exchanged: completeStudentData?.lids_total || 0,
        total_latas_exchanged: completeStudentData?.cans_total || 0,
        total_oleo_exchanged: completeStudentData?.oil_total || 0,
        total_coins_earned: completeStudentData?.coins_earned || 0,
        updated_at: new Date()
      };
      
      // Log para mostrar o que estamos atualizando
      console.log("Atualizando dados do aluno após exclusão:", updateData);
      
      const { error: updateError } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', originalStudentId);
      
      if (updateError) {
        console.error("Erro ao atualizar saldo do aluno:", updateError);
        throw updateError;
      }
      
      // 9. Buscar valores atuais após a exclusão para comparação
      const { data: updatedStudentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', originalStudentId)
        .single();
        
      // 10. Buscar os totais atualizados das views
      const { data: updatedTotals } = await supabase
        .from('v_student_material_totals')
        .select('*')
        .eq('student_id', originalStudentId)
        .single();
        
      console.log(`Valores após exclusão:
        Moedas atualizadas: ${updatedStudentData?.narciso_coins}
        Totais de materiais da view:`, updatedTotals);
      
      // 11. TERCEIRA ETAPA: Recalcular e corrigir totais após a exclusão
      // Isso é essencial para garantir que todos os campos sejam corretamente atualizados
      try {
        console.log("Executando recálculo completo de totais após exclusão...");
        
        // Primeiro forçamos um recálculo completo dos totais
        const recalculationResult = await this.recalculateStudentTotals(originalStudentId);
        console.log("Recálculo completo realizado:", recalculationResult);
        
        // Em seguida, verificamos e corrigimos quaisquer discrepâncias
        const verificationResult = await this.verifyAndFixMaterialTotals(originalStudentId);
        
        if (verificationResult.fixed) {
          console.log(`Correção adicional aplicada! Diferença de ${verificationResult.difference} moedas.`);
        } else {
          console.log("Totais verificados: Nenhuma correção adicional necessária.");
        }
        
        // 12. Forçar atualização explícita das views relacionadas
        try {
          // Buscar dados da view para forçar atualização
          const { data: viewData } = await supabase
            .from('v_student_list')
            .select('exchange_tampas, exchange_latas, exchange_oleo')
            .eq('id', originalStudentId)
            .single();
            
          console.log("Views atualizadas com sucesso após exclusão:", viewData);
          
          // Verificar valores finais
          const { data: finalTotals } = await supabase
            .from('v_student_material_totals')
            .select('*')
            .eq('student_id', originalStudentId)
            .single();
            
          console.log("Totais finais após forçar atualização de views:", finalTotals);
        } catch (viewError) {
          console.warn("Erro ao atualizar views:", viewError);
        }
        
        // Após todas as operações, verificar novamente os totais
        console.log("Buscando totais DEPOIS da exclusão e verificação...");
        const totalsAfter = await this.getStudentMaterialTotals(originalStudentId);
        console.log("Totais DEPOIS da exclusão:", totalsAfter);
        
        // Comparar os valores para detectar possíveis inconsistências
        const comparacaoTotais = {
          moedas: {
            antes: totalsBefore.student?.narciso_coins,
            depois: totalsAfter.student?.narciso_coins,
            diferenca: (totalsBefore.student?.narciso_coins || 0) - (totalsAfter.student?.narciso_coins || 0)
          },
          materialView: {
            antes: totalsBefore.viewTotals,
            depois: totalsAfter.viewTotals,
          },
          materialCalculado: {
            antes: totalsBefore.calculatedTotals,
            depois: totalsAfter.calculatedTotals,
          }
        };
        
        console.log("Comparação de totais antes/depois:", comparacaoTotais);
        
        return {
          success: true,
          materialTotals: verificationResult.materialTotals,
          newCoinsValue,
          originalExchange,
          comparacaoTotais
        };
      } catch (verificationError) {
        console.error("Erro na verificação de totais, mas a exclusão foi realizada:", verificationError);
        
        try {
          // Mesmo com erro, tentar buscar os totais finais
          const totalsAfter = await this.getStudentMaterialTotals(originalStudentId);
          console.log("Totais após exclusão (com erro na verificação):", totalsAfter);
        } catch (err) {
          console.error("Erro ao buscar totais finais:", err);
        }
        
        // Retornamos sucesso mesmo com erro na verificação, pois a exclusão foi feita
        return {
          success: true,
          warning: "Exclusão realizada, mas verificação de totais falhou",
          newCoinsValue
        };
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir troca com correção de saldo:', error);
      throw error;
    }
  }
  
  // Método para atualizar uma troca com correção de saldo
  static async updateExchangeWithBalanceCorrection(
    exchangeId: string,
    newData: { 
      material_id?: string;
      quantity?: number;
      student_id?: string;
      teacher_id?: string;
    }
  ) {
    try {
      // 1. Buscar informações da troca original
      const { data: originalExchange, error: exchangeError } = await supabase
        .from('exchanges')
        .select('*')
        .eq('id', exchangeId)
        .single();
      
      if (exchangeError || !originalExchange) {
        console.error("Erro ao buscar troca original:", exchangeError);
        throw exchangeError || new Error("Troca não encontrada");
      }
      
      // Obter detalhes da troca original
      const originalStudentId = originalExchange.student_id;
      const originalMaterialId = originalExchange.material_id;
      const originalQuantity = originalExchange.quantity;
      const originalCoinsEarned = originalExchange.coins_earned || 0;
      
      // 2. Buscar informações atuais do aluno
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', originalStudentId)
        .single();
      
      if (studentError || !studentData) {
        console.error("Erro ao buscar dados do aluno:", studentError);
        throw studentError || new Error("Aluno não encontrado");
      }
      
      // 3. Determinar campos pendentes para o material original
      let originalPendingField: string;
      switch(originalMaterialId) {
        case MATERIAL_TYPES.LIDS:
          originalPendingField = 'pending_tampas';
          break;
        case MATERIAL_TYPES.CANS:
          originalPendingField = 'pending_latas';
          break;
        case MATERIAL_TYPES.OIL:
          originalPendingField = 'pending_oleo';
          break;
        default:
          throw new Error(`Tipo de material não reconhecido: ${originalMaterialId}`);
      }
      
      // 4. Buscar as taxas de conversão atuais
      const conversionRates = await this.getCurrentConversionRates();
      
      // 5. Reverter os efeitos da troca original
      // 5.1 Calcular valor pendente original antes da troca
      const currentCoins = studentData.narciso_coins;
      const currentPending = studentData[originalPendingField] || 0;
      
      // Se o aluno não tem moedas suficientes para reverter, não permitir a edição
      if (currentCoins < originalCoinsEarned) {
        throw new Error(`Não é possível editar esta troca. O aluno precisa ter pelo menos ${originalCoinsEarned} moedas para reverter a troca anterior.`);
      }
      
      // 5.2 Calcular novo valor pendente após reverter a troca
      const originalUnitsPerCoin = conversionRates[originalMaterialId as MaterialType];
      // Estimar o valor pendente original antes da troca (isso é uma aproximação)
      const estimatedPendingBeforeOriginalExchange = (currentPending + originalQuantity) % originalUnitsPerCoin;
      
      // 6. Preparar dados para a nova troca
      const newMaterialId = newData.material_id || originalMaterialId;
      const newQuantity = newData.quantity || originalQuantity;
      const newStudentId = newData.student_id || originalStudentId;
      
      // 7. Determinar campos pendentes para o novo material
      let newPendingField: string = originalPendingField; // Padrão: mesmo campo
      if (newMaterialId !== originalMaterialId) {
        switch(newMaterialId) {
          case MATERIAL_TYPES.LIDS:
            newPendingField = 'pending_tampas';
            break;
          case MATERIAL_TYPES.CANS:
            newPendingField = 'pending_latas';
            break;
          case MATERIAL_TYPES.OIL:
            newPendingField = 'pending_oleo';
            break;
          default:
            throw new Error(`Tipo de material não reconhecido: ${newMaterialId}`);
        }
      }
      
      // 8. Calcular efeitos da nova troca
      const newUnitsPerCoin = conversionRates[newMaterialId as MaterialType];
      if (!newUnitsPerCoin) {
        throw new Error(`Taxa de conversão não definida para o material ${newMaterialId}`);
      }
      
      // Se for o mesmo material e mesmo aluno, podemos simplificar o cálculo
      let newCoinsEarned = 0;
      let newPendingValue = 0;
      
      if (newStudentId === originalStudentId && newMaterialId === originalMaterialId) {
        // 8.1 Apenas quantidade diferente para o mesmo material
        const totalUnits = estimatedPendingBeforeOriginalExchange + newQuantity;
        newCoinsEarned = Math.floor(totalUnits / newUnitsPerCoin);
        newPendingValue = totalUnits % newUnitsPerCoin;
      } else if (newStudentId === originalStudentId) {
        // 8.2 Material diferente, mas mesmo aluno
        const newPending = studentData[newPendingField] || 0;
        const totalUnits = newPending + newQuantity;
        newCoinsEarned = Math.floor(totalUnits / newUnitsPerCoin);
        newPendingValue = totalUnits % newUnitsPerCoin;
      } else {
        // 8.3 Aluno diferente (este é um caso mais complexo - precisamos buscar dados do novo aluno)
        const { data: newStudentData, error: newStudentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', newStudentId)
          .single();
        
        if (newStudentError || !newStudentData) {
          console.error("Erro ao buscar dados do novo aluno:", newStudentError);
          throw newStudentError || new Error("Novo aluno não encontrado");
        }
        
        const newStudentPending = newStudentData[newPendingField] || 0;
        const totalUnits = newStudentPending + newQuantity;
        newCoinsEarned = Math.floor(totalUnits / newUnitsPerCoin);
        newPendingValue = totalUnits % newUnitsPerCoin;
      }
      
      console.log(`Atualização de troca: 
        Original: Material ${originalMaterialId}, Quantidade ${originalQuantity}, Moedas ganhas ${originalCoinsEarned}
        Nova: Material ${newMaterialId}, Quantidade ${newQuantity}, Moedas ganhas ${newCoinsEarned}
      `);
      
      // 9. Iniciar atualização dos dados
      // 9.1 Atualizar o registro da troca
      const updateExchangeData = {
        ...newData,
        coins_earned: newCoinsEarned
      };
      
      const { data: updatedExchange, error: updateError } = await supabase
        .from('exchanges')
        .update(updateExchangeData)
        .eq('id', exchangeId)
        .select();
      
      if (updateError) {
        console.error("Erro ao atualizar registro de troca:", updateError);
        throw updateError;
      }
      
      // 9.2 Atualizar o saldo do aluno original (reverter troca original)
      if (newStudentId === originalStudentId && newMaterialId === originalMaterialId) {
        // Se for o mesmo aluno e material, apenas atualizamos a diferença
        const coinsDifference = newCoinsEarned - originalCoinsEarned;
        
        await supabase
          .from('students')
          .update({
            narciso_coins: studentData.narciso_coins + coinsDifference,
            [newPendingField]: newPendingValue,
            updated_at: new Date()
          })
          .eq('id', originalStudentId);
      } else {
        // Caso contrário, revertemos a troca original e aplicamos a nova
        
        // Reverter troca original
        await supabase
          .from('students')
          .update({
            narciso_coins: studentData.narciso_coins - originalCoinsEarned,
            [originalPendingField]: estimatedPendingBeforeOriginalExchange,
            updated_at: new Date()
          })
          .eq('id', originalStudentId);
        
        // Se for um aluno diferente, aplicar nova troca ao novo aluno
        if (newStudentId !== originalStudentId) {
          const { data: newStudentData } = await supabase
            .from('students')
            .select('*')
            .eq('id', newStudentId)
            .single();
          
          await supabase
            .from('students')
            .update({
              narciso_coins: (newStudentData?.narciso_coins || 0) + newCoinsEarned,
              [newPendingField]: newPendingValue,
              updated_at: new Date()
            })
            .eq('id', newStudentId);
        } else {
          // Aplicar nova troca ao mesmo aluno, mas material diferente
          await supabase
            .from('students')
            .update({
              narciso_coins: studentData.narciso_coins - originalCoinsEarned + newCoinsEarned,
              [newPendingField]: newPendingValue,
              updated_at: new Date()
            })
            .eq('id', originalStudentId);
        }
      }
      
      return updatedExchange;
    } catch (error) {
      console.error('Erro ao atualizar troca com correção de saldo:', error);
      throw error;
    }
  }
  
  // Método para obter as taxas de conversão atuais
  static async getCurrentConversionRates(): Promise<Record<MaterialType, number>> {
    try {
      // Verificar se há um cache válido
      const now = Date.now();
      if (conversionRatesCache && (now - lastCacheUpdate < CACHE_TTL)) {
        console.log("Usando taxas de conversão do cache");
        return conversionRatesCache;
      }
      
      console.log("Buscando taxas de conversão do banco de dados");
      const { data, error } = await supabase
        .from('material_conversion_rates')
        .select('material_id, units_per_coin')
        .is('effective_until', null); // Buscar apenas taxas atualmente válidas
      
      if (error) {
        console.error("Erro ao buscar taxas de conversão:", error);
        // Fallback para valores padrão em caso de erro
        return DEFAULT_CONVERSION_RATES;
      }
      
      if (!data || data.length === 0) {
        console.warn("Nenhuma taxa de conversão encontrada, usando valores padrão");
        return DEFAULT_CONVERSION_RATES;
      }
      
      // Converter dados do banco para o formato esperado
      const rates: Record<MaterialType, number> = { ...DEFAULT_CONVERSION_RATES };
      
      data.forEach((rate) => {
        const materialId = rate.material_id as MaterialType;
        if (Object.values(MATERIAL_TYPES).includes(materialId)) {
          rates[materialId] = rate.units_per_coin;
        }
      });
      
      // Atualizar o cache
      conversionRatesCache = rates;
      lastCacheUpdate = now;
      
      console.log("Taxas de conversão atualizadas:", rates);
      return rates;
    } catch (error) {
      console.error("Erro ao processar taxas de conversão:", error);
      return DEFAULT_CONVERSION_RATES;
    }
  }

  // Método para verificar se existem triggers no banco que possam interferir nas operações
  // Simplificado para não fazer chamadas desnecessárias ao Supabase
  static async checkDatabaseTriggers() {
    // Retorna diretamente um resultado padrão sem consultar o banco
    // Este método foi simplificado para evitar erros 404 no Supabase
    return {
      hasTriggers: false,
      triggers: [],
      message: "Verificação de triggers desativada para evitar erros."
    };
  }

  // Método para verificar e corrigir totais de materiais e moedas
  static async verifyAndFixMaterialTotals(studentId: string) {
    try {
      console.log('Verificando e corrigindo totais para o aluno:', studentId);
      
      // 1. Buscar informações atuais do aluno
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*, total_earned:narciso_coins')
        .eq('id', studentId)
        .single();
      
      if (studentError || !studentData) {
        throw studentError || new Error("Aluno não encontrado");
      }
      
      // 2. Buscar totais de trocas para o aluno diretamente da tabela exchanges
      const { data: exchanges, error: exchangesError } = await supabase
        .from('exchanges')
        .select('material_id, quantity, coins_earned')
        .eq('student_id', studentId);
      
      if (exchangesError) {
        throw exchangesError;
      }
      
      // 3. Calcular os totais corretos
      let totalCoinsEarned = 0;
      const materialTotals = {
        [MATERIAL_TYPES.LIDS]: 0,
        [MATERIAL_TYPES.CANS]: 0,
        [MATERIAL_TYPES.OIL]: 0
      };
      
      exchanges?.forEach(exchange => {
        totalCoinsEarned += (exchange.coins_earned || 0);
        
        if (exchange.material_id in materialTotals) {
          materialTotals[exchange.material_id as MaterialType] += exchange.quantity;
        }
      });
      
      // Obter dados de campos específicos para pendentes
      const pendingTampas = studentData.pending_tampas || 0;
      const pendingLatas = studentData.pending_latas || 0;
      const pendingOleo = studentData.pending_oleo || 0;
      
      console.log(`Totais calculados para o aluno ${studentData.name}:
        Moedas ganhas: ${totalCoinsEarned}
        Tampas: ${materialTotals[MATERIAL_TYPES.LIDS]}
        Latas: ${materialTotals[MATERIAL_TYPES.CANS]}
        Óleo: ${materialTotals[MATERIAL_TYPES.OIL]}
        
        Valores no banco:
        Moedas: ${studentData.narciso_coins}
        Total Tampas Pendentes: ${pendingTampas}
        Total Latas Pendentes: ${pendingLatas}
        Total Óleo Pendente: ${pendingOleo}
      `);
      
      // 4. Verificar se há discrepância nos valores
      const moedaDiscrepancy = totalCoinsEarned !== studentData.narciso_coins;
      
      // Se houver discrepância, atualizar todos os valores relevantes
      if (moedaDiscrepancy) {
        console.log(`Correção necessária: Moedas ganhas ${totalCoinsEarned} ≠ Moedas no banco ${studentData.narciso_coins}`);
        
        // Preparar objeto de atualização
        const updateData: any = {
          narciso_coins: totalCoinsEarned,
          updated_at: new Date()
        };
        
        // 5. Corrigir todos os valores no banco
        // Atualizar também os totais de materiais trocados com base nos valores calculados
        updateData.total_tampas_exchanged = materialTotals[MATERIAL_TYPES.LIDS];
        updateData.total_latas_exchanged = materialTotals[MATERIAL_TYPES.CANS];
        updateData.total_oleo_exchanged = materialTotals[MATERIAL_TYPES.OIL];
        updateData.total_coins_earned = totalCoinsEarned;
        
        console.log("Atualizando dados do aluno com correção abrangente:", updateData);
        
        const { error: updateError } = await supabase
          .from('students')
          .update(updateData)
          .eq('id', studentId);
        
        if (updateError) {
          console.error("Erro ao corrigir valores do aluno:", updateError);
          throw updateError;
        }
        
        // 6. Forçar atualização das views que calculam totais
        try {
          // Podemos tentar executar uma consulta para forçar a atualização das views
          await supabase.from('v_student_material_totals')
            .select('*')
            .eq('student_id', studentId)
            .limit(1);
            
          console.log("Views de totais atualizadas com sucesso");
        } catch (viewError) {
          console.warn("Não foi possível forçar atualização das views:", viewError);
        }
        
        return {
          fixed: true,
          previousCoins: studentData.narciso_coins,
          correctedCoins: totalCoinsEarned,
          difference: totalCoinsEarned - studentData.narciso_coins,
          materialTotals
        };
      }
      
      return {
        fixed: false,
        message: "Os totais já estão corretos, nenhuma correção necessária.",
        materialTotals
      };
      
    } catch (error) {
      console.error('Erro ao verificar e corrigir totais:', error);
      throw error;
    }
  }

  // Método para obter totais de materiais e moedas diretamente do banco
  static async getStudentMaterialTotals(studentId: string) {
    try {
      console.log("Buscando totais de materiais para o aluno:", studentId);
      
      // Buscar dados do aluno
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('name, narciso_coins, pending_tampas, pending_latas, pending_oleo')
        .eq('id', studentId)
        .single();
        
      if (studentError) {
        throw studentError;
      }
      
      // Buscar totais da view v_student_material_totals
      const { data: materialTotals, error: totalsError } = await supabase
        .from('v_student_material_totals')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();
        
      // Buscar totais de exchanges diretamente
      const { data: tampasCount, error: tampasError } = await supabase
        .from('exchanges')
        .select('quantity')
        .eq('student_id', studentId)
        .eq('material_id', MATERIAL_TYPES.LIDS);
        
      const { data: latasCount, error: latasError } = await supabase
        .from('exchanges')
        .select('quantity')
        .eq('student_id', studentId)
        .eq('material_id', MATERIAL_TYPES.CANS);
        
      const { data: oleoCount, error: oleoError } = await supabase
        .from('exchanges')
        .select('quantity')
        .eq('student_id', studentId)
        .eq('material_id', MATERIAL_TYPES.OIL);
        
      // Calcular totais de cada material
      const tampasTotal = tampasCount?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
      const latasTotal = latasCount?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
      const oleoTotal = oleoCount?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
      
      return {
        student: studentData,
        viewTotals: materialTotals,
        calculatedTotals: {
          lids: tampasTotal,
          cans: latasTotal,
          oil: oleoTotal
        }
      };
    } catch (error) {
      console.error("Erro ao buscar totais de materiais:", error);
      throw error;
    }
  }

  // Método para garantir que os totais sejam recalculados corretamente após operações
  static async recalculateStudentTotals(studentId: string) {
    try {
      console.log("Forçando recálculo de totais para o aluno:", studentId);
      
      // 1. Buscar todos os registros de troca do aluno
      const { data: exchanges, error: exchangesError } = await supabase
        .from('exchanges')
        .select('material_id, quantity, coins_earned')
        .eq('student_id', studentId);
      
      if (exchangesError) {
        console.error("Erro ao buscar trocas para recálculo:", exchangesError);
        throw exchangesError;
      }
      
      // 2. Calcular totais por material
      const materialTotals = {
        [MATERIAL_TYPES.LIDS]: 0,
        [MATERIAL_TYPES.CANS]: 0,
        [MATERIAL_TYPES.OIL]: 0
      };
      
      let totalCoinsEarned = 0;
      
      exchanges?.forEach(exchange => {
        const material = exchange.material_id as MaterialType;
        if (material in materialTotals) {
          materialTotals[material] += exchange.quantity;
        }
        totalCoinsEarned += exchange.coins_earned || 0;
      });
      
      // 3. Atualizar os campos do aluno com os valores calculados
      const updateData = {
        narciso_coins: totalCoinsEarned,
        total_tampas_exchanged: materialTotals[MATERIAL_TYPES.LIDS],
        total_latas_exchanged: materialTotals[MATERIAL_TYPES.CANS], 
        total_oleo_exchanged: materialTotals[MATERIAL_TYPES.OIL],
        total_coins_earned: totalCoinsEarned,
        updated_at: new Date()
      };
      
      console.log("Atualizando totais do aluno com valores recalculados:", updateData);
      
      const { error: updateError } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', studentId);
      
      if (updateError) {
        console.error("Erro ao atualizar totais recalculados:", updateError);
        throw updateError;
      }
      
      return {
        success: true,
        materialTotals,
        totalCoinsEarned
      };
    } catch (error) {
      console.error("Erro no recálculo de totais:", error);
      throw error;
    }
  }

  // =====================================================
  // GERENCIAMENTO DE FOTOS DOS ALUNOS
  // =====================================================

  /**
   * Faz upload de uma foto de perfil para um aluno
   * @param file - Arquivo de imagem a ser enviado
   * @param studentId - ID do aluno
   * @param studentName - Nome do aluno (para nomenclatura do arquivo)
   * @param className - Nome da turma (para organização em pastas)
   * @returns URL pública da imagem uploaded
   */
  static async uploadStudentPhoto(
    file: File,
    studentId: string,
    studentName: string,
    className: string
  ): Promise<string> {
    try {
      // Validar permissões - apenas professores podem fazer upload
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const { data: profile } = await supabase
        .from('teachers')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role !== 'teacher') {
        throw new Error('Apenas professores podem fazer upload de fotos');
      }

      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não permitido. Use apenas JPG, PNG ou WebP');
      }

      // Validar tamanho máximo (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB em bytes
      if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 5MB');
      }

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const sanitizedName = studentName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${studentId}-${sanitizedName}-${timestamp}.${fileExtension}`;

      // Criar estrutura de pastas por turma
      const sanitizedClassName = className
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      const filePath = `${sanitizedClassName}/${fileName}`;

      // Fazer upload para o bucket student-photos
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw new Error(`Erro ao fazer upload da imagem: ${uploadError.message}`);
      }

      // Obter URL pública da imagem
      const { data: publicUrlData } = supabase.storage
        .from('student-photos')
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Erro ao obter URL pública da imagem');
      }

      console.log('Upload de foto concluído com sucesso:', {
        studentId,
        filePath,
        publicUrl: publicUrlData.publicUrl
      });

      return publicUrlData.publicUrl;

    } catch (error) {
      console.error('Erro ao fazer upload da foto do aluno:', error);
      throw error;
    }
  }

  /**
   * Obtém a URL da foto de um aluno
   * @param studentId - ID do aluno
   * @returns URL da foto ou null se não houver foto
   */
  static async getStudentPhotoUrl(studentId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('photo_url')
        .eq('id', studentId)
        .single();

      if (error) {
        console.error('Erro ao buscar URL da foto:', error);
        return null;
      }

      return data?.photo_url || null;
    } catch (error) {
      console.error('Erro ao obter URL da foto do aluno:', error);
      return null;
    }
  }

  /**
   * Remove a foto de um aluno do storage e limpa o campo photo_url
   * @param studentId - ID do aluno
   * @returns true se removido com sucesso
   */
  static async deleteStudentPhoto(studentId: string): Promise<boolean> {
    try {
      // Validar permissões - apenas professores podem remover fotos
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const { data: profile } = await supabase
        .from('teachers')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role !== 'teacher') {
        throw new Error('Apenas professores podem remover fotos');
      }

      // Buscar a URL atual da foto
      const currentPhotoUrl = await this.getStudentPhotoUrl(studentId);
      
      if (!currentPhotoUrl) {
        console.log('Aluno não possui foto para remover');
        return true;
      }

      // Extrair o caminho do arquivo da URL
      const bucketUrl = supabase.storage.from('student-photos').getPublicUrl('').data.publicUrl;
      const filePath = currentPhotoUrl.replace(bucketUrl, '').replace(/^\//, '');

      // Remover arquivo do storage
      const { error: deleteError } = await supabase.storage
        .from('student-photos')
        .remove([filePath]);

      if (deleteError) {
        console.error('Erro ao remover arquivo do storage:', deleteError);
        // Não bloquear a operação se não conseguir remover o arquivo
      }

      // Limpar campo photo_url no banco
      const { error: updateError } = await supabase
        .from('students')
        .update({ photo_url: null })
        .eq('id', studentId);

      if (updateError) {
        console.error('Erro ao limpar photo_url no banco:', updateError);
        throw updateError;
      }

      console.log('Foto removida com sucesso:', { studentId, filePath });
      return true;

    } catch (error) {
      console.error('Erro ao remover foto do aluno:', error);
      throw error;
    }
  }

  /**
   * Atualiza a foto de um aluno (remove a anterior e adiciona a nova)
   * @param file - Novo arquivo de imagem
   * @param studentId - ID do aluno
   * @param studentName - Nome do aluno
   * @param className - Nome da turma
   * @returns URL pública da nova imagem
   */
  static async updateStudentPhoto(
    file: File,
    studentId: string,
    studentName: string,
    className: string
  ): Promise<string> {
    try {
      // Operação atômica: remover foto antiga e adicionar nova
      console.log('Iniciando atualização de foto do aluno:', studentId);

      // Primeiro, remover a foto antiga (se existir)
      try {
        await this.deleteStudentPhoto(studentId);
        console.log('Foto anterior removida com sucesso');
      } catch (error) {
        console.warn('Erro ao remover foto anterior (pode não existir):', error);
        // Continuar com o upload da nova foto
      }

      // Fazer upload da nova foto
      const newPhotoUrl = await this.uploadStudentPhoto(file, studentId, studentName, className);

      // Atualizar campo photo_url no banco
      const { error: updateError } = await supabase
        .from('students')
        .update({ photo_url: newPhotoUrl })
        .eq('id', studentId);

      if (updateError) {
        console.error('Erro ao atualizar photo_url no banco:', updateError);
        
        // Rollback: tentar remover a imagem que acabou de ser uploaded
        try {
          const bucketUrl = supabase.storage.from('student-photos').getPublicUrl('').data.publicUrl;
          const filePath = newPhotoUrl.replace(bucketUrl, '').replace(/^\//, '');
          await supabase.storage.from('student-photos').remove([filePath]);
        } catch (rollbackError) {
          console.error('Erro no rollback:', rollbackError);
        }
        
        throw updateError;
      }

      console.log('Foto atualizada com sucesso:', { studentId, newPhotoUrl });
      return newPhotoUrl;

    } catch (error) {
      console.error('Erro ao atualizar foto do aluno:', error);
      throw error;
    }
  }

  // MÉTODOS DE VENDAS

  /**
   * Cria uma nova venda, descontando moedas do saldo do aluno
   */
  static async createSale(sale: Sale): Promise<void> {
    try {
      const { error } = await supabase
        .from('sales')
        .insert([sale]);
        
      if (error) {
        console.error('Erro ao criar venda:', error);
        throw error;
      }

      console.log('Venda criada com sucesso:', sale);
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      throw error;
    }
  }

  /**
   * Busca o histórico de vendas com informações dos alunos e professores
   */
  static async getSalesHistory(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          coins_spent,
          item_description,
          sale_date,
          created_at,
          students(name),
          teachers(name)
        `)
        .order('sale_date', { ascending: false });
        
      if (error) {
        console.error('Erro ao buscar histórico de vendas:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar histórico de vendas:', error);
      throw error;
    }
  }

  /**
   * Busca vendas de um aluno específico
   */
  static async getStudentSales(studentId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          coins_spent,
          item_description,
          sale_date,
          created_at,
          teachers(name)
        `)
        .eq('student_id', studentId)
        .order('sale_date', { ascending: false });
        
      if (error) {
        console.error('Erro ao buscar vendas do aluno:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar vendas do aluno:', error);
      throw error;
    }
  }
}
