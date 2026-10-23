import { useEffect, useState } from "react";
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
import { InfoLine, InfoRow, SectionTitle } from "../common/InfoBlocks";
import { tableSx } from "../common/tableStyles";
import { dash, formatDateTime } from "../../utils/format";
import type { InspectionRecord } from "../../types/finalInspection";

function FinalnspectionListPage() {
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/final-inspection");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Не удалось загрузить протоколы");
        }
        setRecords(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Неизвестная ошибка");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Храним только id, а саму запись берём из списка: так панель
  // всегда показывает актуальные данные
  const selected = records.find((r) => r.protocolId === selectedId) ?? null;
  const panelOpen = drawerOpen && selected !== null;

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
              <Typography>Протоколов пока нет</Typography>
            )}

            {!loading && !error && records.length > 0 && (
              <TableContainer>
                <Table size="small" sx={tableSx}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Протокол №</TableCell>
                      <TableCell>Дата протокола</TableCell>
                      <TableCell>Партия</TableCell>
                      <TableCell>Рецепт</TableCell>
                      <TableCell>Дата производства</TableCell>
                      <TableCell>Исполнитель</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.map((r) => (
                      <TableRow
                        key={r.protocolId}
                        hover
                        selected={panelOpen && r.protocolId === selectedId}
                        tabIndex={0}
                        onClick={() => openRecord(r.protocolId)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") openRecord(r.protocolId);
                        }}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>{r.protocolNumber}</TableCell>
                        <TableCell>{r.protocolDate}</TableCell>
                        <TableCell>{r.batch}</TableCell>
                        <TableCell>{r.recipe}</TableCell>
                        <TableCell>{r.productionDate}</TableCell>
                        <TableCell>{r.executorName}</TableCell>
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
                gap: 2,
                px: 3,
                py: 1.5,
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="h6">
                Протокол № {selected.protocolNumber} от {selected.protocolDate}
              </Typography>
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
                <InfoRow label="Партия:" value={selected.batch} />
                <InfoRow
                  label="Дата производства:"
                  value={selected.productionDate}
                />
                <InfoRow
                  label="Отправлено:"
                  value={formatDateTime(selected.submittedAt)}
                />
              </InfoLine>

              <SectionTitle>Показатели</SectionTitle>
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
                    {selected.results.map((res) => (
                      <TableRow key={res.id}>
                        <TableCell>{res.id}</TableCell>
                        <TableCell>{res.indicator}</TableCell>
                        <TableCell>{dash(res.norm)}</TableCell>
                        <TableCell>{dash(res.actual)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <SectionTitle>Заключение</SectionTitle>
              <Typography sx={{ fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>
                {dash(selected.conclusion)}
              </Typography>

              <SectionTitle>Исполнитель</SectionTitle>
              <InfoLine>
                <InfoRow label="Должность:" value={selected.executorPosition} />
                <InfoRow label="Ф.И.О.:" value={selected.executorName} />
              </InfoLine>
            </Box>
          </>
        )}
      </Drawer>
    </Box>
  );
}

export default FinalnspectionListPage;
