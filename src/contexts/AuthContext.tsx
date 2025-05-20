
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Student, Class, MaterialType } from '@/lib/constants';
import { MOCK_CLASSES, generateInitialStudents, calculateStudentCoins, MATERIAL_TYPES } from '@/lib/constants';

interface AuthContextType {
  isAuthenticated: boolean;
  teacherName: string | null | undefined; // Allow undefined for loading state
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
  console.log("AuthProvider rendering");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [teacherName, setTeacherName] = useState<string | null | undefined>(undefined); // Initialize as undefined
  const [students, setStudents] = useState<Student[]>([]);
  const classes = MOCK_CLASSES; // Classes are static for this demo
  const router = useRouter();

  useEffect(() => {
    console.log("AuthProvider: useEffect for localStorage");
    // Load auth state from localStorage
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        setIsAuthenticated(authData.isAuthenticated || false);
        setTeacherName(authData.teacherName || null); // Ensure string or null
        console.log("AuthProvider: Loaded auth from localStorage", authData);
      } catch (error) {
        console.error("AuthProvider: Failed to parse auth data from localStorage", error);
        setIsAuthenticated(false);
        setTeacherName(null); // Signal loading complete, unauthenticated
        localStorage.removeItem(AUTH_STORAGE_KEY); // Clean up corrupted data
      }
    } else {
      // No stored auth, explicitly set teacherName to null to indicate loading is complete
      console.log("AuthProvider: No auth data in localStorage");
      setIsAuthenticated(false);
      setTeacherName(null);
    }

    // Load students from localStorage or initialize
    const storedStudents = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (storedStudents) {
      try {
        setStudents(JSON.parse(storedStudents));
        console.log("AuthProvider: Loaded students from localStorage");
      } catch (error) {
        console.error("AuthProvider: Failed to parse students data from localStorage", error);
        const initialStudents = generateInitialStudents();
        setStudents(initialStudents);
        localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(initialStudents));
        console.log("AuthProvider: Initialized students and saved to localStorage");
      }
    } else {
      const initialStudents = generateInitialStudents();
      setStudents(initialStudents);
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(initialStudents));
      console.log("AuthProvider: Initialized students and saved to localStorage (no prior data)");
    }
  }, []);

  const updateLocalStorageStudents = (updatedStudents: Student[]) => {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updatedStudents));
  };

  const login = (name: string) => {
    console.log("AuthProvider: login called", name);
    setIsAuthenticated(true);
    setTeacherName(name);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ isAuthenticated: true, teacherName: name }));
    router.push('/');
  };

  const logout = () => {
    console.log("AuthProvider: logout called");
    setIsAuthenticated(false);
    setTeacherName(null); // Set to null on logout
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.push('/login');
  };

  const addStudent = useCallback((studentData: Omit<Student, 'id' | 'narcisoCoins' | 'contributions'>) => {
    setStudents(prevStudents => {
      const newStudent: Student = {
        ...studentData,
        id: `s${Date.now()}`, 
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
      totalLids += student.contributions[MATERIAL_TYPES.LIDS] || 0;
      totalCans += student.contributions[MATERIAL_TYPES.CANS] || 0;
      totalOil += student.contributions[MATERIAL_TYPES.OIL] || 0;
      totalCoins += student.narcisoCoins || 0;
    });
    return { totalLids, totalCans, totalOil, totalCoins };
  }, [students]);

  console.log("AuthProvider: context value", { isAuthenticated, teacherName: teacherName, studentsCount: students.length });
  return (
    <AuthContext.Provider value={{ isAuthenticated, teacherName, students, classes, login, logout, addStudent, updateStudent, deleteStudent, addContribution, getOverallStats }}>
      {children}
    </AuthContext.Provider>
  );
};
