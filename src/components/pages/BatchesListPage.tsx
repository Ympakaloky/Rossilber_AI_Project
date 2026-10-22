import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Header from "../Header";
import type { BatchRow } from "../../types/batch";

function BatchesListPage() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError(err instanceof Error ? err.message : "Неизвестная ошибка");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
                      <TableCell>Масса навески</TableCell>
                      <TableCell>Дата выдачи</TableCell>
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
                            onClick={() => console.log("изменить", b.row)}
                          >
                            Изменить
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
                            Удалить
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
    </Box>
  );
}

export default BatchesListPage;
