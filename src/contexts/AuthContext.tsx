"use client";

import { type ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Student, Class, MaterialType, GenderType, UserRole, TeacherProfile } from '@/lib/constants';
import { MOCK_CLASSES, MATERIAL_TYPES } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { DataService } from '@/lib/dataService';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, getCurrentUser, getTeacherProfile } from '@/lib/supabase';

interface Stats {
  totalLids: number;
  totalCans: number;
  totalOil: number;
  totalCoins: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  teacherName: string | null | undefined;
  userRole: UserRole | null | undefined; // Novo campo para role
  students: Student[];
  classes: Class[];
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  addStudent: (studentData: Omit<Student, 'id' | 'narcisoCoins' | 'exchanges' | 'pendingExchanges'>) => void;
  updateStudent: (studentData: Partial<Omit<Student, 'id' | 'narcisoCoins' | 'exchanges' | 'pendingExchanges'>> & { id: string; gender?: GenderType }) => void;
  deleteStudent: (studentId: string) => void;
  registerExchange: (studentId: string, material: MaterialType, quantity: number) => Promise<boolean>;
  getOverallStats: () => Stats;
  refreshStudents: () => Promise<void>; // Nova função para atualizar dados dos estudantes
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [teacherName, setTeacherName] = useState<string | null | undefined>(undefined);
  const [userRole, setUserRole] = useState<UserRole | null | undefined>(undefined);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>(MOCK_CLASSES); // Inicializar com mock, mas depois atualizar com dados reais
  const router = useRouter();
  const { toast } = useToast();
  // Função para inicializar os dados do sistema
  const initializeData = async () => {
    try {
      const [studentsData, classesData] = await Promise.all([
        DataService.getStudents(),
        DataService.getClasses()
      ]);

      setStudents(studentsData);
      
      // Se houver classes no banco de dados, use-as em vez das mockadas
      if (classesData && classesData.length > 0) {
        setClasses(classesData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      toast({
        variant: "destructive",
        title: "Erro ao Carregar Dados",
        description: "Não foi possível carregar os dados do sistema."
      });
    }
  };

  // Carregar dados de autenticação e estudantes ao inicializar
  useEffect(() => {
    const checkAuth = async () => {
      console.log("🔍 Iniciando verificação de autenticação...");
      
      try {
        console.log("🔍 Chamando getCurrentUser()...");
        const user = await getCurrentUser();
        console.log("🔍 getCurrentUser() resultado:", user ? "usuário encontrado" : "nenhum usuário");
        
        if (user) {
          console.log("🔍 Chamando getTeacherProfile()...");
          const profile = await getTeacherProfile();
          console.log("🔍 getTeacherProfile() resultado:", profile ? "perfil encontrado" : "perfil não encontrado");
          
          if (!profile) {
            console.log("❌ Perfil não encontrado, fazendo logout...");
            toast({
              variant: "destructive",
              title: "Erro de Configuração da Conta",
              description: "Usuário sem perfil configurado."
            });
            await supabase.auth.signOut();
            setTeacherName(null);
            setUserRole(null);
            return;
          }

          const teacherNameValue = profile.name || user.email?.split('@')[0] || "Professor(a)";
          const userRoleValue = profile.role || 'teacher'; // Default para teacher se não especificado
          console.log("✅ Autenticação bem-sucedida, definindo teacherName:", teacherNameValue, "role:", userRoleValue);
          
          setIsAuthenticated(true);
          setTeacherName(teacherNameValue);
          setUserRole(userRoleValue);
          
          console.log("🔍 Inicializando dados...");
          await initializeData();
        } else {
          console.log("❌ Nenhum usuário encontrado, definindo teacherName como null");
          setTeacherName(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("❌ Erro ao verificar autenticação:", error);
        setIsAuthenticated(false);
        setTeacherName(null);
        setUserRole(null);
        router.push('/sistema');
      }
    };

    checkAuth();
  }, [router, toast]);

  // Configurar atualizações em tempo real
  useEffect(() => {
    let channels: RealtimeChannel[] = [];

    if (isAuthenticated) {
      // Canal para trocas
      const exchangesChannel = supabase
        .channel('exchanges')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'exchanges' },
          () => {
            console.log('Mudança detectada em exchanges');
            initializeData();
          }
        )
        .subscribe();

      // Canal para ajustes
      const adjustmentsChannel = supabase
        .channel('adjustments')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'student_adjustments' },
          () => {
            console.log('Mudança detectada em ajustes');
            initializeData();
          }
        )
        .subscribe();

      channels = [exchangesChannel, adjustmentsChannel];
    }

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [isAuthenticated]);

  const login = async (email: string, pass: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) throw error;

      const user = await getCurrentUser();
      if (!user) throw new Error("Usuário não encontrado após login");

      const profile = await getTeacherProfile();
      if (!profile) throw new Error("Perfil de professor não encontrado");

      setIsAuthenticated(true);
      setTeacherName(profile.name || user.email?.split('@')[0] || "Professor(a)");
      setUserRole(profile.role || 'teacher');
      router.push('/dashboard');

    } catch (error: any) {
      console.error("Erro no login:", error);
      toast({
        variant: "destructive",
        title: "Erro no Login",
        description: error.message || "Falha ao fazer login",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setTeacherName(null);
      setUserRole(null);
      router.push('/sistema');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const addStudent = useCallback(async (studentData: Omit<Student, 'id' | 'narcisoCoins' | 'exchanges' | 'pendingExchanges'>) => {
    try {
      // Adicionar campos obrigatórios com valores padrão
      const fullStudentData: Omit<Student, 'id'> = {
        ...studentData,
        narcisoCoins: 0,
        exchanges: {
          tampas: 0,
          latas: 0,
          oleo: 0
        },
        pendingExchanges: {
          tampas: 0,
          latas: 0,
          oleo: 0
        }
      };
      
      // Usar o DataService para adicionar aluno
      const newStudent = await DataService.addStudent(fullStudentData);
      
      // Atualizar estado local dos estudantes
      const updatedStudents = await DataService.getStudents();
      setStudents(updatedStudents);
      
      return newStudent;
    } catch (error) {
      console.error("Erro ao adicionar aluno:", error);
      throw error;
    }
  }, []);

  const updateStudent = useCallback(async (studentData: Partial<Omit<Student, 'id' | 'narcisoCoins' | 'exchanges' | 'pendingExchanges'>> & { id: string }) => {
    try {
      console.log('AuthContext: Iniciando atualização de aluno:', studentData);
      
      // Usar o DataService para atualizar aluno
      const updatedStudent = await DataService.updateStudent(studentData as Student);
      
      console.log('AuthContext: Aluno atualizado com sucesso:', updatedStudent);
      
      // Atualizar estado local dos estudantes
      const updatedStudents = await DataService.getStudents();
      setStudents(updatedStudents);
      
      return updatedStudent;
    } catch (error) {
      console.error("AuthContext: Erro ao atualizar aluno:", error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Erro desconhecido: ${JSON.stringify(error)}`);
      }
    }
  }, []);

  const deleteStudent = useCallback(async (studentId: string) => {
    try {
      // Usar o DataService para deletar aluno
      await DataService.deleteStudent(studentId);
      
      // Atualizar estado local dos estudantes
      const updatedStudents = await DataService.getStudents();
      setStudents(updatedStudents);
      
    } catch (error) {
      console.error("Erro ao deletar aluno:", error);
      throw error;
    }
  }, []);
  // Método addExchange foi removido por ser redundante com registerExchange

  const registerExchange = useCallback(async (studentId: string, material: MaterialType, quantity: number) => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Usar o DataService para registrar a troca
      await DataService.registerExchange(studentId, material, quantity, user.id);

      // Atualizar estado local dos estudantes
      const updatedStudents = await DataService.getStudents();
      setStudents(updatedStudents);

      return true;
    } catch (error) {
      console.error("Erro ao registrar troca:", error);
      throw error;
    }
  }, []);

  // Função para atualizar dados dos estudantes
  const refreshStudents = useCallback(async () => {
    try {
      const updatedStudents = await DataService.getStudents();
      setStudents(updatedStudents);
    } catch (error) {
      console.error("Erro ao atualizar dados dos estudantes:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Atualizar Dados",
        description: "Não foi possível atualizar os dados dos estudantes."
      });
    }
  }, [toast]);

  // Cálculo otimizado dos totais
  const overallStats = useMemo((): Stats => {
    const initial: Stats = {
      totalLids: 0,
      totalCans: 0,
      totalOil: 0,
      totalCoins: 0
    };

    if (!Array.isArray(students)) return initial;
    
    return students.reduce((acc, student) => ({
      totalLids: acc.totalLids + (student?.exchanges?.[MATERIAL_TYPES.LIDS] || 0),
      totalCans: acc.totalCans + (student?.exchanges?.[MATERIAL_TYPES.CANS] || 0),
      totalOil: acc.totalOil + (student?.exchanges?.[MATERIAL_TYPES.OIL] || 0),
      totalCoins: acc.totalCoins + (student?.narcisoCoins || 0)
    }), initial);
  }, [students]);

  const getOverallStats = useCallback((): Stats => overallStats, [overallStats]);
  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        teacherName,
        userRole, 
        students, 
        classes, 
        login, 
        logout, 
        addStudent, 
        updateStudent, 
        deleteStudent,
        registerExchange,
        getOverallStats,
        refreshStudents
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
