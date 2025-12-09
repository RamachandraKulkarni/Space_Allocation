import {
  Alert,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { AllocationForm } from '../components/AllocationForm';
import { StudioTable } from '../components/GroupTable';
import { RoomTable } from '../components/RoomTable';
import { FloorSummary } from '../components/FloorSummary';
import { DiagnosticsPanel } from '../components/DiagnosticsPanel';
import { AllocationActions } from '../components/AllocationActions';
import { FinanceSummaryPanel } from '../components/FinanceSummaryPanel';
import { RoomSelectionPanel } from '../components/RoomSelectionPanel';
import { useSpaceData } from '../hooks/useSpaceData';
import { useAllocationEngine } from '../hooks/useAllocationEngine';
import type { Floor, Room } from '../types';

export function DashboardPage() {
  const { rooms, floors, loading, error, toggleRoom, toggleMemberRoom } = useSpaceData();
  const { studioSummary, result, finance, runAllocation, rotateAllocation, exportCsv } = useAllocationEngine(
    rooms,
    floors
  );

  const totals = buildTotals(rooms, floors, studioSummary?.totalStudents);

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 4,
        bgcolor: 'grey.50',
        minHeight: '100vh',
      }}
    >
      <Stack gap={4}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: 'primary.main',
            color: 'white',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Space Allocation Planner
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
            Allocate students to rooms and model staffing costs
          </Typography>
        </Paper>
        {loading && (
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <CircularProgress />
          </Paper>
        )}
        {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
        {!loading && !error && (
          <Stack gap={4}>
            <AllocationForm loading={loading} onSubmit={runAllocation} />
            <RoomSelectionPanel rooms={rooms} onToggle={toggleRoom} onToggleMember={toggleMemberRoom} />
            <TotalsRow {...totals} />
            <AllocationActions onRotate={rotateAllocation} onExport={exportCsv} disabled={!result} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Studios
                  </Typography>
                  <StudioTable studios={studioSummary?.studios ?? []} allocation={result} />
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Rooms
                  </Typography>
                  <RoomTable allocation={result} />
                </Paper>
              </Grid>
            </Grid>
            <FinanceSummaryPanel finance={finance} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Paper elevation={1} sx={{ p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Floor Limits
                  </Typography>
                  <FloorSummary allocation={result} />
                </Paper>
              </Grid>
              <Grid item xs={12} md={5}>
                <DiagnosticsPanel allocation={result} />
              </Grid>
            </Grid>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

type TotalProps = {
  roomCount: number;
  floorCount: number;
  totalCapacity: number;
  totalStudents?: number;
};

function TotalsRow({ roomCount, floorCount, totalCapacity, totalStudents }: TotalProps) {
  const items = [
    { label: 'Rooms', value: roomCount },
    { label: 'Floors', value: floorCount },
    { label: 'Max Capacity', value: totalCapacity },
    { label: 'Students Required', value: totalStudents ?? '—' },
  ];

  return (
    <Grid container spacing={2}>
      {items.map((item) => (
        <Grid item key={item.label} xs={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 1,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {item.label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.5 }}>
              {item.value}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

function buildTotals(rooms: Room[], floors: Floor[], students?: number) {
  const includedRooms = rooms.filter((r) => r.included !== false);
  const roomCount = includedRooms.length;
  const floorCount = floors.length;
  const totalCapacity = includedRooms.reduce((sum, room) => sum + room.baseCapacity, 0);

  return {
    roomCount,
    floorCount,
    totalCapacity,
    totalStudents: students,
  };
}
