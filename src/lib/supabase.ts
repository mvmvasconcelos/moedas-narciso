import { createClient } from '@supabase/supabase-js';

// Essas variáveis de ambiente precisam ser configuradas no arquivo .env
// Você pode obter essas informações no painel do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Verificar se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO CRÍTICO: Variáveis de ambiente do Supabase não configuradas corretamente!");
}

// Cria o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para obter o usuário atual
export async function getCurrentUser() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao obter sessão do Supabase:', error);
      return null;
    }
    
    if (!session) {
      return null;
    }
    
    return session.user;
  } catch (error) {
    console.error('Exceção ao verificar usuário atual:', error);
    return null;
  }
}

// Função para obter o perfil do professor
export async function getTeacherProfile() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (error) {
    console.error('Erro ao buscar perfil de professor:', error);
    return null;
  }
  
  if (!data) {
    console.warn('getTeacherProfile: Usuário autenticado mas sem registro na tabela teachers', { 
      userId: user.id 
    });
    return null;
  }
  
  return data;
}

// Função para verificar a configuração do Supabase
export const verifySupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


  if (!url || !key) {
    throw new Error("Supabase não configurado corretamente. Verifique as variáveis de ambiente.");
  }
};
