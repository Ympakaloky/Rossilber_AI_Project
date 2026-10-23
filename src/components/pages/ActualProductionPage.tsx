import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Grid,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Header from "../Header";
import type { BatchRow } from "../../types/batch";
import type {
  DosingForm,
  OperationFact,
  OperationPlan,
} from "../../types/actualProduction";

interface Notice {
  severity: "success" | "error";
  text: string;
}

const operationsPlan: OperationPlan[] = [
  {
    id: 1,
    operation: "Загрузка порошка",
    name: "Сырьё №1",
    quantity: "33",
    mass: "330",
  },
  {
    id: 2,
    operation: "Загрузка порошка",
    name: "Сырьё №2",
    quantity: "233",
    mass: "330",
  },
  {
    id: 3,
    operation: "Загрузка порошка",
    name: "Сырьё №3",
    quantity: "34",
    mass: "340",
  },
];

const emptyFact: OperationFact = {
  fact: "",
  preparedBy: "",
  unpackedBy: "",
  note: "",
  moistureCheckDate: "",
  moistureBatch: "",
  moistureNorm: "",
  moistureResult: "",
};

const emptyDosing: DosingForm = { startTime: "", endTime: "", fullName: "" };

const filled = (v: string) => v.trim() !== "";

// Поля замера влажности: заполняются все вместе или не заполняются вовсе
const moistureKeys = [
  "moistureCheckDate",
  "moistureBatch",
  "moistureNorm",
  "moistureResult",
] as const;

type MoistureKey = (typeof moistureKeys)[number];

const moistureColumns: { key: MoistureKey; label: string; width: number }[] = [
  { key: "moistureCheckDate", label: "Дата замера", width: 130 },
  { key: "moistureBatch", label: "Партия сырья", width: 160 },
  { key: "moistureNorm", label: "Норма, %", width: 110 },
  { key: "moistureResult", label: "Результат, %", width: 120 },
];

type MoistureStatus = "empty" | "complete" | "partial";

function moistureStatus(f: OperationFact): MoistureStatus {
  const count = moistureKeys.filter((k) => filled(f[k])).length;
  if (count === 0) return "empty";
  return count === moistureKeys.length ? "complete" : "partial";
}

// Общие стили мелкого шрифта и компактных полей внутри таблицы
const smallText = {
  "& .MuiInputBase-input": { fontSize: "0.8125rem" },
  "& .MuiInputLabel-root": { fontSize: "0.8125rem" },
};
const compactPadding = {
  "& .MuiInputBase-input": { py: "6px", px: "10px" },
};

// Один стиль для обеих таблиц страницы
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

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  hideLabel?: boolean;
}

// Поле ввода. Вынесено на уровень модуля, а не внутрь страницы: компонент,
// объявленный внутри другого компонента, пересоздаётся при каждой
// перерисовке, и поле теряло бы фокус после каждой набранной буквы.
function Field({
  label,
  value,
  onChange,
  error = false,
  hideLabel = false,
}: FieldProps) {
  return (
    <TextField
      label={hideLabel ? undefined : label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      size="small"
      fullWidth
      sx={[smallText, hideLabel && compactPadding]}
      slotProps={{ htmlInput: { "aria-label": label } }}
    />
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "baseline" }}>
      <Typography
        sx={{ color: "text.secondary", fontSize: "0.8125rem", minWidth: 130 }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>
        {value || "—"}
      </Typography>
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

function ActualProductionPage() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<BatchRow | null>(null);

  const [productionDate, setProductionDate] = useState("");
  const [facts, setFacts] = useState<OperationFact[]>(() =>
    operationsPlan.map(() => ({ ...emptyFact })),
  );
  const [dosing, setDosing] = useState<DosingForm>(emptyDosing);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/batches");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Не удалось загрузить партии");
        }
        setBatches(data);
      } catch (err) {
        const text = err instanceof Error ? err.message : "Неизвестная ошибка";
        setNotice({ severity: "error", text });
      } finally {
        setLoadingBatches(false);
      }
    };
    load();
  }, []);

  const updateFact = (
    index: number,
    field: keyof OperationFact,
    value: string,
  ) => {
    setFacts((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)),
    );
  };

  const updateDosing = (field: keyof DosingForm, value: string) => {
    setDosing((prev) => ({ ...prev, [field]: value }));
  };

  const isValid =
    selectedBatch !== null &&
    filled(productionDate) &&
    facts.every(
      (f) =>
        filled(f.fact) &&
        filled(f.preparedBy) &&
        filled(f.unpackedBy) &&
        moistureStatus(f) !== "partial",
    ) &&
    Object.values(dosing).every(filled);

  const resetForm = () => {
    setSelectedBatch(null);
    setProductionDate("");
    setFacts(operationsPlan.map(() => ({ ...emptyFact })));
    setDosing(emptyDosing);
    setSubmitted(false);
  };

  const handleConfirm = async () => {
    setSubmitted(true);
    if (!isValid || selectedBatch === null) {
      setNotice({
        severity: "error",
        text: "Проверьте выделенные поля. Замер влажности заполняется целиком или не заполняется вовсе.",
      });
      return;
    }

    const payload = {
      batch: selectedBatch.batch,
      recipe: selectedBatch.recipe,
      productionDate,
      operations: operationsPlan.map((op, i) => ({ ...op, ...facts[i] })),
      dosing,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/actual-production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Не удалось сохранить данные");
      }
      setNotice({ severity: "success", text: "Данные сохранены" });
      resetForm();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Неизвестная ошибка";
      setNotice({ severity: "error", text });
    } finally {
      setSubmitting(false);
    }
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
              padding: 3,
              width: "95%",
              maxWidth: "1400px",
              minHeight: "200px",
              color: "text.primary",
            }}
          >
            <Grid container spacing={2}>
              <Grid size={6}>
                <Autocomplete
                  options={batches}
                  value={selectedBatch}
                  onChange={(_, value) => setSelectedBatch(value)}
                  getOptionLabel={(b) => `${b.batch} — ${b.recipe}`}
                  getOptionKey={(b) => b.row}
                  isOptionEqualToValue={(a, b) => a.row === b.row}
                  loading={loadingBatches}
                  loadingText="Загрузка..."
                  noOptionsText="Партий нет"
                  size="small"
                  sx={smallText}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Партия"
                      error={submitted && selectedBatch === null}
                    />
                  )}
                />
              </Grid>
              <Grid size={6}>
                <InfoRow label="Рецепт:" value={selectedBatch?.recipe ?? ""} />
              </Grid>

              <Grid size={6}>
                <InfoRow
                  label="Рабочий центр:"
                  value={selectedBatch?.productionSite ?? ""}
                />
              </Grid>
              <Grid size={6}>
                <InfoRow
                  label="Масса навески:"
                  value={
                    selectedBatch ? `${selectedBatch.materialWeight} кг` : ""
                  }
                />
              </Grid>

              <Grid size={6}>
                <InfoRow
                  label="Выдано:"
                  value={selectedBatch?.releaseDate ?? ""}
                />
              </Grid>
              <Grid size={6}>
                <InfoRow label="Выдал:" value={selectedBatch?.issuedBy ?? ""} />
              </Grid>

              <Grid size={12}>
                <Field
                  label="Дата производства"
                  value={productionDate}
                  onChange={setProductionDate}
                  error={submitted && !filled(productionDate)}
                />
              </Grid>

              <Grid size={12}>
                <Typography sx={{ fontSize: "0.8125rem" }}>
                  Дополнительные требования по ведению технологического
                  процесса:
                </Typography>
                <Typography sx={{ fontSize: "0.8125rem" }}>
                  Все работы выполняются в средствах индивидуальной защиты,
                </Typography>
                <Typography sx={{ fontSize: "0.8125rem" }}>
                  с ограждением вращающихся частей
                </Typography>
              </Grid>

              <Grid size={12}>
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
                      {operationsPlan.map((op, i) => (
                        <TableRow key={op.id}>
                          <TableCell>{op.id}</TableCell>
                          <TableCell>{op.operation}</TableCell>
                          <TableCell>{op.name}</TableCell>
                          <TableCell>{op.quantity}</TableCell>
                          <TableCell>{op.mass}</TableCell>
                          <TableCell sx={{ minWidth: 100 }}>
                            <Field
                              hideLabel
                              label="Факт"
                              value={facts[i].fact}
                              onChange={(v) => updateFact(i, "fact", v)}
                              error={submitted && !filled(facts[i].fact)}
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 140 }}>
                            <Field
                              hideLabel
                              label="Подготовил"
                              value={facts[i].preparedBy}
                              onChange={(v) => updateFact(i, "preparedBy", v)}
                              error={submitted && !filled(facts[i].preparedBy)}
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 140 }}>
                            <Field
                              hideLabel
                              label="Растарил"
                              value={facts[i].unpackedBy}
                              onChange={(v) => updateFact(i, "unpackedBy", v)}
                              error={submitted && !filled(facts[i].unpackedBy)}
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 160 }}>
                            <Field
                              hideLabel
                              label="Примечание"
                              value={facts[i].note}
                              onChange={(v) => updateFact(i, "note", v)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid size={12}>
                <SectionTitle>Дозировка</SectionTitle>
              </Grid>
              <Grid size={3}>
                <Field
                  label="Время начала"
                  value={dosing.startTime}
                  onChange={(v) => updateDosing("startTime", v)}
                  error={submitted && !filled(dosing.startTime)}
                />
              </Grid>
              <Grid size={3}>
                <Field
                  label="Время окончания"
                  value={dosing.endTime}
                  onChange={(v) => updateDosing("endTime", v)}
                  error={submitted && !filled(dosing.endTime)}
                />
              </Grid>
              <Grid size={6}>
                <Field
                  label="ФИО"
                  value={dosing.fullName}
                  onChange={(v) => updateDosing("fullName", v)}
                  error={submitted && !filled(dosing.fullName)}
                />
              </Grid>

              <Grid size={12}>
                <SectionTitle>Замер влажности (если проводился)</SectionTitle>
              </Grid>
              <Grid size={12}>
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
                      {operationsPlan.map((op, i) => (
                        <TableRow key={op.id}>
                          <TableCell>{op.id}</TableCell>
                          <TableCell>{op.name}</TableCell>
                          {moistureColumns.map((c) => (
                            <TableCell key={c.key} sx={{ minWidth: c.width }}>
                              <Field
                                hideLabel
                                label={c.label}
                                value={facts[i][c.key]}
                                onChange={(v) => updateFact(i, c.key, v)}
                                error={
                                  submitted &&
                                  moistureStatus(facts[i]) === "partial" &&
                                  !filled(facts[i][c.key])
                                }
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography
                  sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 1 }}
                >
                  Замер заполняется целиком (все четыре поля) либо не
                  заполняется вовсе. Если замер у сырья не проводился, строку
                  оставьте пустой.
                </Typography>
              </Grid>

              <Grid
                size={12}
                sx={{ display: "flex", justifyContent: "flex-end" }}
              >
                <Button
                  variant="contained"
                  disabled={submitting}
                  onClick={handleConfirm}
                  sx={{
                    backgroundColor: "#6b6375",
                    textTransform: "none",
                    "&:hover": { backgroundColor: "#7d7587" },
                  }}
                >
                  {submitting ? "Сохраняем..." : "Подтвердить"}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={notice !== null}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
      >
        {notice ? (
          <Alert severity={notice.severity} onClose={() => setNotice(null)}>
            {notice.text}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}

export default ActualProductionPage;
