import { Box } from "@mui/material";
import Header from "../Header";
import StandartBtn from "../StandartBtn";
import { useNavigate } from "react-router-dom";

function PreviewPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Header />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "80vh",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "100%",
            maxWidth: 600,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "stretch",
              gap: 2,
            }}
          >
            <Box sx={{ flex: 1, display: "flex" }}>
              <StandartBtn
                name="Создание партии"
                action={() => navigate("/batches")}
              />
            </Box>
            <Box sx={{ flex: 1, display: "flex" }}>
              <StandartBtn
                name="Список партий"
                action={() => navigate("/batchesList")}
              />
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "stretch",
              gap: 2,
            }}
          >
            <Box sx={{ flex: 1, display: "flex" }}>
              <StandartBtn
                name="Выполнение"
                action={() => navigate("/actual_production")}
              />
            </Box>
            <Box sx={{ flex: 1, display: "flex" }}>
              <StandartBtn
                name="Тех карты"
                action={() => navigate("/productionList")}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default PreviewPage;
