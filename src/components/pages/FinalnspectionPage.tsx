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
import Field from "../common/Field";
import { InfoRow, SectionTitle } from "../common/InfoBlocks";
import { tableSx } from "../common/tableStyles";
import { inspectionIndicators } from "../../constants/inspectionIndicators";
import { todayRu } from "../../utils/format";
import { filled } from "../../utils/production";
import type { BatchRow } from "../../types/batch";
import type { ProductionRecord } from "../../types/actualProduction";

interface Notice {
  severity: "success" | "error";
  text: string;
}

// То, что оператор вводит в строке показателя
interface RowInput {
  norm: string;
  actual: string;
}

const DEFAULT_POSITION = "Инженер-химик";

const initialRows = (): RowInput[] =>
  inspectionIndicators.map((ind) => ({ norm: ind.defaultNorm, actual: "" }));

function FinalnspectionPage() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [productionRecords, setProductionRecords] = useState<
    ProductionRecord[]
  >([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<BatchRow | null>(null);

  const [protocolNumber, setProtocolNumber] = useState("");
  const [protocolDate, setProtocolDate] = useState(todayRu);
  const [productionDate, setProductionDate] = useState("");
  const [rows, setRows] = useState<RowInput[]>(initialRows);
  const [conclusion, setConclusion] = useState("");
  const [executorPosition, setExecutorPosition] = useState(DEFAULT_POSITION);
  const [executorName, setExecutorName] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const loadBatches = async () => {
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

    // Нужно только для подстановки даты производства: если не загрузится,
    // оператор просто введёт дату вручную
    const loadProduction = async () => {
      try {
        const res = await fetch("/api/actual-production");
        if (!res.ok) return;
        setProductionRecords(await res.json());
      } catch {
        // дата производства не подставится автоматически
      }
    };

    loadBatches();
    loadProduction();
  }, []);

  const handleBatchChange = (batch: BatchRow | null) => {
    setSelectedBatch(batch);
    // Записи приходят от новых к старым, поэтому берётся самая свежая
    const record = batch
      ? productionRecords.find(
          (r) => r.batch === batch.batch && r.recipe === batch.recipe,
        )
      : undefined;
    setProductionDate(record?.productionDate ?? "");
  };

  const updateRow = (index: number, field: keyof RowInput, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  };

  const isValid =
    selectedBatch !== null &&
    filled(protocolNumber) &&
    filled(protocolDate) &&
    filled(productionDate) &&
    rows.every((r) => filled(r.actual)) &&
    filled(conclusion) &&
    filled(executorPosition) &&
    filled(executorName);

  const resetForm = () => {
    setSelectedBatch(null);
    setProtocolNumber("");
    setProtocolDate(todayRu());
    setProductionDate("");
    setRows(initialRows());
    setConclusion("");
    setExecutorPosition(DEFAULT_POSITION);
    setExecutorName("");
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!isValid || selectedBatch === null) {
      setNotice({
        severity: "error",
        text: "Заполните выделенные поля. Если показатель не определялся, поставьте прочерк.",
      });
      return;
    }

    const payload = {
      protocolNumber,
      protocolDate,
      batch: selectedBatch.batch,
      recipe: selectedBatch.recipe,
      productionDate,
      results: inspectionIndicators.map((ind, i) => ({
        id: ind.id,
        indicator: ind.name,
        norm: rows[i].norm,
        actual: rows[i].actual,
      })),
      conclusion,
      executorPosition,
      executorName,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/final-inspection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Не удалось сохранить протокол");
      }
      setNotice({ severity: "success", text: "Протокол сохранён" });
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
              width: { xs: "95%", md: "75%" },
              maxWidth: "1200px",
              minHeight: "200px",
              color: "text.primary",
            }}
          >
            <Grid container spacing={2}>
              <Grid size={12}>
                <Typography variant="h6">
                  Протокол выходного контроля
                </Typography>
              </Grid>

              <Grid size={6}>
                <TextField
                  label="Протокол №"
                  variant="outlined"
                  fullWidth
                  value={protocolNumber}
                  onChange={(e) => setProtocolNumber(e.target.value)}
                  error={submitted && !filled(protocolNumber)}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Дата протокола"
                  variant="outlined"
                  fullWidth
                  value={protocolDate}
                  onChange={(e) => setProtocolDate(e.target.value)}
                  error={submitted && !filled(protocolDate)}
                />
              </Grid>

              <Grid size={6}>
                <Autocomplete
                  options={batches}
                  value={selectedBatch}
                  onChange={(_, value) => handleBatchChange(value)}
                  getOptionLabel={(b) => `${b.batch} — ${b.recipe}`}
                  getOptionKey={(b) => b.row}
                  isOptionEqualToValue={(a, b) => a.row === b.row}
                  loading={loadingBatches}
                  loadingText="Загрузка..."
                  noOptionsText="Партий нет"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Партия"
                      error={submitted && selectedBatch === null}
                    />
                  )}
                />
              </Grid>
              <Grid size={6} sx={{ display: "flex", alignItems: "center" }}>
                <InfoRow
                  label="Рецепт:"
                  value={selectedBatch?.recipe ?? ""}
                  labelWidth={70}
                />
              </Grid>

              <Grid size={6}>
                <TextField
                  label="Дата производства"
                  variant="outlined"
                  fullWidth
                  value={productionDate}
                  onChange={(e) => setProductionDate(e.target.value)}
                  error={submitted && !filled(productionDate)}
                />
              </Grid>

              <Grid size={12}>
                <SectionTitle>Показатели</SectionTitle>
              </Grid>
              <Grid size={12}>
                <TableContainer>
                  <Table size="small" sx={tableSx}>
                    <TableHead>
                      <TableRow>
                        <TableCell>№</TableCell>
                        <TableCell>Наименование показателя</TableCell>
                        <TableCell>Значение по НД</TableCell>
                        <TableCell>Фактический результат</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inspectionIndicators.map((ind, i) => (
                        <TableRow key={ind.id}>
                          <TableCell>{ind.id}</TableCell>
                          <TableCell>{ind.name}</TableCell>
                          <TableCell sx={{ minWidth: 200 }}>
                            <Field
                              hideLabel
                              label="Значение по НД"
                              value={rows[i].norm}
                              onChange={(v) => updateRow(i, "norm", v)}
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 200 }}>
                            <Field
                              hideLabel
                              label="Фактический результат"
                              value={rows[i].actual}
                              onChange={(v) => updateRow(i, "actual", v)}
                              error={submitted && !filled(rows[i].actual)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid size={12}>
                <TextField
                  label="Заключение"
                  variant="outlined"
                  fullWidth
                  multiline
                  minRows={3}
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  error={submitted && !filled(conclusion)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Исполнитель, должность"
                  variant="outlined"
                  fullWidth
                  value={executorPosition}
                  onChange={(e) => setExecutorPosition(e.target.value)}
                  error={submitted && !filled(executorPosition)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Ф.И.О."
                  variant="outlined"
                  fullWidth
                  value={executorName}
                  onChange={(e) => setExecutorName(e.target.value)}
                  error={submitted && !filled(executorName)}
                />
              </Grid>

              <Grid
                size={12}
                sx={{ display: "flex", justifyContent: "flex-end" }}
              >
                <Button
                  variant="contained"
                  disabled={submitting}
                  onClick={handleSubmit}
                  sx={{
                    height: "56px",
                    px: 4,
                    backgroundColor: "#6b6375",
                    textTransform: "none",
                    "&:hover": { backgroundColor: "#7d7587" },
                  }}
                >
                  {submitting ? "Сохраняем..." : "Создать протокол"}
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

export default FinalnspectionPage;
