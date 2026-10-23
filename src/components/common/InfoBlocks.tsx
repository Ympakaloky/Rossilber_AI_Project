import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { dash } from "../../utils/format";

interface InfoRowProps {
  label: string;
  value: string;
  // Если задана, подпись получает фиксированную ширину (для выравнивания в столбик)
  labelWidth?: number;
}

export function InfoRow({ label, value, labelWidth }: InfoRowProps) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: labelWidth ? 2 : 1,
        alignItems: "baseline",
      }}
    >
      <Typography
        sx={{
          color: "text.secondary",
          fontSize: "0.8125rem",
          minWidth: labelWidth ?? 0,
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.9rem", fontWeight: 600 }}>
        {dash(value)}
      </Typography>
    </Box>
  );
}

// Несколько значений в одну строку; на узком экране переносятся
export function InfoLine({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        columnGap: 4,
        rowGap: 1,
      }}
    >
      {children}
    </Box>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return (
    <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", mt: 1 }}>
      {children}
    </Typography>
  );
}
