import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Header from "../Header";
import Field from "../common/Field";
import { tableSx } from "../common/tableStyles";
import {
  filled,
  isOperationValid,
  moistureColumns,
  moistureStatus,
} from "../../utils/production";
import type {
  DosingForm,
  OperationFact,
  OperationRecord,
  ProductionRecord,
} from "../../types/actualProduction";

interface Notice {
  severity: "success" | "error";
  text: string;
}

// Черновик правки: копия редактируемых полей записи
interface Draft {
  productionDate: string;
  dosing: DosingForm;
  facts: OperationFact[];
}

// Пустое значение показываем прочерком
const dash = (v: string) => (v.trim() === "" ? "—" : v);

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });
}

// Из операции берём только то, что оператор вводит сам
function factOf(op: OperationRecord): OperationFact {
  return {
    fact: op.fact,
    preparedBy: op.preparedBy,
    unpackedBy: op.unpackedBy,
    note: op.note,
    moistureCheckDate: op.moistureCheckDate,
    moistureBatch: op.moistureBatch,
    moistureNorm: op.moistureNorm,
    moistureResult: op.moistureResult,
  };
}

async function sendRequest(method: "PUT" | "DELETE", body: unknown) {
  const res = await fetch("/api/actual-production", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? "Не удалось выполнить действие");
  }
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
function InfoLine({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        columnGap: 4,
        rowGap: 1,
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

interface EditableCellProps {
  editing: boolean;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  minWidth?: number;
}

// Ячейка таблицы: в режиме просмотра текст, в режиме правки поле ввода
function EditableCell({
  editing,
  label,
  value,
  onChange,
  error,
  minWidth,
}: EditableCellProps) {
  return (
    <TableCell sx={editing && minWidth ? { minWidth } : undefined}>
      {editing ? (
        <Field
          hideLabel
          label={label}
          value={value}
          onChange={onChange}
          error={error}
        />
      ) : (
        dash(value)
      )}
    </TableCell>
  );
}

function ProductionListPage() {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // draft === null: просмотр, иначе идёт правка
  const [draft, setDraft] = useState<Draft | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

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

  const showError = (err: unknown) => {
    const text = err instanceof Error ? err.message : "Неизвестная ошибка";
    setNotice({ severity: "error", text });
  };

  // Храним только id, а саму запись берём из списка: так панель
  // всегда показывает актуальные данные после перезагрузки списка
  const selected = records.find((r) => r.submissionId === selectedId) ?? null;

  // Если запись исчезла из списка (например, удалена), панель закрывается сама
  const panelOpen = drawerOpen && selected !== null;

  const editing = draft !== null;

  // Что показывать в панели: черновик во время правки, иначе сохранённая запись
  const view = selected
    ? {
        productionDate: draft?.productionDate ?? selected.productionDate,
        dosing: draft?.dosing ?? selected.dosing,
        facts: (draft?.facts ?? selected.operations) as OperationFact[],
      }
    : null;

  const draftValid =
    draft !== null &&
    filled(draft.productionDate) &&
    Object.values(draft.dosing).every(filled) &&
    draft.facts.every(isOperationValid);

  const openRecord = (id: string) => {
    setSelectedId(id);
    setDraft(null);
    setSubmitted(false);
    setDrawerOpen(true);
  };

  const startEdit = (r: ProductionRecord) => {
    setDraft({
      productionDate: r.productionDate,
      dosing: { ...r.dosing },
      facts: r.operations.map(factOf),
    });
    setSubmitted(false);
  };

  const cancelEdit = () => {
    setDraft(null);
    setSubmitted(false);
  };

  // Во время правки панель закрывается только кнопками «Отмена» и «Сохранить»,
  // чтобы случайный клик по фону не стёр введённое
  const handleDrawerClose = () => {
    if (draft === null) setDrawerOpen(false);
  };

  const updateDraft = (change: (d: Draft) => Draft) =>
    setDraft((d) => (d ? change(d) : d));

  const updateFact = (
    index: number,
    field: keyof OperationFact,
    value: string,
  ) =>
    updateDraft((d) => ({
      ...d,
      facts: d.facts.map((f, i) =>
        i === index ? { ...f, [field]: value } : f,
      ),
    }));

  const updateDosing = (field: keyof DosingForm, value: string) =>
    updateDraft((d) => ({ ...d, dosing: { ...d.dosing, [field]: value } }));

  const updateDate = (value: string) =>
    updateDraft((d) => ({ ...d, productionDate: value }));

  const handleSave = async () => {
    if (!selected || !draft) return;
    setSubmitted(true);
    if (!draftValid) {
      setNotice({
        severity: "error",
        text: "Проверьте выделенные поля. Замер влажности заполняется целиком или не заполняется вовсе.",
      });
      return;
    }

    setSaving(true);
    try {
      await sendRequest("PUT", {
        submissionId: selected.submissionId,
        batch: selected.batch,
        recipe: selected.recipe,
        productionDate: draft.productionDate,
        dosing: draft.dosing,
        operations: selected.operations.map((op, i) => ({
          ...op,
          ...draft.facts[i],
        })),
      });
      setDraft(null);
      setSubmitted(false);
      setNotice({ severity: "success", text: "Запись обновлена" });
      await loadRecords();
    } catch (err) {
      // Черновик не трогаем, чтобы введённое не пропало; список обновляем
      showError(err);
      await loadRecords();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleteBusy(true);
    try {
      await sendRequest("DELETE", { submissionId: selected.submissionId });
      setConfirmDelete(false);
      setDrawerOpen(false);
      setNotice({ severity: "success", text: "Запись удалена" });
      await loadRecords();
    } catch (err) {
      showError(err);
      setConfirmDelete(false);
      await loadRecords();
    } finally {
      setDeleteBusy(false);
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
                        selected={panelOpen && r.submissionId === selectedId}
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
        open={panelOpen}
        onClose={handleDrawerClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", lg: 1000 },
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
        {selected && view && (
          <>
            {/* Шапка остаётся на месте при прокрутке */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                px: 3,
                py: 1.5,
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="h6">
                Партия {selected.batch}
                {editing ? " — редактирование" : ""}
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {editing ? (
                  <>
                    <Button
                      onClick={cancelEdit}
                      disabled={saving}
                      sx={{ textTransform: "none" }}
                    >
                      Отмена
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      disabled={saving}
                      sx={{ textTransform: "none" }}
                    >
                      {saving ? "Сохраняем..." : "Сохранить"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => startEdit(selected)}
                      sx={{ textTransform: "none" }}
                    >
                      Изменить
                    </Button>
                    <Button
                      color="error"
                      onClick={() => setConfirmDelete(true)}
                      sx={{ textTransform: "none" }}
                    >
                      Удалить
                    </Button>
                    <Button
                      onClick={() => setDrawerOpen(false)}
                      sx={{ textTransform: "none" }}
                    >
                      Закрыть
                    </Button>
                  </>
                )}
              </Box>
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
                {draft ? (
                  <Box sx={{ width: 220 }}>
                    <Field
                      label="Дата производства"
                      value={draft.productionDate}
                      onChange={updateDate}
                      error={submitted && !filled(draft.productionDate)}
                    />
                  </Box>
                ) : (
                  <InfoRow
                    label="Дата производства:"
                    value={selected.productionDate}
                  />
                )}
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
                    {selected.operations.map((op, i) => (
                      <TableRow key={op.id}>
                        <TableCell>{op.id}</TableCell>
                        <TableCell>{op.operation}</TableCell>
                        <TableCell>{op.name}</TableCell>
                        <TableCell>{op.quantity}</TableCell>
                        <TableCell>{op.mass}</TableCell>
                        <EditableCell
                          editing={editing}
                          label="Факт"
                          value={view.facts[i].fact}
                          onChange={(v) => updateFact(i, "fact", v)}
                          error={submitted && !filled(view.facts[i].fact)}
                          minWidth={90}
                        />
                        <EditableCell
                          editing={editing}
                          label="Подготовил"
                          value={view.facts[i].preparedBy}
                          onChange={(v) => updateFact(i, "preparedBy", v)}
                          error={submitted && !filled(view.facts[i].preparedBy)}
                          minWidth={120}
                        />
                        <EditableCell
                          editing={editing}
                          label="Растарил"
                          value={view.facts[i].unpackedBy}
                          onChange={(v) => updateFact(i, "unpackedBy", v)}
                          error={submitted && !filled(view.facts[i].unpackedBy)}
                          minWidth={120}
                        />
                        <EditableCell
                          editing={editing}
                          label="Примечание"
                          value={view.facts[i].note}
                          onChange={(v) => updateFact(i, "note", v)}
                          minWidth={140}
                        />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <SectionTitle>Дозировка</SectionTitle>
              {draft ? (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  <Box sx={{ width: 160 }}>
                    <Field
                      label="Время начала"
                      value={draft.dosing.startTime}
                      onChange={(v) => updateDosing("startTime", v)}
                      error={submitted && !filled(draft.dosing.startTime)}
                    />
                  </Box>
                  <Box sx={{ width: 160 }}>
                    <Field
                      label="Время окончания"
                      value={draft.dosing.endTime}
                      onChange={(v) => updateDosing("endTime", v)}
                      error={submitted && !filled(draft.dosing.endTime)}
                    />
                  </Box>
                  <Box sx={{ width: 280 }}>
                    <Field
                      label="ФИО"
                      value={draft.dosing.fullName}
                      onChange={(v) => updateDosing("fullName", v)}
                      error={submitted && !filled(draft.dosing.fullName)}
                    />
                  </Box>
                </Box>
              ) : (
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
              )}

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
                    {selected.operations.map((op, i) => (
                      <TableRow key={op.id}>
                        <TableCell>{op.id}</TableCell>
                        <TableCell>{op.name}</TableCell>
                        {moistureColumns.map((c) => (
                          <EditableCell
                            key={c.key}
                            editing={editing}
                            label={c.label}
                            value={view.facts[i][c.key]}
                            onChange={(v) => updateFact(i, c.key, v)}
                            error={
                              submitted &&
                              moistureStatus(view.facts[i]) === "partial" &&
                              !filled(view.facts[i][c.key])
                            }
                            minWidth={c.width}
                          />
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {editing && (
                <Typography
                  sx={{ fontSize: "0.75rem", color: "text.secondary" }}
                >
                  Замер заполняется целиком (все четыре поля) либо не
                  заполняется вовсе. Партию и рецепт изменить нельзя: при ошибке
                  удалите запись и внесите заново.
                </Typography>
              )}
            </Box>
          </>
        )}
      </Drawer>

      <Dialog
        open={confirmDelete}
        onClose={() => {
          if (!deleteBusy) setConfirmDelete(false);
        }}
      >
        <DialogTitle>Удалить запись?</DialogTitle>
        <DialogContent>
          <Typography>
            Запись по партии «{selected?.batch ?? ""}» от{" "}
            {selected?.productionDate ?? ""} будет удалена вместе со всеми
            операциями и замерами. Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDelete(false)}
            disabled={deleteBusy}
            sx={{ textTransform: "none" }}
          >
            Отмена
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleteBusy}
            sx={{ textTransform: "none" }}
          >
            {deleteBusy ? "Удаляем..." : "Удалить"}
          </Button>
        </DialogActions>
      </Dialog>

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

export default ProductionListPage;
