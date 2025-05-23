
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

export const MATERIAL_UNITS_PER_COIN: Record<MaterialType, number> = {
  [MATERIAL_TYPES.LIDS]: 20,
  [MATERIAL_TYPES.CANS]: 30,
  [MATERIAL_TYPES.OIL]: 2,
};

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
  gender: GenderType; // Novo campo
  contributions: {
    [MATERIAL_TYPES.LIDS]: number;
    [MATERIAL_TYPES.CANS]: number;
    [MATERIAL_TYPES.OIL]: number;
  };
  pendingContributions: {
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
  { id: '1', name: 'Pré Manhã' },
  { id: '2', name: 'Pré Tarde' },
  { id: '3', name: '1º Ano Tarde' },
  { id: '4', name: '1º e 2º Ano Manhã' },
  { id: '5', name: '3º Ano' },
  { id: '6', name: '4º e 5º Anos' },
];

export const MOCK_STUDENTS_INITIAL_DATA: Omit<Student, 'narcisoCoins' | 'id' | 'pendingContributions'>[] = [
  { name: 'Ana Beatriz Costa', className: 'Pré Manhã', gender: 'feminino', contributions: { tampas: 25, latas: 5, oleo: 2 } },
  { name: 'Bruno Alves Dias', className: 'Pré Manhã', gender: 'masculino', contributions: { tampas: 15, latas: 3, oleo: 1 } },
  { name: 'Carla Moreira Lima', className: 'Pré Tarde', gender: 'feminino', contributions: { tampas: 30, latas: 6, oleo: 0 } },
  { name: 'Daniel Farias Gomes', className: 'Pré Tarde', gender: 'masculino', contributions: { tampas: 10, latas: 2, oleo: 3 } },
  { name: 'Eduarda Pires Nobre', className: '1º Ano Tarde', gender: 'feminino', contributions: { tampas: 50, latas: 10, oleo: 5 } },
  { name: 'Felipe Santos Rocha', className: '1º Ano Tarde', gender: 'masculino', contributions: { tampas: 5, latas: 1, oleo: 0 } },
  { name: 'Gabriela Vieira Pinto', className: '1º e 2º Ano Manhã', gender: 'feminino', contributions: { tampas: 40, latas: 8, oleo: 4 } },
  { name: 'Henrique Barros Melo', className: '1º e 2º Ano Manhã', gender: 'masculino', contributions: { tampas: 22, latas: 4, oleo: 1 } },
  { name: 'Isabela Castro Cunha', className: '3º Ano', gender: 'feminino', contributions: { tampas: 33, latas: 7, oleo: 2 } },
  { name: 'Lucas Azevedo Sousa', className: '4º e 5º Anos', gender: 'masculino', contributions: { tampas: 18, latas: 3, oleo: 1 } },
];

export const generateInitialStudents = (): Student[] => {
  return MOCK_STUDENTS_INITIAL_DATA.map((studData, index) => {
    const id = `s${index + 1}`;
    let narcisoCoins = 0;
    const pendingContributions: Student['pendingContributions'] = {
      [MATERIAL_TYPES.LIDS]: 0,
      [MATERIAL_TYPES.CANS]: 0,
      [MATERIAL_TYPES.OIL]: 0,
    };

    for (const materialKey in MATERIAL_TYPES) {
      const material = MATERIAL_TYPES[materialKey as MaterialKey];
      const totalAmount = studData.contributions[material] || 0;
      const unitsPerCoin = MATERIAL_UNITS_PER_COIN[material];
      
      if (unitsPerCoin > 0) {
        narcisoCoins += Math.floor(totalAmount / unitsPerCoin);
        pendingContributions[material] = totalAmount % unitsPerCoin;
      } else {
        pendingContributions[material] = totalAmount;
      }
    }

    return {
      ...studData,
      id,
      narcisoCoins,
      pendingContributions,
      gender: studData.gender || 'prefiroNaoInformar', // Garante que o gênero mockado seja usado
    };
  });
};
