
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
  [MATERIAL_TYPES.OIL]: 'Óleo (unidades)',
};

export const CONVERSION_RATES: Record<MaterialType, number> = {
  [MATERIAL_TYPES.LIDS]: 1,
  [MATERIAL_TYPES.CANS]: 5,
  [MATERIAL_TYPES.OIL]: 10,
};

export interface Student {
  id: string;
  name: string;
  className: string;
  contributions: {
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

export const MOCK_STUDENTS_INITIAL: Omit<Student, 'narcisoCoins' | 'id'>[] = [
  { name: 'Ana Beatriz Costa', className: 'Pré Manhã', contributions: { tampas: 25, latas: 5, oleo: 2 } },
  { name: 'Bruno Alves Dias', className: 'Pré Manhã', contributions: { tampas: 15, latas: 3, oleo: 1 } },
  { name: 'Carla Moreira Lima', className: 'Pré Tarde', contributions: { tampas: 30, latas: 6, oleo: 0 } },
  { name: 'Daniel Farias Gomes', className: 'Pré Tarde', contributions: { tampas: 10, latas: 2, oleo: 3 } },
  { name: 'Eduarda Pires Nobre', className: '1º Ano Tarde', contributions: { tampas: 50, latas: 10, oleo: 5 } },
  { name: 'Felipe Santos Rocha', className: '1º Ano Tarde', contributions: { tampas: 5, latas: 1, oleo: 0 } },
  { name: 'Gabriela Vieira Pinto', className: '1º e 2º Ano Manhã', contributions: { tampas: 40, latas: 8, oleo: 4 } },
  { name: 'Henrique Barros Melo', className: '1º e 2º Ano Manhã', contributions: { tampas: 22, latas: 4, oleo: 1 } },
  { name: 'Isabela Castro Cunha', className: '3º Ano', contributions: { tampas: 33, latas: 7, oleo: 2 } },
  { name: 'Lucas Azevedo Sousa', className: '4º e 5º Anos', contributions: { tampas: 18, latas: 3, oleo: 1 } },
];

export const calculateStudentCoins = (student: Omit<Student, 'narcisoCoins'>): number => {
  const coinsFromLids = student.contributions.tampas * CONVERSION_RATES.tampas;
  const coinsFromCans = student.contributions.latas * CONVERSION_RATES.latas;
  const coinsFromOil = student.contributions.oleo * CONVERSION_RATES.oleo;
  return coinsFromLids + coinsFromCans + coinsFromOil;
};

export const generateInitialStudents = (): Student[] => {
  return MOCK_STUDENTS_INITIAL.map((stud, index) => {
    const id = `s${index + 1}`;
    const narcisoCoins = calculateStudentCoins(stud);
    return { ...stud, id, narcisoCoins };
  });
};
