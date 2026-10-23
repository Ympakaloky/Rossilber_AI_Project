export interface InspectionResult {
  id: number;
  indicator: string;
  norm: string;
  actual: string;
}

// Один протокол выходного контроля
export interface InspectionRecord {
  protocolId: string;
  submittedAt: string;
  protocolNumber: string;
  protocolDate: string;
  batch: string;
  recipe: string;
  productionDate: string;
  results: InspectionResult[];
  conclusion: string;
  executorPosition: string;
  executorName: string;
}
