"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Student, Class, MaterialType, GenderType } from '@/lib/constants';
import { MOCK_CLASSES, MATERIAL_TYPES, MATERIAL_UNITS_PER_COIN } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { DataService } from '@/lib/dataService';

// Removendo logs desnecessários de debug para melhorar o desempenho

interface AuthContextType {
  isAuthenticated: boolean;
  teacherName: string | null | undefined; // undefined para estado de carregamento inicial
  students: Student[];
  classes: Class[];
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  addStudent: (studentData: Omit<Student, 'id' | 'narcisoCoins' | 'contributions' | 'pendingContributions'>) => void;
  updateStudent: (studentData: Partial<Omit<Student, 'id' | 'narcisoCoins' | 'contributions' | 'pendingContributions'>> & { id: string; gender?: GenderType }) => void;
  deleteStudent: (studentId: string) => void;
  addContribution: (studentId: string, material: MaterialType, quantity: number) => void;
  getOverallStats: () => { totalLids: number; totalCans: number; totalOil: number; totalCoins: number };
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [teacherName, setTeacherName] = useState<string | null | undefined>(undefined);
  const [students, setStudents] = useState<Student[]>([]);
  const classes = MOCK_CLASSES;
  const router = useRouter();
  const { toast } = useToast();

  // Carregar dados de autenticação e estudantes ao inicializar
  useEffect(() => {
    try {
      const authData = DataService.getAuthData();
      setIsAuthenticated(authData.isAuthenticated || false);
      setTeacherName(authData.teacherName || null);
      
      const loadedStudents = DataService.getStudents();
      setStudents(loadedStudents);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setIsAuthenticated(false);
      setTeacherName(null);
    }
  }, []);
  const login = async (email: string, pass: string) => {
    if (!email || !pass) {
      toast({
        variant: "destructive",
        title: "Campos Obrigatórios",
        description: "Por favor, preencha o email e a senha.",
      });
      throw new Error("Email e senha são obrigatórios.");
    }

    try {
      // Usar o método login do DataService
      const { isAuthenticated: authSuccess, teacherName: currentTeacherName } = await DataService.login(email, pass);
      
      setIsAuthenticated(authSuccess);
      setTeacherName(currentTeacherName);
      
      toast({
        title: "Login Bem-sucedido! (Mock)",
        description: `Bem-vindo(a) de volta, ${currentTeacherName}!`,
      });
      
      router.push('/dashboard');
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      toast({
        variant: "destructive",
        title: "Erro no Login",
        description: "Não foi possível fazer login. Tente novamente.",
      });
    }
  };
  
  const logout = async () => {
    try {
      await DataService.logout();
      setIsAuthenticated(false);
      setTeacherName(null);
      router.push('/login');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const addStudent = useCallback((studentData: Omit<Student, 'id' | 'narcisoCoins' | 'contributions' | 'pendingContributions'>) => {
    setStudents(prevStudents => {
      const newStudent: Student = {
        ...studentData,
        id: `s${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        contributions: { [MATERIAL_TYPES.LIDS]: 0, [MATERIAL_TYPES.CANS]: 0, [MATERIAL_TYPES.OIL]: 0 },
        pendingContributions: { [MATERIAL_TYPES.LIDS]: 0, [MATERIAL_TYPES.CANS]: 0, [MATERIAL_TYPES.OIL]: 0 },
        narcisoCoins: 0,
      };
      const updatedStudents = [...prevStudents, newStudent];
      DataService.setStudents(updatedStudents);
      return updatedStudents;
    });
  }, []);

  const updateStudent = useCallback((studentData: Partial<Omit<Student, 'id' | 'narcisoCoins' | 'contributions' | 'pendingContributions'>> & { id: string; gender?: GenderType }) => {
    setStudents(prevStudents => {
      const updatedStudents = prevStudents.map(s =>
        s.id === studentData.id ? { ...s, ...studentData } : s
      );
      DataService.setStudents(updatedStudents);
      return updatedStudents;
    });
  }, []);

  const deleteStudent = useCallback((studentId: string) => {
    setStudents(prevStudents => {
      const updatedStudents = prevStudents.filter(s => s.id !== studentId);
      DataService.setStudents(updatedStudents);
      return updatedStudents;
    });
  }, []);

  const addContribution = useCallback((studentId: string, material: MaterialType, quantityAdded: number) => {
    setStudents(prevStudents => {
      const studentIndex = prevStudents.findIndex(s => s.id === studentId);
      if (studentIndex === -1) return prevStudents;

      const studentBefore = { ...prevStudents[studentIndex] };
      studentBefore.pendingContributions = studentBefore.pendingContributions || { tampas: 0, latas: 0, oleo: 0 };
      studentBefore.contributions = studentBefore.contributions || { tampas: 0, latas: 0, oleo: 0 };
      studentBefore.narcisoCoins = studentBefore.narcisoCoins || 0;

      const unitsPerCoin = MATERIAL_UNITS_PER_COIN[material];
      if (!unitsPerCoin || unitsPerCoin <= 0) return prevStudents; 

      const materialPendingBefore = studentBefore.pendingContributions?.[material] || 0;
      const totalHistoricalContributionsBefore = studentBefore.contributions?.[material] || 0;
      const totalCoinsBefore = studentBefore.narcisoCoins || 0;

      const currentTotalMaterialPending = materialPendingBefore + quantityAdded;
      const newCoinsEarnedThisTransaction = Math.floor(currentTotalMaterialPending / unitsPerCoin);
      const materialPendingAfter = currentTotalMaterialPending % unitsPerCoin;

      const studentAfter: Student = {
        ...studentBefore,
        contributions: {
          ...(studentBefore.contributions),
          [material]: totalHistoricalContributionsBefore + quantityAdded,
        },
        pendingContributions: {
          ...(studentBefore.pendingContributions),
          [material]: materialPendingAfter,
        },
        narcisoCoins: totalCoinsBefore + newCoinsEarnedThisTransaction,
      };      const updatedStudents = [...prevStudents];
      updatedStudents[studentIndex] = studentAfter;
      
      // Removido o console.log de contribuição para melhorar o desempenhoDataService.saveStudents(updatedStudents);
      return updatedStudents;
    });
  }, [teacherName]);

  // Otimizado com useMemo para calcular os totais apenas quando students muda
  const overallStats = useMemo(() => {
    // Usando reduce em vez de forEach para melhorar performance
    const { lids, cans, oil, coins } = students.reduce((acc, student) => {
      return {
        lids: acc.lids + (student.contributions?.[MATERIAL_TYPES.LIDS] || 0),
        cans: acc.cans + (student.contributions?.[MATERIAL_TYPES.CANS] || 0),
        oil: acc.oil + (student.contributions?.[MATERIAL_TYPES.OIL] || 0),
        coins: acc.coins + (student.narcisoCoins || 0)
      };
    }, { lids: 0, cans: 0, oil: 0, coins: 0 });
    
    return { totalLids: lids, totalCans: cans, totalOil: oil, totalCoins: coins };
  }, [students]);
  
  // Retorna os dados pré-calculados para evitar recálculos
  const getOverallStats = useCallback(() => {
    return overallStats;
  }, [overallStats]);

  // console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: context value (Mock Auth Version)", {isAuthenticated, teacherName, studentsCount: students.length});

  return (
    <AuthContext.Provider value={{ isAuthenticated, teacherName, students, classes, login, logout, addStudent, updateStudent, deleteStudent, addContribution, getOverallStats }}>
      {children}
    </AuthContext.Provider>
  );
};
