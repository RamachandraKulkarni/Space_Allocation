import { Paper } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import clsx from 'clsx';
import type { AllocationResult } from '../types';
import { buildFloorId } from '../utils/spaceTransform';

type Props = {
  allocation?: AllocationResult | null;
};

const columns: GridColDef[] = [
  { field: 'roomName', headerName: 'Room', flex: 1, minWidth: 180 },
  { field: 'building', headerName: 'Building', flex: 0.6, minWidth: 140 },
  { field: 'floor', headerName: 'Floor', flex: 0.6, minWidth: 140 },
  { field: 'memberRooms', headerName: 'Member Rooms', flex: 0.8, minWidth: 160 },
  { field: 'baseCapacity', headerName: 'Base', type: 'number', flex: 0.4, minWidth: 110 },
  { field: 'dynamicCapacity', headerName: 'Dynamic', type: 'number', flex: 0.4, minWidth: 120 },
  { field: 'extraCapacityUsed', headerName: 'Extra Used', type: 'number', flex: 0.4, minWidth: 120 },
  { field: 'remainingFloorBuffer', headerName: 'Floor Buffer', type: 'number', flex: 0.5, minWidth: 140 },
  { field: 'studios', headerName: 'Assigned Studios', flex: 1.2, minWidth: 200 },
];

export function RoomTable({ allocation }: Props) {
  if (!allocation) {
    return (
      <Paper elevation={1} sx={{ p: 3 }}>
        No allocation calculated yet.
      </Paper>
    );
  }

  const floorBuffer = new Map(
    allocation.floorStates.map((floor) => [floor.floorId, floor.remainingBuffer])
  );

  const rows = allocation.assignments.map((assignment) => {
    const floorId = buildFloorId(assignment.building, assignment.floor);
    const remainingFloorBuffer = floorBuffer.get(floorId) ?? 0;

    return {
      id: assignment.roomId,
      roomName: assignment.roomName,
      building: assignment.building,
      floor: assignment.floor,
      memberRooms: formatMemberRooms(assignment.memberRooms, assignment.roomId),
      baseCapacity: assignment.baseCapacity,
      dynamicCapacity: assignment.dynamicCapacity,
      extraCapacityUsed: assignment.extraCapacityUsed,
      remainingFloorBuffer,
      studios: assignment.studios.map((studio) => `${studio.id} (${studio.size})`).join(' | ') || '—',
      overCapacity: assignment.extraCapacityUsed > 0,
    };
  });

  return (
    <Paper elevation={1}>
      <DataGrid
        autoHeight
        rows={rows}
        columns={columns}
        disableRowSelectionOnClick
        getRowClassName={(params) => clsx({ 'row-extra': params.row.overCapacity })}
        sx={{
          '& .row-extra': {
            bgcolor: (theme) => theme.palette.warning.light,
            color: (theme) => theme.palette.warning.contrastText,
          },
        }}
      />
    </Paper>
  );
}

function formatMemberRooms(memberRooms: string[] | undefined, fallbackId: string): string {
  if (memberRooms && memberRooms.length > 0) {
    return memberRooms.join(', ');
  }
  return fallbackId;
}
