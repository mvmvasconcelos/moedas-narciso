// Serviço de dados que abstrai o acesso ao armazenamento
// Atualmente usa localStorage, mas pode ser facilmente migrado para Supabase no futuro

import { type Student, MATERIAL_TYPES, generateInitialStudents } from './constants';

export const STUDENTS_STORAGE_KEY = 'moedasNarcisoStudents';
export const AUTH_STORAGE_KEY = 'moedasNarcisoAuth';

// Interface para autenticação
interface AuthData {
  isAuthenticated: boolean;
  teacherName: string | null;
}

// Classe que gerencia as operações de dados
export class DataService {
  // AUTENTICAÇÃO
  static getAuthData(): AuthData {
    try {
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth) {
        return JSON.parse(storedAuth);
      }
    } catch (error) {
      console.error("Erro ao recuperar dados de autenticação:", error);
    }
    return { isAuthenticated: false, teacherName: null };
  }

  static saveAuthData(authData: AuthData): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    } catch (error) {
      console.error("Erro ao salvar dados de autenticação:", error);
    }
  }
  
  static clearAuthData(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error("Erro ao limpar dados de autenticação:", error);
    }
  }
    // Aliases para manter compatibilidade com o código existente
  static removeAuthData = DataService.clearAuthData;
  static login = async (email: string, password: string): Promise<{ isAuthenticated: boolean; teacherName: string | null }> => {
    // Mock de autenticação - será substituído pela implementação do Supabase
    const currentTeacherName = email.split('@')[0] || "Professor(a)";
    const authData = { isAuthenticated: true, teacherName: currentTeacherName };
    DataService.saveAuthData(authData);
    return authData;
  };
  static logout = async (): Promise<void> => {
    DataService.clearAuthData();
    return Promise.resolve();
  };

  // ESTUDANTES
  static getStudents(): Student[] {
    try {
      const storedStudents = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (storedStudents) {
        return this.normalizeStudentData(JSON.parse(storedStudents));
      }
      
      // Dados iniciais se não houver dados armazenados
      const initialStudents = generateInitialStudents();
      this.saveStudents(initialStudents);
      return initialStudents;
    } catch (error) {
      console.error("Erro ao recuperar dados de estudantes:", error);
      const initialStudents = generateInitialStudents();
      this.saveStudents(initialStudents);
      return initialStudents;
    }
  }
  
  static saveStudents(students: Student[]): void {
    try {
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
    } catch (error) {
      console.error("Erro ao salvar dados de estudantes:", error);
    }
  }
  
  private static normalizeStudentData(students: Student[]): Student[] {
    return students.map(student => ({
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
  }
}

// NOTA: Para implementação futura do Supabase
/*
import { createClient } from '@supabase/supabase-js';

// Implemente essas variáveis no .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabaseDataService {
  // AUTENTICAÇÃO
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  }
  
  static async signOut() {
    return await supabase.auth.signOut();
  }
  
  static async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
  
  // ESTUDANTES
  static async getStudents() {
    const { data, error } = await supabase
      .from('students')
      .select('*');
      
    if (error) throw error;
    return data;
  }
  
  static async addStudent(studentData: Omit<Student, 'id'>) {
    const { data, error } = await supabase
      .from('students')
      .insert([studentData])
      .select();
      
    if (error) throw error;
    return data;
  }
  
  static async updateStudent(id: string, studentData: Partial<Student>) {
    const { data, error } = await supabase
      .from('students')
      .update(studentData)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    return data;
  }
  
  static async deleteStudent(id: string) {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }
}
*/
