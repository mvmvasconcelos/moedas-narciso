
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Student, Class, MaterialType } from '@/lib/constants';
import { MOCK_CLASSES, generateInitialStudents, calculateStudentCoins, MATERIAL_TYPES } from '@/lib/constants';

interface AuthContextType {
  isAuthenticated: boolean;
  teacherName: string | null;
  students: Student[];
  classes: Class[];
  login: (name: string) => void;
  logout: () => void;
  addStudent: (studentData: Omit<Student, 'id' | 'narcisoCoins' | 'contributions'>) => void;
  updateStudent: (studentData: Omit<Student, 'narcisoCoins' | 'contributions'>) => void;
  deleteStudent: (studentId: string) => void;
  addContribution: (studentId: string, material: MaterialType, quantity: number) => void;
  getOverallStats: () => { totalLids: number; totalCans: number; totalOil: number; totalCoins: number };
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'moedasNarcisoAuth';
const STUDENTS_STORAGE_KEY = 'moedasNarcisoStudents';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const classes = MOCK_CLASSES; // Classes are static for this demo
  const router = useRouter();

  useEffect(() => {
    // Load auth state from localStorage
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth) {
      const authData = JSON.parse(storedAuth);
      setIsAuthenticated(authData.isAuthenticated);
      setTeacherName(authData.teacherName);
    }

    // Load students from localStorage or initialize
    const storedStudents = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (storedStudents) {
      setStudents(JSON.parse(storedStudents));
    } else {
      const initialStudents = generateInitialStudents();
      setStudents(initialStudents);
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(initialStudents));
    }
  }, []);

  const updateLocalStorageStudents = (updatedStudents: Student[]) => {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updatedStudents));
  };

  const login = (name: string) => {
    setIsAuthenticated(true);
    setTeacherName(name);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ isAuthenticated: true, teacherName: name }));
    router.push('/');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setTeacherName(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    // Optionally clear student data on logout or keep it for demo
    // localStorage.removeItem(STUDENTS_STORAGE_KEY); 
    // setStudents(generateInitialStudents());
    router.push('/login');
  };

  const addStudent = useCallback((studentData: Omit<Student, 'id' | 'narcisoCoins' | 'contributions'>) => {
    setStudents(prevStudents => {
      const newStudent: Student = {
        ...studentData,
        id: `s${Date.now()}`, // Simple unique ID
        contributions: { tampas: 0, latas: 0, oleo: 0 },
        narcisoCoins: 0,
      };
      const updatedStudents = [...prevStudents, newStudent];
      updateLocalStorageStudents(updatedStudents);
      return updatedStudents;
    });
  }, []);

  const updateStudent = useCallback((studentData: Omit<Student, 'narcisoCoins' | 'contributions'>) => {
    setStudents(prevStudents => {
      const updatedStudents = prevStudents.map(s =>
        s.id === studentData.id ? { ...s, name: studentData.name, className: studentData.className } : s
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
          const newContributions = {
            ...s.contributions,
            [material]: (s.contributions[material] || 0) + quantity,
          };
          const newCoins = calculateStudentCoins({ ...s, contributions: newContributions });
          return { ...s, contributions: newContributions, narcisoCoins: newCoins };
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
      totalLids += student.contributions[MATERIAL_TYPES.LIDS];
      totalCans += student.contributions[MATERIAL_TYPES.CANS];
      totalOil += student.contributions[MATERIAL_TYPES.OIL];
      totalCoins += student.narcisoCoins;
    });
    return { totalLids, totalCans, totalOil, totalCoins };
  }, [students]);


  return (
    <AuthContext.Provider value={{ isAuthenticated, teacherName, students, classes, login, logout, addStudent, updateStudent, deleteStudent, addContribution, getOverallStats }}>
      {children}
    </AuthContext.Provider>
  );
};

// This hook is also defined in src/hooks/use-auth.ts, which is fine.
// For clarity, it's common to define the hook alongside the context provider,
// or in a dedicated hooks file as you've done.
// const useAuthInternal = () => {
//   const context = React.useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuthInternal must be used within an AuthProvider');
//   }
//   return context;
// };
