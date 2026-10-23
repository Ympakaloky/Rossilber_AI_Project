import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Drawer,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Header from "../Header";
import type { ProductionRecord } from "../../types/actualProduction";

// Стиль таблиц такой же, как на остальных страницах
const tableSx = {
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

const moistureColumns = [
  { key: "moistureCheckDate", label: "Дата замера" },
  { key: "moistureBatch", label: "Партия сырья" },
  { key: "moistureNorm", label: "Норма, %" },
  { key: "moistureResult", label: "Результат, %" },
] as const;

// Пустое значение показываем прочерком
const dash = (v: string) => (v.trim() === "" ? "—" : v);

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
      <Typography sx={{ color: "text.secondary", fontSize: "0.8125rem" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>
        {dash(value)}
      </Typography>
    </Box>
  );
}

// Несколько значений в одну строку; на узком экране переносятся
function InfoLine({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        columnGap: 4,
        rowGap: 0.5,
      }}
    >
      {children}
    </Box>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", mt: 1 }}>
      {children}
    </Typography>
  );
}

function ProductionListPage() {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadRecords = useCallback(async () => {
    try {
      const res = await fetch("/api/actual-production");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Не удалось загрузить данные");
      }
      setRecords(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Храним только id, а саму запись берём из списка: так панель
  // всегда показывает актуальные данные после перезагрузки списка
  const selected = records.find((r) => r.submissionId === selectedId) ?? null;

  const openRecord = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Header />
      <Box
        sx={{
          minHeight: "50vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            flex: 1,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            p: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "var(--accent-bg)",
              borderRadius: 2,
              boxShadow:
                "0px 4px 20px rgba(0, 0, 0, 0.05), 0px 1px 3px rgba(0, 0, 0, 0.1)",
              padding: 2,
              width: "95%",
              maxWidth: "1400px",
              minHeight: "200px",
              color: "text.primary",
            }}
          >
            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && records.length === 0 && (
              <Typography>Отправок пока нет</Typography>
            )}

            {!loading && !error && records.length > 0 && (
              <TableContainer>
                <Table size="small" sx={tableSx}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Партия</TableCell>
                      <TableCell>Рецепт</TableCell>
                      <TableCell>Дата производства</TableCell>
                      <TableCell>Отправлено</TableCell>
                      <TableCell>Операций</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.map((r) => (
                      <TableRow
                        key={r.submissionId}
                        hover
                        selected={drawerOpen && r.submissionId === selectedId}
                        tabIndex={0}
                        onClick={() => openRecord(r.submissionId)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") openRecord(r.submissionId);
                        }}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>{r.batch}</TableCell>
                        <TableCell>{r.recipe}</TableCell>
                        <TableCell>{r.productionDate}</TableCell>
                        <TableCell>{formatDateTime(r.submittedAt)}</TableCell>
                        <TableCell>{r.operations.length}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", lg: 900 },
              maxWidth: "100%",
              height: "100dvh",
              display: "flex",
              flexDirection: "column",
              // Сама панель не прокручивается: прокручивается область внутри неё
              overflow: "hidden",
              // Непрозрачная основа из темы + тот же оттенок, что у карточек
              backgroundColor: "background.paper",
              backgroundImage:
                "linear-gradient(var(--accent-bg), var(--accent-bg))",
              color: "text.primary",
            },
          },
        }}
      >
        {selected && (
          <>
            {/* Шапка остаётся на месте при прокрутке */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                px: 3,
                py: 1.5,
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="h6">Партия {selected.batch}</Typography>
              <Button
                onClick={() => setDrawerOpen(false)}
                sx={{ textTransform: "none" }}
              >
                Закрыть
              </Button>
            </Box>

            {/* Прокручиваемая область: minHeight: 0 позволяет ей быть ниже содержимого */}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                p: 3,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                "& > *": { flexShrink: 0 },
              }}
            >
              <InfoLine>
                <InfoRow label="Рецепт:" value={selected.recipe} />
                <InfoRow
                  label="Дата производства:"
                  value={selected.productionDate}
                />
                <InfoRow
                  label="Отправлено:"
                  value={formatDateTime(selected.submittedAt)}
                />
              </InfoLine>

              <SectionTitle>Технологические операции</SectionTitle>
              <TableContainer>
                <Table size="small" sx={tableSx}>
                  <TableHead>
                    <TableRow>
                      <TableCell>№</TableCell>
                      <TableCell>Тех. операция</TableCell>
                      <TableCell>Наименование</TableCell>
                      <TableCell>Кол-во</TableCell>
                      <TableCell>Масса</TableCell>
                      <TableCell>Факт</TableCell>
                      <TableCell>Подготовил</TableCell>
                      <TableCell>Растарил</TableCell>
                      <TableCell>Примечание</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selected.operations.map((op) => (
                      <TableRow key={op.id}>
                        <TableCell>{op.id}</TableCell>
                        <TableCell>{op.operation}</TableCell>
                        <TableCell>{op.name}</TableCell>
                        <TableCell>{op.quantity}</TableCell>
                        <TableCell>{op.mass}</TableCell>
                        <TableCell>{dash(op.fact)}</TableCell>
                        <TableCell>{dash(op.preparedBy)}</TableCell>
                        <TableCell>{dash(op.unpackedBy)}</TableCell>
                        <TableCell>{dash(op.note)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <SectionTitle>Дозировка</SectionTitle>
              <InfoLine>
                <InfoRow
                  label="Время начала:"
                  value={selected.dosing.startTime}
                />
                <InfoRow
                  label="Время окончания:"
                  value={selected.dosing.endTime}
                />
                <InfoRow label="ФИО:" value={selected.dosing.fullName} />
              </InfoLine>

              <SectionTitle>Замер влажности</SectionTitle>
              <TableContainer>
                <Table size="small" sx={tableSx}>
                  <TableHead>
                    <TableRow>
                      <TableCell>№</TableCell>
                      <TableCell>Наименование</TableCell>
                      {moistureColumns.map((c) => (
                        <TableCell key={c.key}>{c.label}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selected.operations.map((op) => (
                      <TableRow key={op.id}>
                        <TableCell>{op.id}</TableCell>
                        <TableCell>{op.name}</TableCell>
                        {moistureColumns.map((c) => (
                          <TableCell key={c.key}>{dash(op[c.key])}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}
      </Drawer>
    </Box>
  );
}

export default ProductionListPage;
