import { useState, type ChangeEvent } from "react";
import { Alert, Box, Button, Grid, Snackbar, TextField } from "@mui/material";
import Header from "../Header";

interface BatchForm {
  recipe: string;
  batch: string;
  productionSite: string;
  materialWeight: string;
  releaseDate: string;
  issuedBy: string;
}

interface Notice {
  severity: "success" | "error";
  text: string;
}

const emptyForm: BatchForm = {
  recipe: "",
  batch: "",
  productionSite: "",
  materialWeight: "",
  releaseDate: "",
  issuedBy: "",
};

function BatchesPage() {
  const [form, setForm] = useState<BatchForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const handleChange =
    (field: keyof BatchForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm({ ...form, [field]: e.target.value });
    };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Не удалось создать партию");
      }

      setNotice({ severity: "success", text: "Партия создана" });
      setForm(emptyForm);
    } catch (err) {
      const text = err instanceof Error ? err.message : "Неизвестная ошибка";
      setNotice({ severity: "error", text });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
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
            alignItems: "center",
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
              width: "66%",
              maxWidth: "1200px",
              minHeight: "200px",
              color: "#3E3424",
            }}
          >
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  id="recipe"
                  label="Рецепт"
                  variant="outlined"
                  fullWidth
                  value={form.recipe}
                  onChange={handleChange("recipe")}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  id="batch"
                  label="Партия"
                  variant="outlined"
                  fullWidth
                  value={form.batch}
                  onChange={handleChange("batch")}
                />
              </Grid>
              <Grid size={8}>
                <TextField
                  id="production_site"
                  label="Рабочий центр"
                  variant="outlined"
                  fullWidth
                  value={form.productionSite}
                  onChange={handleChange("productionSite")}
                />
              </Grid>
              <Grid size={4}>
                <TextField
                  id="material_weight"
                  label="Масса навески, кг"
                  variant="outlined"
                  fullWidth
                  value={form.materialWeight}
                  onChange={handleChange("materialWeight")}
                />
              </Grid>
              <Grid size={4}>
                <TextField
                  id="batch_list_release_date"
                  label="Дата выдачи карты"
                  variant="outlined"
                  fullWidth
                  value={form.releaseDate}
                  onChange={handleChange("releaseDate")}
                />
              </Grid>
              <Grid size={4}>
                <TextField
                  id="issued_by"
                  label="Выдал"
                  variant="outlined"
                  fullWidth
                  value={form.issuedBy}
                  onChange={handleChange("issuedBy")}
                />
              </Grid>
              <Grid size={4}>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={submitting}
                  onClick={handleSubmit}
                  sx={{
                    height: "56px",
                    backgroundColor: "#6b6375",
                  }}
                >
                  {submitting ? "Создаём..." : "Создать"}
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

export default BatchesPage;
