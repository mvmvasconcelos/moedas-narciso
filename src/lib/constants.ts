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
  { id: '1', name: 'Turma 1A' },
  { id: '2', name: 'Turma 1B' },
  { id: '3', name: 'Turma 2A' },
  { id: '4', name: 'Turma 2B' },
  { id: '5', name: 'Turma 3A' },
];

export const MOCK_STUDENTS_INITIAL: Omit<Student, 'narcisoCoins' | 'id'>[] = [
  { name: 'Ana Beatriz Costa', className: 'Turma 1A', contributions: { tampas: 25, latas: 5, oleo: 2 } },
  { name: 'Bruno Alves Dias', className: 'Turma 1A', contributions: { tampas: 15, latas: 3, oleo: 1 } },
  { name: 'Carla Moreira Lima', className: 'Turma 1B', contributions: { tampas: 30, latas: 6, oleo: 0 } },
  { name: 'Daniel Farias Gomes', className: 'Turma 1B', contributions: { tampas: 10, latas: 2, oleo: 3 } },
  { name: 'Eduarda Pires Nobre', className: 'Turma 2A', contributions: { tampas: 50, latas: 10, oleo: 5 } },
  { name: 'Felipe Santos Rocha', className: 'Turma 2A', contributions: { tampas: 5, latas: 1, oleo: 0 } },
  { name: 'Gabriela Vieira Pinto', className: 'Turma 2B', contributions: { tampas: 40, latas: 8, oleo: 4 } },
  { name: 'Henrique Barros Melo', className: 'Turma 2B', contributions: { tampas: 22, latas: 4, oleo: 1 } },
  { name: 'Isabela Castro Cunha', className: 'Turma 3A', contributions: { tampas: 33, latas: 7, oleo: 2 } },
  { name: 'Lucas Azevedo Sousa', className: 'Turma 3A', contributions: { tampas: 18, latas: 3, oleo: 1 } },
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
