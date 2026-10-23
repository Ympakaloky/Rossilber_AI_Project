// Плановая операция из рецепта (только для чтения)
export interface OperationPlan {
  id: number;
  operation: string;
  name: string;
  quantity: string;
  mass: string;
}

// То, что оператор вводит в каждой строке операции
export interface OperationFact {
  fact: string;
  preparedBy: string;
  unpackedBy: string;
  note: string;
  moistureCheckDate: string;
  moistureBatch: string;
  moistureNorm: string;
  moistureResult: string;
}

export interface DosingForm {
  startTime: string;
  endTime: string;
  fullName: string;
}

// Операция так, как она хранится в таблице: план и факт вместе
export type OperationRecord = OperationPlan & OperationFact;

// Одна отправка формы «Фактическое выполнение»
export interface ProductionRecord {
  submissionId: string;
  submittedAt: string;
  batch: string;
  recipe: string;
  productionDate: string;
  dosing: DosingForm;
  operations: OperationRecord[];
}
