import { Button, ButtonGroup, Stack } from '@mui/material';

type Props = {
  onRotate: () => void;
  onExport: () => void;
  disabled?: boolean;
};

export function AllocationActions({ onRotate, onExport, disabled }: Props) {
  return (
    <Stack direction="row" justifyContent="flex-end">
      <ButtonGroup variant="outlined" disabled={disabled}>
        <Button onClick={onRotate}>Rotate Allocation</Button>
        <Button onClick={onExport}>Export CSV</Button>
      </ButtonGroup>
    </Stack>
  );
}
