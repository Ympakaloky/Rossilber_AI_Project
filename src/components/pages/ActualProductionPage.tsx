import { Box, Grid, TextField, Typography } from "@mui/material";
import Header from "../Header";

function ActualProductionPage() {
  const cellSx = {
    border: "1px solid #6b6375",
    padding: "2px 4px",
    textAlign: "center",
    fontSize: "0.50rem",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as const;

  // Заголовки таблицы

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
              color: "white",
            }}
          >
            <Grid container spacing={2}>
              <Grid size={6}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 4,
                  }}
                >
                  <Typography>Рецепт:</Typography>
                  <Typography variant="h5">АФ-789000/11</Typography>
                </Box>
              </Grid>
              <Grid size={6}>
                <Box sx={{ display: "flex", flexDirection: "row", gap: 4 }}>
                  <Typography>Партия:</Typography>
                  <Typography variant="h5">2026/777</Typography>
                </Box>
              </Grid>

              <Grid size={6}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 4,
                  }}
                >
                  <Typography>Рабочий центр:</Typography>
                  <Typography>Уфа, Технопарк</Typography>
                </Box>
              </Grid>
              <Grid size={6}>
                <Box sx={{ display: "flex", flexDirection: "row", gap: 4 }}>
                  <Typography>Масса навески:</Typography>
                  <Typography>1300 кг</Typography>
                </Box>
              </Grid>

              <Grid size={6}>
                <Box sx={{ display: "flex", flexDirection: "row", gap: 4 }}>
                  <Typography>Выдано:</Typography>
                  <Typography>02.09.2026</Typography>
                </Box>
              </Grid>
              <Grid size={6}>
                <Box sx={{ display: "flex", flexDirection: "row", gap: 4 }}>
                  <Typography>Выдал:</Typography>
                  <Typography>Иванов И.И.</Typography>
                </Box>
              </Grid>
              <Grid size={12}>
                <TextField
                  id="production_date"
                  label="Дата производства"
                  variant="outlined"
                  fullWidth
                />
              </Grid>
              <Grid size={12}>
                <Typography>
                  Дополнительные требования по ведению технологического
                  процесса:
                </Typography>
                <Typography>
                  Все работы выполняются в средствах индивидуальной защиты,
                </Typography>
                <Typography>с ограждением вращающихся частей</Typography>
              </Grid>

              <Grid container>
                {/* ===== Строка 1 (заголовки) ===== */}
                <Grid size={12} container>
                  <Grid size={1}>
                    <Typography sx={cellSx}>№</Typography>
                  </Grid>
                  <Grid size={1}>
                    <Typography sx={cellSx}>Тех. операция</Typography>
                  </Grid>
                  <Grid size={2}>
                    <Typography sx={cellSx}>Наименование</Typography>
                  </Grid>
                  <Grid size={1}>
                    <Typography sx={cellSx}>Кол-во</Typography>
                  </Grid>
                  <Grid size={1}>
                    <Typography sx={cellSx}>Ед.</Typography>
                  </Grid>
                  <Grid size={1}>
                    <Typography sx={cellSx}>Масса</Typography>
                  </Grid>
                  <Grid size={2}>
                    <Typography sx={cellSx}>Примечание</Typography>
                  </Grid>
                  <Grid size={1}>
                    <Typography sx={cellSx}>Растарил</Typography>
                  </Grid>
                  <Grid size={2}>
                    <Typography sx={cellSx}>Ответственный</Typography>
                  </Grid>
                </Grid>

                {/* ===== Строка 2 ===== */}
                <Grid size={12} container>
                  <Grid size={1}>
                    <Typography sx={cellSx}>1</Typography>
                  </Grid>
                  <Grid size={1}>
                    <Typography sx={cellSx}>Загрузка порошка</Typography>
                  </Grid>
                  <Grid size={2}>
                    <Typography sx={cellSx}>Сырьё №1</Typography>
                  </Grid>
                  <Grid size={1}>
                    <Typography sx={cellSx}>33</Typography>
                  </Grid>
                  <Grid size={1}>
                    <Typography sx={cellSx}>330</Typography>
                  </Grid>
                  <Grid size={1}>
                    <TextField
                      id="fact1"
                      label="Количество"
                      variant="outlined"
                      fullWidth
                      slotProps={{
                        input: { sx: { fontSize: "0.6rem" } },
                        inputLabel: { sx: { fontSize: "0.6rem" } },
                      }}
                    />
                  </Grid>
                  <Grid size={2}>
                    <TextField
                      id="prepare1"
                      label="Подготовил"
                      variant="outlined"
                      fullWidth
                      slotProps={{
                        input: { sx: { fontSize: "0.6rem" } },
                        inputLabel: { sx: { fontSize: "0.6rem" } },
                      }}
                    />
                  </Grid>
                  <Grid size={1}>
                    <TextField
                      id="name1"
                      label="Растарил"
                      variant="outlined"
                      fullWidth
                      slotProps={{
                        input: { sx: { fontSize: "0.6rem" } },
                        inputLabel: { sx: { fontSize: "0.6rem" } },
                      }}
                    />
                  </Grid>
                  <Grid size={2}>
                    <TextField
                      id="node1"
                      label="Примечание"
                      variant="outlined"
                      fullWidth
                      slotProps={{
                        input: { sx: { fontSize: "0.6rem" } },
                        inputLabel: { sx: { fontSize: "0.6rem" } },
                      }}
                    />
                  </Grid>
                </Grid>

                {/* ===== Строка 3 ===== */}
                <Grid size={12} container>
                  <Grid size={1}>
                    <Typography sx={cellSx}>2</Typography>
                  </Grid>
                  <Grid size={1}>
                    <Typography sx={cellSx}>Загрузка порошка</Typography>
                  </Grid>
                  <Grid size={2}>
                    <Typography sx={cellSx}>Сырьё №2</Typography>
                  </Grid>
                  <Grid size={1}>
                    <Typography sx={cellSx}>233</Typography>
                  </Grid>
                  <Grid size={1}>
                    <Typography sx={cellSx}>330</Typography>
                  </Grid>
                  <Grid size={1}>
                    <TextField
                      id="fact2"
                      label="Количество"
                      variant="outlined"
                      fullWidth
                      slotProps={{
                        input: { sx: { fontSize: "0.6rem" } },
                        inputLabel: { sx: { fontSize: "0.6rem" } },
                      }}
                    />
                  </Grid>
                  <Grid size={2}>
                    <TextField
                      id="prepare2"
                      label="Подготовил"
                      variant="outlined"
                      fullWidth
                      slotProps={{
                        input: { sx: { fontSize: "0.6rem" } },
                        inputLabel: { sx: { fontSize: "0.6rem" } },
                      }}
                    />
                  </Grid>
                  <Grid size={1}>
                    <TextField
                      id="name2"
                      label="Растарил"
                      variant="outlined"
                      fullWidth
                      slotProps={{
                        input: { sx: { fontSize: "0.6rem" } },
                        inputLabel: { sx: { fontSize: "0.6rem" } },
                      }}
                    />
                  </Grid>
                  <Grid size={2}>
                    <TextField
                      id="node2"
                      label="Примечание"
                      variant="outlined"
                      fullWidth
                      slotProps={{
                        input: { sx: { fontSize: "0.6rem" } },
                        inputLabel: { sx: { fontSize: "0.6rem" } },
                      }}
                    />
                  </Grid>
                </Grid>

                {/* ===== Строка 4 ===== */}
                <Grid size={12} container>
                  <Grid size={1}>
                    <Typography sx={cellSx}>3</Typography>
                  </Grid>
                  <Grid size={1}>
                    <Typography sx={cellSx}>Загрузка порошка</Typography>
                  </Grid>
                  <Grid size={2}>
                    <Typography sx={cellSx}>Сырьё №3</Typography>
                  </Grid>
                  <Grid size={1}>
                    <Typography sx={cellSx}>34</Typography>
                  </Grid>
                  <Grid size={1}>
                    <Typography sx={cellSx}>340</Typography>
                  </Grid>
                  <Grid size={1}>
                    <TextField
                      id="fact3"
                      label="Количество"
                      variant="outlined"
                      fullWidth
                      slotProps={{
                        input: { sx: { fontSize: "0.6rem" } },
                        inputLabel: { sx: { fontSize: "0.6rem" } },
                      }}
                    />
                  </Grid>
                  <Grid size={2}>
                    <TextField
                      id="prepare3"
                      label="Подготовил"
                      variant="outlined"
                      fullWidth
                      slotProps={{
                        input: { sx: { fontSize: "0.6rem" } },
                        inputLabel: { sx: { fontSize: "0.6rem" } },
                      }}
                    />
                  </Grid>
                  <Grid size={1}>
                    <TextField
                      id="name3"
                      label="Растарил"
                      variant="outlined"
                      fullWidth
                      slotProps={{
                        input: { sx: { fontSize: "0.6rem" } },
                        inputLabel: { sx: { fontSize: "0.6rem" } },
                      }}
                    />
                  </Grid>
                  <Grid size={2}>
                    <TextField
                      id="node3"
                      label="Примечание"
                      variant="outlined"
                      fullWidth
                      slotProps={{
                        input: { sx: { fontSize: "0.6rem" } },
                        inputLabel: { sx: { fontSize: "0.6rem" } },
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid size={12}>
                <Typography>Дозировка</Typography>
              </Grid>

              <Grid size={3}>
                <TextField
                  id="fact3"
                  label="Время начала"
                  variant="outlined"
                  fullWidth
                  slotProps={{
                    input: { sx: { fontSize: "0.6rem" } },
                    inputLabel: { sx: { fontSize: "0.6rem" } },
                  }}
                />
              </Grid>

              <Grid size={3}>
                <TextField
                  id="fact3"
                  label="Время окончания"
                  variant="outlined"
                  fullWidth
                  slotProps={{
                    input: { sx: { fontSize: "0.6rem" } },
                    inputLabel: { sx: { fontSize: "0.6rem" } },
                  }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  id="fact3"
                  label="ФИО"
                  variant="outlined"
                  fullWidth
                  slotProps={{
                    input: { sx: { fontSize: "0.6rem" } },
                    inputLabel: { sx: { fontSize: "0.6rem" } },
                  }}
                />
              </Grid>
              <Grid size={12}>
                <Typography>Проверка на влажность фактическая</Typography>
              </Grid>
              <Grid size={2}>
                <TextField
                  id="fact3"
                  label="Дата проверки"
                  variant="outlined"
                  fullWidth
                  slotProps={{
                    input: { sx: { fontSize: "0.6rem" } },
                    inputLabel: { sx: { fontSize: "0.6rem" } },
                  }}
                />
              </Grid>
              <Grid size={3}>
                <TextField
                  id="fact3"
                  label="Компонент"
                  variant="outlined"
                  fullWidth
                  slotProps={{
                    input: { sx: { fontSize: "0.6rem" } },
                    inputLabel: { sx: { fontSize: "0.6rem" } },
                  }}
                />
              </Grid>
              <Grid size={3}>
                <TextField
                  id="fact3"
                  label="Номер партии"
                  variant="outlined"
                  fullWidth
                  slotProps={{
                    input: { sx: { fontSize: "0.6rem" } },
                    inputLabel: { sx: { fontSize: "0.6rem" } },
                  }}
                />
              </Grid>
              <Grid size={2}>
                <TextField
                  id="fact3"
                  label="Норма по паспорту %"
                  variant="outlined"
                  fullWidth
                  slotProps={{
                    input: { sx: { fontSize: "0.6rem" } },
                    inputLabel: { sx: { fontSize: "0.6rem" } },
                  }}
                />
              </Grid>
              <Grid size={2}>
                <TextField
                  id="fact3"
                  label="Фактический результат, %"
                  variant="outlined"
                  fullWidth
                  slotProps={{
                    input: { sx: { fontSize: "0.6rem" } },
                    inputLabel: { sx: { fontSize: "0.6rem" } },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default ActualProductionPage;
