
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Student, Class, MaterialType, GenderType } from '@/lib/constants';
import { MOCK_CLASSES, generateInitialStudents, MATERIAL_TYPES, MATERIAL_UNITS_PER_COIN } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";

console.log("DEBUG: src/contexts/AuthContext.tsx - FILE PARSED (Mock Auth Version)");

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

const AUTH_STORAGE_KEY = 'moedasNarcisoAuth';
const STUDENTS_STORAGE_KEY = 'moedasNarcisoStudents';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider rendering (Mock Auth Version)");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [teacherName, setTeacherName] = useState<string | null | undefined>(undefined);
  const [students, setStudents] = useState<Student[]>([]);
  const classes = MOCK_CLASSES;
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: useEffect for localStorage (Mock Auth Version)");
    try {
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        setIsAuthenticated(authData.isAuthenticated || false);
        setTeacherName(authData.teacherName || null);
        console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: Loaded auth from localStorage", authData);
      } else {
        setIsAuthenticated(false);
        setTeacherName(null);
        console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: No auth data in localStorage, setting to not authenticated.");
      }
    } catch (error) {
      console.error("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: Error loading auth from localStorage", error);
      setIsAuthenticated(false);
      setTeacherName(null);
    }

    try {
      const storedStudents = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (storedStudents) {
        let parsedStudents: Student[] = JSON.parse(storedStudents);
        parsedStudents = parsedStudents.map(student => ({
          id: student.id || `s_fallback_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          name: student.name || "Nome Desconhecido",
          className: student.className || "Turma Desconhecida",
          gender: student.gender || 'prefiroNaoInformar',
          contributions: student.contributions || {
            [MATERIAL_TYPES.LIDS]: 0,
            [MATERIAL_TYPES.CANS]: 0,
            [MATERIAL_TYPES.OIL]: 0
          },
          pendingContributions: student.pendingContributions || {
            [MATERIAL_TYPES.LIDS]: 0,
            [MATERIAL_TYPES.CANS]: 0,
            [MATERIAL_TYPES.OIL]: 0
          },
          narcisoCoins: typeof student.narcisoCoins === 'number' ? student.narcisoCoins : 0,
        }));
        setStudents(parsedStudents);
        console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: Loaded students from localStorage");
      } else {
        const initialStudents = generateInitialStudents();
        setStudents(initialStudents);
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(initialStudents));
        console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: No students in localStorage, generated initial students.");
      }
    } catch (error) {
      console.error("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: Error loading students from localStorage", error);
      const initialStudents = generateInitialStudents();
      setStudents(initialStudents);
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(initialStudents));
    }
  }, []);

  const updateLocalStorageStudents = (updatedStudents: Student[]) => {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updatedStudents));
  };

  const login = async (email: string, pass: string) => {
    console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: login called (Mock Auth Version)", email);
    if (!email || !pass) {
      toast({
        variant: "destructive",
        title: "Campos Obrigatórios",
        description: "Por favor, preencha o email e a senha.",
      });
      throw new Error("Email e senha são obrigatórios.");
    }
    
    const currentTeacherName = email.split('@')[0] || "Professor(a)";
    setIsAuthenticated(true);
    setTeacherName(currentTeacherName);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ isAuthenticated: true, teacherName: currentTeacherName }));
    toast({
      title: "Login Bem-sucedido! (Mock)",
      description: `Bem-vindo(a) de volta, ${currentTeacherName}!`,
    });
    router.push('/dashboard');
  };

  const logout = async () => {
    console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: logout called (Mock Auth Version)");
    setIsAuthenticated(false);
    setTeacherName(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.push('/login');
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
      updateLocalStorageStudents(updatedStudents);
      return updatedStudents;
    });
  }, []);

  const updateStudent = useCallback((studentData: Partial<Omit<Student, 'id' | 'narcisoCoins' | 'contributions' | 'pendingContributions'>> & { id: string; gender?: GenderType }) => {
    setStudents(prevStudents => {
      const updatedStudents = prevStudents.map(s =>
        s.id === studentData.id ? { ...s, ...studentData } : s
      );
      updateLocalStorageStudents(updatedStudents);
      return updatedStudents;
    });
  }, []);

  const deleteStudent = useCallback((studentId: string) => {
    setStudents(prevStudents => {
      const updatedStudents = prevStudents.filter(s => s.id !== studentId);
      updateLocalStorageStudents(updatedStudents);
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
      };

      const updatedStudents = [...prevStudents];
      updatedStudents[studentIndex] = studentAfter;
      
      console.log("LOG DE CONTRIBUIÇÃO (LOCAL):", {
        studentId: studentAfter.id,
        studentName: studentAfter.name,
        material,
        quantityAdded,
        date: new Date().toISOString(),
        unitsPerCoinAtTime: unitsPerCoin,
        pendingBalanceBefore: materialPendingBefore,
        pendingBalanceAfter: materialPendingAfter,
        coinsEarnedThisTransaction,
        totalCoinsAfterTransaction: studentAfter.narcisoCoins,
        teacherId: teacherName || 'N/A (localStorage auth)',
      });

      updateLocalStorageStudents(updatedStudents);
      return updatedStudents;
    });
  }, [teacherName]);

  const getOverallStats = useCallback(() => {
    let totalLids = 0;
    let totalCans = 0;
    let totalOil = 0;
    let totalCoins = 0;
    students.forEach(student => {
      totalLids += student.contributions?.[MATERIAL_TYPES.LIDS] || 0;
      totalCans += student.contributions?.[MATERIAL_TYPES.CANS] || 0;
      totalOil += student.contributions?.[MATERIAL_TYPES.OIL] || 0;
      totalCoins += student.narcisoCoins || 0;
    });
    return { totalLids, totalCans, totalOil, totalCoins };
  }, [students]);

  // console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: context value (Mock Auth Version)", {isAuthenticated, teacherName, studentsCount: students.length});

  return (
    <AuthContext.Provider value={{ isAuthenticated, teacherName, students, classes, login, logout, addStudent, updateStudent, deleteStudent, addContribution, getOverallStats }}>
      {children}
    </AuthContext.Provider>
  );
};
