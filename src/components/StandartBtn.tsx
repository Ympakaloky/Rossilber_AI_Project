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
      sx={{
        minWidth: 120,
        textTransform: "none",
        backgroundColor: "var(--accent-bg)",
      }}
    >
      {name}
    </Button>
  );
}

export default StandartBtn;
