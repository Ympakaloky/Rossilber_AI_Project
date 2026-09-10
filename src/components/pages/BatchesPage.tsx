import { Box, Button, Grid, TextField } from "@mui/material";
import Header from "../Header";

function BatchesPage() {
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
              backgroundColor: "#F4EBD0",
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
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  id="batch"
                  label="Партия"
                  variant="outlined"
                  fullWidth
                />
              </Grid>
              <Grid size={8}>
                <TextField
                  id="production_site"
                  label="Рабочий центр"
                  variant="outlined"
                  fullWidth
                />
              </Grid>
              <Grid size={4}>
                <TextField
                  id="material_weight"
                  label="Масса навески, кг"
                  variant="outlined"
                  fullWidth
                />
              </Grid>
              <Grid size={4}>
                <TextField
                  id="batch_list_release_date"
                  label="Дата выдачи карты"
                  variant="outlined"
                  fullWidth
                />
              </Grid>
              <Grid size={4}>
                <TextField
                  id="issued_by"
                  label="Выдал"
                  variant="outlined"
                  fullWidth
                />
              </Grid>
              <Grid size={4}>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    height: "56px",
                    backgroundColor: "#6b6375",
                  }}
                >
                  Создать
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default BatchesPage;
