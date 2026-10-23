// Пустое значение показываем прочерком
export const dash = (v: string) => (v.trim() === "" ? "—" : v);

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });
}

// Сегодняшняя дата в формате 23.10.2026
export const todayRu = () => new Date().toLocaleDateString("ru-RU");
