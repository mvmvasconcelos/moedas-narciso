
export const MATERIAL_TYPES = {
  LIDS: 'tampas',
  CANS: 'latas',
  OIL: 'oleo',
} as const;

export type MaterialType = typeof MATERIAL_TYPES[keyof typeof MATERIAL_TYPES];
export type MaterialKey = keyof typeof MATERIAL_TYPES;

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  [MATERIAL_TYPES.LIDS]: 'Tampas',
  [MATERIAL_TYPES.CANS]: 'Latas',
  [MATERIAL_TYPES.OIL]: 'Óleo (litros)',
};

// As taxas de conversão agora são obtidas do banco de dados
// Veja DataService.getCurrentConversionRates()

export type GenderType = 'masculino' | 'feminino' | 'outro' | 'prefiroNaoInformar';

export const GENDER_LABELS: Record<GenderType, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  outro: 'Outro',
  prefiroNaoInformar: 'Prefiro não informar',
};

export interface Student {
  id: string;
  name: string;
  className: string;
  gender: GenderType;
  photo_url?: string | null; // URL da foto do aluno
  exchanges: {
    [MATERIAL_TYPES.LIDS]: number;
    [MATERIAL_TYPES.CANS]: number;
    [MATERIAL_TYPES.OIL]: number;
  };
  pendingExchanges: {
    [MATERIAL_TYPES.LIDS]: number;
    [MATERIAL_TYPES.CANS]: number;
    [MATERIAL_TYPES.OIL]: number;
  };
  narcisoCoins: number;
}

export interface Class {
  id: string;
  name: string;
}

export const MOCK_CLASSES: Class[] = [
  // Ordem: Prés primeiro, depois anos em ordem crescente
  { id: '1', name: 'Pré Manhã' },
  { id: '2', name: 'Pré Tarde' },
  { id: '3', name: '1º Ano Tarde' },
  { id: '4', name: '1º e 2º Ano Manhã' },
  { id: '5', name: '3º Ano' },
  { id: '6', name: '4º e 5º Anos' },
];


