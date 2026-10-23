import { TextField } from "@mui/material";
import { compactPadding, smallText } from "./tableStyles";

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  hideLabel?: boolean;
}

// Поле ввода. Вынесено на уровень модуля, а не внутрь страницы: компонент,
// объявленный внутри другого компонента, пересоздаётся при каждой
// перерисовке, и поле теряло бы фокус после каждой набранной буквы.
export default function Field({
  label,
  value,
  onChange,
  error = false,
  hideLabel = false,
}: FieldProps) {
  return (
    <TextField
      label={hideLabel ? undefined : label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      size="small"
      fullWidth
      sx={[smallText, hideLabel && compactPadding]}
      slotProps={{ htmlInput: { "aria-label": label } }}
    />
  );
}
