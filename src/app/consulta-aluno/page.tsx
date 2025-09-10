import ConsultaAlunoClient from '@/components/consulta/ConsultaAlunoClient';

export default function ConsultaAlunoPage() {
  // Esta rota renderiza um componente cliente que obtém os alunos do AuthContext
  return (
    <main className="space-y-8">
      <ConsultaAlunoClient />
    </main>
  );
}
