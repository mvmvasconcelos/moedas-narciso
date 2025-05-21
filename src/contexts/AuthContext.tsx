
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Student, Class, MaterialType } from '@/lib/constants';
import { MOCK_CLASSES, generateInitialStudents, MATERIAL_TYPES, MATERIAL_UNITS_PER_COIN } from '@/lib/constants';

console.log("DEBUG: src/contexts/AuthContext.tsx - FILE PARSED");

interface AuthContextType {
  isAuthenticated: boolean;
  teacherName: string | null | undefined; // Allow undefined for loading state
  students: Student[];
  classes: Class[];
  login: (name: string) => void;
  logout: () => void;
  addStudent: (studentData: Omit<Student, 'id' | 'narcisoCoins' | 'contributions' | 'pendingContributions'>) => void;
  updateStudent: (studentData: Partial<Omit<Student, 'id' | 'narcisoCoins' | 'contributions' | 'pendingContributions'>> & { id: string }) => void;
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
  const [teacherName, setTeacherName] = useState<string | null | undefined>(undefined);
  const [students, setStudents] = useState<Student[]>([]);
  const classes = MOCK_CLASSES;
  const router = useRouter();

  useEffect(() => {
    console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: useEffect for localStorage");
    try {
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        setIsAuthenticated(authData.isAuthenticated || false);
        setTeacherName(authData.teacherName || null);
      } else {
        console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: No auth data in localStorage, setting to null.");
        setIsAuthenticated(false);
        setTeacherName(null); 
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
        parsedStudents = parsedStudents.map(student => ({
          ...student,
          name: student.name || "Nome Desconhecido",
          className: student.className || "Turma Desconhecida",
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
          narcisoCoins: student.narcisoCoins || 0,
        }));
        setStudents(parsedStudents);
      } else {
        const initialStudents = generateInitialStudents();
        setStudents(initialStudents);
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(initialStudents));
      }
    } catch (error) {
      console.error("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: Failed to parse/validate students data from localStorage, re-initializing.", error);
      const initialStudents = generateInitialStudents();
      setStudents(initialStudents);
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(initialStudents));
    }
  }, []);

  const updateLocalStorageStudents = (updatedStudents: Student[]) => {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updatedStudents));
  };

  const login = (name: string) => {
    console.log("DEBUG: src/contexts/AuthContext.tsx - AuthProvider: login called", name);
    setIsAuthenticated(true);
    setTeacherName(name);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ isAuthenticated: true, teacherName: name }));
    router.push('/dashboard');
  };

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

  const updateStudent = useCallback((studentData: Partial<Omit<Student, 'id' | 'narcisoCoins' | 'contributions' | 'pendingContributions'>> & { id: string }) => {
    setStudents(prevStudents => {
      const updatedStudents = prevStudents.map(s =>
        s.id === studentData.id ? { ...s, name: studentData.name || s.name, className: studentData.className || s.className } : s
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

  const addContribution = useCallback((studentId: string, material: MaterialType, quantity: number) => {
    setStudents(prevStudents => {
      const updatedStudents = prevStudents.map(s => {
        if (s.id === studentId) {
          const unitsPerCoin = MATERIAL_UNITS_PER_COIN[material];
          if (!unitsPerCoin || unitsPerCoin <= 0) return s; 

          let currentMaterialPending = (s.pendingContributions?.[material]) || 0;
          
          currentMaterialPending += quantity; 
          
          const newCoinsEarned = Math.floor(currentMaterialPending / unitsPerCoin);
          const updatedMaterialPending = currentMaterialPending % unitsPerCoin;
          
          return {
            ...s,
            contributions: { 
              ...(s.contributions || {}), // Ensure contributions object exists
              [material]: ((s.contributions?.[material]) || 0) + quantity,
            },
            pendingContributions: { 
              ...(s.pendingContributions || {}), // Ensure pendingContributions object exists
              [material]: updatedMaterialPending,
            },
            narcisoCoins: (s.narcisoCoins || 0) + newCoinsEarned, 
          };
        }
        return s;
      });
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

  return (
    <AuthContext.Provider value={{ isAuthenticated, teacherName, students, classes, login, logout, addStudent, updateStudent, deleteStudent, addContribution, getOverallStats }}>
      {children}
    </AuthContext.Provider>
  );
};
