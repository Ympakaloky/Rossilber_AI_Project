export interface IndicatorDef {
  id: number;
  name: string;
  // Значение по НД, которое подставляется сразу (если оно одинаково для всех)
  defaultNorm: string;
}

export const inspectionIndicators: IndicatorDef[] = [
  { id: 1, name: "Внешний вид", defaultNorm: "Мелкозернистый порошок" },
  { id: 2, name: "Удельный вес, г/см3", defaultNorm: "" },
  { id: 3, name: "Размер частиц, 150 мкм, %, не более", defaultNorm: "" },
  { id: 4, name: "Размер частиц, 250 мкм, %, не более", defaultNorm: "" },
  { id: 5, name: "Содержание влаги, %, не более", defaultNorm: "" },
  {
    id: 6,
    name: "Время гелеобразования при температуре 205°С, сек",
    defaultNorm: "",
  },
  {
    id: 7,
    name: "Время отверждения при температуре 232°С, сек, не более",
    defaultNorm: "",
  },
  { id: 8, name: "Tg1 точка перегиба, °С", defaultNorm: "" },
  { id: 9, name: "Tg2 точка перегиба, °С, не менее", defaultNorm: "" },
  { id: 10, name: "dH, Дж/г, не менее", defaultNorm: "" },
  { id: 11, name: "Адгезия, Х, не более, балл", defaultNorm: "" },
  { id: 12, name: "Прочность покрытия при ударе, 3-5 Дж", defaultNorm: "" },
  { id: 13, name: "Твердость по Бухгольцу, у.е., не менее", defaultNorm: "" },
  { id: 14, name: "Эластичность по Эриксону, мм", defaultNorm: "" },
];
