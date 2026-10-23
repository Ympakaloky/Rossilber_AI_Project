import type { OperationFact } from "../types/actualProduction";

export const filled = (v: string) => v.trim() !== "";

// Поля замера влажности: заполняются все вместе или не заполняются вовсе
export const moistureKeys = [
  "moistureCheckDate",
  "moistureBatch",
  "moistureNorm",
  "moistureResult",
] as const;

export type MoistureKey = (typeof moistureKeys)[number];

export const moistureColumns: {
  key: MoistureKey;
  label: string;
  width: number;
}[] = [
  { key: "moistureCheckDate", label: "Дата замера", width: 130 },
  { key: "moistureBatch", label: "Партия сырья", width: 160 },
  { key: "moistureNorm", label: "Норма, %", width: 110 },
  { key: "moistureResult", label: "Результат, %", width: 120 },
];

export type MoistureStatus = "empty" | "complete" | "partial";

export function moistureStatus(f: OperationFact): MoistureStatus {
  const count = moistureKeys.filter((k) => filled(f[k])).length;
  if (count === 0) return "empty";
  return count === moistureKeys.length ? "complete" : "partial";
}

// Обязательные поля операции заполнены, замер влажности не «половинчатый»
export function isOperationValid(f: OperationFact): boolean {
  return (
    filled(f.fact) &&
    filled(f.preparedBy) &&
    filled(f.unpackedBy) &&
    moistureStatus(f) !== "partial"
  );
}
