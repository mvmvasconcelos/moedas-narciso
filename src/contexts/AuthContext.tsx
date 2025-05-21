
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Student, Class, MaterialType, GenderType } from '@/lib/constants';
import { MOCK_CLASSES, generateInitialStudents, MATERIAL_TYPES, MATERIAL_UNITS_PER_COIN } from '@/lib/constants';
import { auth } from '@/lib/firebase'; 
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  type User as FirebaseUser 
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  currentUser: FirebaseUser | null | undefined; 
  isAuthenticated: boolean; 
  teacherName: string | null; 
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

const STUDENTS_STORAGE_KEY = 'moedasNarcisoStudents';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [students, setStudents] = useState<Student[]>([]);
  const classes = MOCK_CLASSES;
  const router = useRouter();
  const { toast } = useToast();

  const isAuthenticated = currentUser !== null && currentUser !== undefined;
  const teacherName = currentUser?.email?.split('@')[0] || currentUser?.displayName || null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
 router.push('/dashboard');
      } else {
        console.log("DEBUG: src/contexts/AuthContext.tsx - onAuthStateChanged: User is signed out");
        setCurrentUser(null);
      }
    });

    // Load students from localStorage (this will be replaced by Firestore later)
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
      } else {
        const initialStudents = generateInitialStudents();
        setStudents(initialStudents);
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(initialStudents));
      }
    } catch (error) {
      const initialStudents = generateInitialStudents();
      setStudents(initialStudents);
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(initialStudents));
    }
    return () => unsubscribe(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateLocalStorageStudents = (updatedStudents: Student[]) => {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updatedStudents));
  };

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting currentUser.
      // Navigation to /dashboard will be handled by HomePage or AuthGuard based on new auth state.
      // Forcing a navigation here can sometimes conflict if onAuthStateChanged is also triggering navigation.
    } catch (error: any) {
      console.error("DEBUG: src/contexts/AuthContext.tsx - Firebase login error", error.code, error.message);
      let errorMessage = "Falha no login. Verifique suas credenciais ou tente novamente mais tarde.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "E-mail ou senha inválidos.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Formato de e-mail inválido.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Erro de rede. Verifique sua conexão ou tente mais tarde.";
      }
      toast({
        variant: "destructive",
        title: "Erro de Login",
        description: errorMessage,
      });
      throw error; 
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged will set currentUser to null.
      // Navigation to /login will be handled by HomePage or AuthGuard.
      // router.push('/login'); 
 } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro de Logout",
        description: "Não foi possível sair. Tente novamente.",
      });
    }
  };

  const addStudent = useCallback((studentData: Omit<Student, 'id' | 'narcisoCoins' | 'contributions' | 'pendingContributions'>) => {
    setStudents(prevStudents => {
      const newStudent: Student = {
        ...studentData,
        id: `s${Date.now()}`,
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

      // Log de transação (para referência futura)
      // console.log("LOG DE CONTRIBUIÇÃO:", { /* ...detalhes... */ });

      updateLocalStorageStudents(updatedStudents);
      return updatedStudents;
    });
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

  // console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: context value", {currentUser, isAuthenticated, teacherName, studentsCount: students.length });

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, teacherName, students, classes, login, logout, addStudent, updateStudent, deleteStudent, addContribution, getOverallStats }}>
      {children}
    </AuthContext.Provider>
  );
};
