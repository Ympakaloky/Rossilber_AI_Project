// Один стиль для всех таблиц приложения
export const tableSx = {
  "& .MuiTableCell-root": {
    color: "inherit",
    fontSize: "0.8125rem",
    padding: "6px 10px",
  },
  "& .MuiTableCell-head": {
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
} as const;

// Общие стили мелкого шрифта и компактных полей внутри таблицы
export const smallText = {
  "& .MuiInputBase-input": { fontSize: "0.8125rem" },
  "& .MuiInputLabel-root": { fontSize: "0.8125rem" },
};

export const compactPadding = {
  "& .MuiInputBase-input": { py: "6px", px: "10px" },
};
