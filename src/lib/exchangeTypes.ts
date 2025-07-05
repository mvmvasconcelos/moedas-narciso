// Interface para resultado de troca
export interface Exchange {
  id: string;
  student_id: string;
  material_id: string;
  quantity: number;
  created_at: string;
  teacher_id: string;
}

// Interfaces para o histórico de trocas
export interface ExchangeHistoryParams {
  page?: number;
  limit?: number;
  classFilter?: string;
  studentFilter?: string;
  materialFilter?: string;
}

export interface ExchangeHistoryRecord {
  id: string;
  date: string;
  material: string;
  quantity: number;
  studentId: string;
  studentName: string;
  className: string;
  teacherId: string;
  teacherName: string;
}

export interface ExchangeHistoryResult {
  data: ExchangeHistoryRecord[];
  total: number;
}
