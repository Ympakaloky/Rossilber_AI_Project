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
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 2,
            }}
          >
            <StandartBtn
              name="Создание партии"
              action={() => navigate("/batches")}
            />
            <StandartBtn
              name="Список партий"
              action={() => navigate("/batchesList")}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 2,
            }}
          >
            <StandartBtn
              name="Выполнение"
              action={() => navigate("/actual_production")}
            />
            <StandartBtn
              name="Тех карты"
              action={() => navigate("/productionList")}
            />
          </Box>
          <StandartBtn name="Архив ТК" action={() => navigate("/archive")} />
        </Box>
      </Box>
    </Box>
  );
}

export default PreviewPage;
