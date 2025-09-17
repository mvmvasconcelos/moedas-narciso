export type DataEstilo = 'ano' | 'mes' | 'tudo';

export interface TimelineItem {
  id: string;
  data: number; // timestamp
  titulo: string;
  descricao: string;
  foto?: string; // caminho para placeholder
  data_estilo?: DataEstilo;
}

export const timelineMock: TimelineItem[] = [
  {
    id: 't1',
    data: new Date('2025-01-15').getTime(),
    titulo: 'Lançamento do Projeto',
    descricao: 'Apresentação inicial do Projeto Moedas Narciso para a comunidade escolar.',
    foto: 'https://picsum.photos/seed/t1/640/360',
    data_estilo: 'tudo',
  },
  {
    id: 't2',
    data: new Date('2025-02-10').getTime(),
    titulo: 'Primeira Coleta Comunitária',
    descricao: 'Realizamos a primeira coleta de tampinhas e latinhas com participação dos alunos.',
    foto: 'https://picsum.photos/seed/t2/640/360',
    data_estilo: 'mes',
  },
  {
    id: 't3',
    data: new Date('2025-03-05').getTime(),
    titulo: 'Oficina de Educação Ambiental',
    descricao: 'Oficina com professores e alunos sobre reciclagem e separação correta dos materiais.',
    foto: 'https://picsum.photos/seed/t3/640/360',
    data_estilo: 'ano',
  },
  {
    id: 't4',
    data: new Date('2025-04-20').getTime(),
    titulo: 'Inauguração da Lojinha',
    descricao: 'A lojinha escolar passou a aceitar Moedas Narciso como forma de troca.',
    foto: 'https://picsum.photos/seed/t4/640/360',
    data_estilo: 'tudo',
  },
  {
    id: 't5',
    data: new Date('2025-06-12').getTime(),
    titulo: 'Doação de Cestas',
    descricao: 'Primeira entrega de cestas básicas adquiridas com parte dos recursos do projeto.',
    foto: 'https://picsum.photos/seed/t5/640/360',
    data_estilo: 'mes',
  },
  {
    id: 't6',
    data: new Date('2025-08-30').getTime(),
    titulo: 'Feira de Trocas Escolar',
    descricao: 'Evento onde alunos puderam trocar Moedas Narciso por itens na lojinha e participar de atividades educativas.',
    foto: 'https://picsum.photos/seed/t6/640/360',
    data_estilo: 'ano',
  },
  // ---- 2024 ----
  {
    id: '24-1',
    data: new Date('2024-03-22').getTime(),
    titulo: 'Planejamento e Capacitação',
    descricao: 'Equipe gestora e professores se reuniram para estruturar o projeto e capacitar voluntários.',
    foto: 'https://picsum.photos/seed/24-1/640/360',
    data_estilo: 'tudo',
  },
  {
    id: '24-2',
    data: new Date('2024-06-18').getTime(),
    titulo: 'Campanha de Sensibilização',
    descricao: 'Campanha interna sobre reciclagem e economia circular para alunos e famílias.',
    foto: 'https://picsum.photos/seed/24-2/640/360',
    data_estilo: 'mes',
  },
  {
    id: '24-3',
    data: new Date('2024-11-05').getTime(),
    titulo: 'Parceria Local',
    descricao: 'Estabelecida parceria com comércio local para apoio à lojinha escolar.',
    foto: 'https://picsum.photos/seed/24-3/640/360',
    data_estilo: 'ano',
  },
  // ---- 2023 ----
  {
    id: '23-1',
    data: new Date('2023-05-10').getTime(),
    titulo: 'Diagnóstico Inicial',
    descricao: 'Pesquisa e levantamento da viabilidade do projeto na comunidade escolar.',
    foto: 'https://picsum.photos/seed/23-1/640/360',
    data_estilo: 'tudo',
  },
  {
    id: '23-2',
    data: new Date('2023-09-02').getTime(),
    titulo: 'Iniciativas Ambientais',
    descricao: 'Ações pontuais de limpeza e pequenos mutirões na comunidade escolar.',
    foto: 'https://picsum.photos/seed/23-2/640/360',
    data_estilo: 'mes',
  },
  {
    id: '23-3',
    data: new Date('2023-12-12').getTime(),
    titulo: 'Relatório Preliminar',
    descricao: 'Relatório com resultados iniciais e recomendações para 2024/2025.',
    foto: 'https://picsum.photos/seed/23-3/640/360',
    data_estilo: 'ano',
  },
];
