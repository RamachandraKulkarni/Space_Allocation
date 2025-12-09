import { Paper } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import clsx from 'clsx';
import type { AllocationResult } from '../types';

const columns: GridColDef[] = [
  { field: 'floorId', headerName: 'Floor ID', flex: 1, minWidth: 180 },
  { field: 'building', headerName: 'Building', flex: 0.6, minWidth: 150 },
  { field: 'floorLabel', headerName: 'Floor', flex: 0.6, minWidth: 140 },
  { field: 'baseCapacity', headerName: 'Base Capacity', type: 'number', flex: 0.5 },
  { field: 'totalCapacity', headerName: 'Max Capacity', type: 'number', flex: 0.5 },
  { field: 'extraCapacityAllowed', headerName: 'Extra Allowance', type: 'number', flex: 0.5 },
  { field: 'extraCapacityUsed', headerName: 'Extra Used', type: 'number', flex: 0.5 },
  { field: 'remainingBuffer', headerName: 'Remaining Buffer', type: 'number', flex: 0.5 },
];

type Props = {
  allocation?: AllocationResult | null;
};

export function FloorSummary({ allocation }: Props) {
  if (!allocation) {
    return null;
  }

  return (
    <Paper elevation={1}>
      <DataGrid
        autoHeight
        rows={allocation.floorStates}
        columns={columns}
        disableRowSelectionOnClick
        getRowId={(row) => row.floorId}
        getRowClassName={(params) =>
          clsx({ 'row-capacity': params.row.remainingBuffer <= 0 })
        }
        sx={{
          '& .row-capacity': {
            bgcolor: (theme) => theme.palette.error.light,
            color: (theme) => theme.palette.error.contrastText,
          },
        }}
      />
    </Paper>
  );
}
