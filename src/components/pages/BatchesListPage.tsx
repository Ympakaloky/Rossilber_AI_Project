import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import type { BatchForm, BatchRow } from "../../types/batch";

interface Notice {
  severity: "success" | "error";
  text: string;
}

const formFields: { key: keyof BatchForm; label: string; size: number }[] = [
  { key: "recipe", label: "Рецепт", size: 6 },
  { key: "batch", label: "Партия", size: 6 },
  { key: "productionSite", label: "Рабочий центр", size: 8 },
  { key: "materialWeight", label: "Масса навески, кг", size: 4 },
  { key: "releaseDate", label: "Дата выдачи карты", size: 6 },
  { key: "issuedBy", label: "Выдал", size: 6 },
];

const emptyForm: BatchForm = {
  recipe: "",
  batch: "",
  productionSite: "",
  materialWeight: "",
  releaseDate: "",
  issuedBy: "",
};

function BatchesListPage() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<BatchRow | null>(null);
  const [editForm, setEditForm] = useState<BatchForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const loadBatches = useCallback(async () => {
    try {
      const res = await fetch("/api/batches");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Не удалось загрузить партии");
      }
      setBatches(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const openEdit = (b: BatchRow) => {
    setEditing(b);
    setEditForm({
      recipe: b.recipe,
      batch: b.batch,
      productionSite: b.productionSite,
      materialWeight: b.materialWeight,
      releaseDate: b.releaseDate,
      issuedBy: b.issuedBy,
    });
  };

  const closeEdit = () => {
    if (!saving) setEditing(null);
  };

  const handleEditChange =
    (field: keyof BatchForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setEditForm({ ...editForm, [field]: e.target.value });
    };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/batches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, row: editing.row }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Не удалось сохранить партию");
      }
      setEditing(null);
      setNotice({ severity: "success", text: "Партия обновлена" });
      await loadBatches();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Неизвестная ошибка";
      setNotice({ severity: "error", text });
    } finally {
      setSaving(false);
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

            {!loading && !error && batches.length === 0 && (
              <Typography>Партий пока нет</Typography>
            )}

            {!loading && !error && batches.length > 0 && (
              <TableContainer>
                <Table
                  size="small"
                  sx={{
                    "& .MuiTableCell-root": {
                      color: "inherit",
                      fontSize: "0.8125rem",
                      padding: "6px 10px",
                    },
                    "& .MuiTableCell-head": {
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>Рецепт</TableCell>
                      <TableCell>Партия</TableCell>
                      <TableCell>Рабочий центр</TableCell>
                      <TableCell>Масса навески, кг</TableCell>
                      <TableCell>Дата выдачи карты</TableCell>
                      <TableCell>Выдал</TableCell>
                      <TableCell>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batches.map((b) => (
                      <TableRow key={b.row}>
                        <TableCell>{b.recipe}</TableCell>
                        <TableCell>{b.batch}</TableCell>
                        <TableCell>{b.productionSite}</TableCell>
                        <TableCell>{b.materialWeight}</TableCell>
                        <TableCell>{b.releaseDate}</TableCell>
                        <TableCell>{b.issuedBy}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Button
                            size="small"
                            sx={{
                              fontSize: "0.75rem",
                              textTransform: "none",
                              minWidth: 0,
                              px: 1,
                            }}
                            onClick={() => openEdit(b)}
                          >
                            Изменить партию
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            sx={{
                              fontSize: "0.75rem",
                              textTransform: "none",
                              minWidth: 0,
                              px: 1,
                            }}
                            onClick={() => console.log("удалить", b.row)}
                          >
                            Удалить партию
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Box>
      </Box>

      <Dialog
        open={editing !== null}
        onClose={closeEdit}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Изменить партию</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {formFields.map((f) => (
              <Grid key={f.key} size={f.size}>
                <TextField
                  label={f.label}
                  variant="outlined"
                  fullWidth
                  value={editForm[f.key]}
                  onChange={handleEditChange(f.key)}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit} disabled={saving}>
            Отмена
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Сохраняем..." : "Сохранить"}
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

export default BatchesListPage;
