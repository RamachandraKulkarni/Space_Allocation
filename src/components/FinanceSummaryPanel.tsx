import { Paper, Stack, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import type { FinanceSummary } from '../types';

type Props = {
  finance: FinanceSummary | null;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const columns: GridColDef[] = [
  { field: 'role', headerName: 'Role', flex: 1, minWidth: 120 },
  {
    field: 'compensation',
    headerName: 'Compensation',
    flex: 1,
    minWidth: 120,
    valueFormatter: (value: number) => currencyFormatter.format(value),
  },
  {
    field: 'ere',
    headerName: 'ERE',
    flex: 1,
    minWidth: 100,
    valueFormatter: (value: number) => currencyFormatter.format(value),
  },
  {
    field: 'risk',
    headerName: 'Risk',
    flex: 1,
    minWidth: 80,
    valueFormatter: (value: number) => currencyFormatter.format(value),
  },
  {
    field: 'techFee',
    headerName: 'Tech Fee',
    flex: 1,
    minWidth: 90,
    valueFormatter: (value: number) => currencyFormatter.format(value),
  },
  {
    field: 'adminCharge',
    headerName: 'Admin',
    flex: 1,
    minWidth: 90,
    valueFormatter: (value: number) => currencyFormatter.format(value),
  },
  {
    field: 'totalCost',
    headerName: 'Total Cost',
    flex: 1,
    minWidth: 110,
    valueFormatter: (value: number) => currencyFormatter.format(value),
  },
];

export function FinanceSummaryPanel({ finance }: Props) {
  if (!finance) {
    return (
      <Paper
        elevation={1}
        sx={{
          p: 3,
          borderRadius: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Run an allocation to view financial summary.
        </Typography>
      </Paper>
    );
  }

  const rows = finance.breakdown.map((row, index) => ({ id: index, ...row }));

  return (
    <Stack gap={2}>
      <Paper
        elevation={1}
        sx={{
          p: 3,
          borderRadius: 1,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
          Finance Summary
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={3}>
          <Stat label="Total Students" value={finance.effectiveTotalStudents} />
          <Stat label="Studios" value={finance.numberOfStudios} />
          <Stat label="Suggested TAs/FAs" value={finance.suggestedTaCount} />
          <Stat label="Cost / Semester" value={currencyFormatter.format(finance.costPerSemester)} />
          <Stat label="Cost / Year" value={currencyFormatter.format(finance.costPerYear)} />
          <Stat label="Total Annual Cost" value={currencyFormatter.format(finance.totalAnnualCost)} highlight />
        </Stack>
      </Paper>
      <Paper
        elevation={1}
        sx={{
          height: 280,
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          density="compact"
          hideFooter
          disableRowSelectionOnClick
        />
      </Paper>
    </Stack>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        minWidth: 140,
        borderRadius: 1,
        borderColor: highlight ? 'primary.main' : 'grey.300',
        bgcolor: highlight ? 'primary.50' : 'background.paper',
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          color: highlight ? 'primary.main' : 'text.primary',
          mt: 0.5,
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}
