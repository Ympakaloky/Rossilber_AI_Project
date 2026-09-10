import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import logoSvg from "../../images/label2.svg";
import { Link } from "react-router-dom";
import { Typography } from "@mui/material";

export default function ButtonAppBar() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="static"
        sx={{
          backgroundColor: "var(--accent-bg)",
        }}
      >
        <Toolbar>
          <Link to="/">
            <img
              src={logoSvg}
              alt="Logo"
              style={{ height: "40px", width: "auto" }}
            />
          </Link>

          <Typography
            variant="h6"
            component="div"
            sx={{
              color: "#00CED1",
              marginLeft: "10px",
            }}
          >
            * AI PRODUCTION
          </Typography>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
