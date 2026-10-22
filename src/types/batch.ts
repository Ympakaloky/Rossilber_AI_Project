export interface BatchForm {
  recipe: string;
  batch: string;
  productionSite: string;
  materialWeight: string;
  releaseDate: string;
  issuedBy: string;
}

export interface BatchRow extends BatchForm {
  row: number;
}
