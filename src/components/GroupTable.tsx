import { Paper } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import clsx from 'clsx';
import type { AllocationResult, Studio } from '../types';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'Studio ID', flex: 0.5, minWidth: 120 },
  { field: 'size', headerName: 'Size', flex: 0.3, minWidth: 100, type: 'number' },
  { field: 'programMix', headerName: 'Program Mix', flex: 1, minWidth: 200 },
  { field: 'assignedRoom', headerName: 'Assigned Room', flex: 0.6, minWidth: 140 },
  { field: 'status', headerName: 'Status', flex: 0.4, minWidth: 120 },
];

type Props = {
  studios: Studio[];
  allocation?: AllocationResult | null;
};

export function StudioTable({ studios, allocation }: Props) {
  const assignmentMap = new Map<string, string>();
  allocation?.assignments.forEach((assignment) => {
    assignment.studios.forEach((studio) => assignmentMap.set(studio.id, assignment.roomName));
  });

  const rows = studios.map((studio) => {
    const assignedRoomId = allocation?.studioToRoom[studio.id] ?? null;
    const assignedRoomName = assignmentMap.get(studio.id);

    return {
      id: studio.id,
      size: studio.size,
      programMix: formatPrograms(studio),
      assignedRoom: assignedRoomName ?? '—',
      status: assignedRoomId ? 'Assigned' : 'Unassigned',
      unassigned: !assignedRoomId,
    };
  });

  return (
    <Paper elevation={1}>
      <DataGrid
        autoHeight
        rows={rows}
        columns={columns}
        disableRowSelectionOnClick
        getRowClassName={(params) => clsx({ 'row-unassigned': params.row.unassigned })}
        sx={{
          '& .row-unassigned': {
            bgcolor: (theme) => theme.palette.error.light,
            color: (theme) => theme.palette.error.contrastText,
          },
        }}
      />
    </Paper>
  );
}

function formatPrograms(studio: Studio): string {
  const entries = Object.entries(studio.programs);
  if (entries.length === 0) {
    return '—';
  }
  return entries.map(([label, size]) => `${label}: ${size}`).join(' | ');
}
