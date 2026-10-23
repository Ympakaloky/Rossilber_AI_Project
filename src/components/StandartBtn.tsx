import { Button } from "@mui/material";

interface StandartBtnProps {
  name: string;
  action: () => void;
}

function StandartBtn({ name, action }: StandartBtnProps) {
  return (
    <Button
      variant="contained"
      color="primary"
      onClick={action}
      fullWidth
      sx={{
        minWidth: 120,
        height: "100%", // растягиваем по высоте обёртки
        textTransform: "none",
        backgroundColor: "var(--accent-bg)",
        color: "white",
      }}
    >
      {name}
    </Button>
  );
}

export default StandartBtn;
