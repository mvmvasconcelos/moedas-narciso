
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Student, Class, MaterialType, GenderType } from '@/lib/constants'; // Adicionado GenderType
import { MOCK_CLASSES, generateInitialStudents, MATERIAL_TYPES, MATERIAL_UNITS_PER_COIN } from '@/lib/constants';
import { auth } from '@/lib/firebase'; // Import Firebase auth

console.log("DEBUG: src/contexts/AuthContext.tsx - FILE PARSED");

interface AuthContextType {
  isAuthenticated: boolean;
  teacherName: string | null | undefined;
  students: Student[];
  classes: Class[];
  login: (name: string) => void; // This will change to use Firebase Auth
  logout: () => void; // This will change to use Firebase Auth
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
  console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider rendering");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [teacherName, setTeacherName] = useState<string | null | undefined>(undefined); // undefined initially, null if check done & not auth, string if auth
  const [students, setStudents] = useState<Student[]>([]);
  const classes = MOCK_CLASSES;
  const router = useRouter();

  useEffect(() => {
    console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: useEffect for localStorage");
    console.log("Firebase Auth object:", auth); // Test Firebase auth object

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
        console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: No auth data in localStorage");
      }
    } catch (error) {
      console.error("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: Failed to parse auth data from localStorage", error);
      setIsAuthenticated(false);
      setTeacherName(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }

    try {
      const storedStudents = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (storedStudents) {
        let parsedStudents: Student[] = JSON.parse(storedStudents);
        // Validate and provide defaults for each student object
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
        console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: Initialized mock students and saved to localStorage");
      }
    } catch (error) {
      console.error("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: Failed to parse/validate students data from localStorage, re-initializing.", error);
      const initialStudents = generateInitialStudents();
      setStudents(initialStudents);
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(initialStudents));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateLocalStorageStudents = (updatedStudents: Student[]) => {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updatedStudents));
  };

  // This login function will be replaced with Firebase Authentication
  const login = (name: string) => {
    console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: login called", name);
    setIsAuthenticated(true);
    setTeacherName(name);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ isAuthenticated: true, teacherName: name }));
    router.push('/dashboard');
  };

  // This logout function will be replaced with Firebase Authentication
  const logout = () => {
    console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: logout called");
    setIsAuthenticated(false);
    setTeacherName(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.push('/login');
  };

  const addStudent = useCallback((studentData: Omit<Student, 'id' | 'narcisoCoins' | 'contributions' | 'pendingContributions'>) => {
    setStudents(prevStudents => {
      const newStudent: Student = {
        ...studentData,
        id: `s${Date.now()}`,
        contributions: {
          [MATERIAL_TYPES.LIDS]: 0,
          [MATERIAL_TYPES.CANS]: 0,
          [MATERIAL_TYPES.OIL]: 0
        },
        pendingContributions: {
          [MATERIAL_TYPES.LIDS]: 0,
          [MATERIAL_TYPES.CANS]: 0,
          [MATERIAL_TYPES.OIL]: 0
        },
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
        s.id === studentData.id ? {
            ...s,
            name: studentData.name || s.name,
            className: studentData.className || s.className,
            gender: studentData.gender || s.gender
        } : s
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
      // Ensure pendingContributions and contributions are initialized
      studentBefore.pendingContributions = studentBefore.pendingContributions || { tampas: 0, latas: 0, oleo: 0 };
      studentBefore.contributions = studentBefore.contributions || { tampas: 0, latas: 0, oleo: 0 };
      studentBefore.narcisoCoins = studentBefore.narcisoCoins || 0;


      const unitsPerCoin = MATERIAL_UNITS_PER_COIN[material];
      if (!unitsPerCoin || unitsPerCoin <= 0) return prevStudents; // Should not happen with current constants

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

      const transactionLog = {
        data: new Date().toISOString(),
        alunoId: studentId,
        alunoNome: studentAfter.name,
        material: material,
        quantidadeAdicionada: quantityAdded,
        taxaConversaoAtual: `${unitsPerCoin} unidades por moeda`,
        saldoMaterialPendenteAnterior: materialPendingBefore,
        saldoMaterialPendenteAtual: materialPendingAfter,
        moedasRecebidasNestaTroca: newCoinsEarnedThisTransaction,
        totalMoedasAlunoAposTroca: studentAfter.narcisoCoins,
        totalHistoricoMaterialAposTroca: studentAfter.contributions[material],
      };
      console.log("LOG DE CONTRIBUIÇÃO:", transactionLog);


      updateLocalStorageStudents(updatedStudents);
      return updatedStudents;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: context value", {isAuthenticated, teacherName, studentsCount: students.length });

  return (
    <AuthContext.Provider value={{ isAuthenticated, teacherName, students, classes, login, logout, addStudent, updateStudent, deleteStudent, addContribution, getOverallStats }}>
      {children}
    </AuthContext.Provider>
  );
};

    