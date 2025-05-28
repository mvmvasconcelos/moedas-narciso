import { createClient } from '@supabase/supabase-js';

// Essas variáveis de ambiente precisam ser configuradas no arquivo .env
// Você pode obter essas informações no painel do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Log para verificar se as variáveis estão sendo carregadas corretamente
console.log("Inicializando cliente Supabase com:", {
  urlConfigured: !!supabaseUrl,
  keyConfigured: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length,
  keyLength: supabaseAnonKey?.length
});

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
      console.log('getCurrentUser: Nenhuma sessão ativa encontrada');
      return null;
    }
    
    console.log('getCurrentUser: Usuário autenticado', {
      id: session.user.id,
      email: session.user.email,
      lastSignIn: session.user.last_sign_in_at
    });
    
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
    console.log('getTeacherProfile: Nenhum usuário autenticado encontrado');
    return null;
  }
  
  console.log('getTeacherProfile: Buscando perfil para o usuário', { 
    id: user.id, 
    email: user.email 
  });
  
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (error) {
    console.error('Erro ao buscar perfil de professor:', error);
    console.log('Detalhes do erro:', {
      code: error.code,
      message: error.message,
      details: error.details
    });
    return null;
  }
  
  if (!data) {
    console.warn('getTeacherProfile: Usuário autenticado mas sem registro na tabela teachers', { 
      userId: user.id 
    });
    return null;
  }
  
  console.log('getTeacherProfile: Perfil de professor encontrado', data);
  return data;
}
