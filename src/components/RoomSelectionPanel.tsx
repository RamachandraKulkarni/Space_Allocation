import { useState, useMemo } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { Room } from '../types';

// Inline expand icon to avoid @mui/icons-material version conflicts
function ExpandMoreIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
    </svg>
  );
}

type Props = {
  rooms: Room[];
  onToggle: (roomId: string, included: boolean) => void;
  onToggleMember: (zoneId: string, memberRoomId: string, included: boolean) => void;
};

type BuildingFloorGroup = {
  building: string;
  floor: string;
  rooms: Room[];
  totalCapacity: number;
  includedCapacity: number;
};

export function RoomSelectionPanel({ rooms, onToggle, onToggleMember }: Props) {
  const [expanded, setExpanded] = useState<string | false>(false);

  // Group rooms by building and floor
  const grouped = useMemo(() => {
    const map = new Map<string, BuildingFloorGroup>();

    rooms.forEach((room) => {
      const key = `${room.building}__${room.floor}`;
      const group = map.get(key) ?? {
        building: room.building,
        floor: room.floor,
        rooms: [],
        totalCapacity: 0,
        includedCapacity: 0,
      };

      group.rooms.push(room);

      // Calculate capacities
      if (room.memberRooms && room.memberRooms.length > 0) {
        const totalMemberCapacity = room.memberRooms.reduce((sum, m) => sum + m.capacity, 0);
        const includedMemberCapacity = room.memberRooms
          .filter((m) => m.included)
          .reduce((sum, m) => sum + m.capacity, 0);
        group.totalCapacity += totalMemberCapacity;
        group.includedCapacity += includedMemberCapacity;
      } else {
        group.totalCapacity += room.baseCapacity;
        group.includedCapacity += room.included !== false ? room.baseCapacity : 0;
      }

      map.set(key, group);
    });

    return Array.from(map.values()).sort((a, b) => {
      const buildingCompare = a.building.localeCompare(b.building);
      if (buildingCompare !== 0) return buildingCompare;
      return a.floor.localeCompare(b.floor);
    });
  }, [rooms]);

  const totalIncluded = grouped.reduce((sum, g) => sum + g.includedCapacity, 0);
  const totalCapacity = grouped.reduce((sum, g) => sum + g.totalCapacity, 0);

  const handleAccordionChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        borderRadius: 1,
      }}
    >
      <Stack gap={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Room Selection
          </Typography>
          <Chip
            label={`${totalIncluded} / ${totalCapacity} capacity included`}
            color={totalIncluded === totalCapacity ? 'success' : 'primary'}
            sx={{ fontWeight: 500 }}
          />
        </Stack>

        {grouped.map((group) => {
          const groupKey = `${group.building}__${group.floor}`;
          const isExpanded = expanded === groupKey;
          const isFullyIncluded = group.includedCapacity === group.totalCapacity;
          return (
            <Accordion
              key={groupKey}
              expanded={isExpanded}
              onChange={handleAccordionChange(groupKey)}
              disableGutters
              sx={{
                '&:before': { display: 'none' },
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: isFullyIncluded ? 'success.light' : 'grey.300',
                boxShadow: isExpanded ? 2 : 0,
                transition: 'all 0.2s ease',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: isExpanded ? 'primary.50' : isFullyIncluded ? 'success.50' : 'grey.50',
                  minHeight: 64,
                  '&:hover': { bgcolor: 'primary.50' },
                  transition: 'background-color 0.2s ease',
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  gap={2}
                  flexWrap="wrap"
                  sx={{ width: '100%', pr: 2 }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, minWidth: 200, color: 'text.primary' }}
                  >
                    {group.building}
                  </Typography>
                  <Chip
                    label={group.floor}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Box sx={{ flexGrow: 1 }} />
                  <Chip
                    label={`${group.includedCapacity} / ${group.totalCapacity} seats`}
                    size="small"
                    color={isFullyIncluded ? 'success' : 'warning'}
                    variant="filled"
                    sx={{ fontWeight: 600 }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ minWidth: 70, textAlign: 'right' }}
                  >
                    {group.rooms.length} zone{group.rooms.length !== 1 ? 's' : ''}
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Stack gap={2}>
                  {group.rooms.map((room) => (
                    <ZoneCard
                      key={room.id}
                      room={room}
                      onToggle={onToggle}
                      onToggleMember={onToggleMember}
                    />
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    </Paper>
  );
}

type ZoneCardProps = {
  room: Room;
  onToggle: (roomId: string, included: boolean) => void;
  onToggleMember: (zoneId: string, memberRoomId: string, included: boolean) => void;
};

function ZoneCard({ room, onToggle, onToggleMember }: ZoneCardProps) {
  const hasMembers = room.memberRooms && room.memberRooms.length > 0;
  const includedCount = room.memberRooms?.filter((m) => m.included).length ?? 0;
  const totalCount = room.memberRooms?.length ?? 0;
  const allIncluded = hasMembers ? includedCount === totalCount : room.included !== false;
  const someIncluded = hasMembers ? includedCount > 0 && includedCount < totalCount : false;

  const handleZoneToggle = (checked: boolean) => {
    if (hasMembers && room.memberRooms) {
      // Toggle all member rooms
      room.memberRooms.forEach((member) => {
        onToggleMember(room.id, member.id, checked);
      });
    } else {
      onToggle(room.id, checked);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        borderColor: allIncluded ? 'success.light' : someIncluded ? 'warning.light' : 'grey.300',
        borderWidth: 2,
        bgcolor: 'background.paper',
        transition: 'all 0.2s ease',
      }}
    >
      <Stack gap={2}>
        {/* Zone Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            bgcolor: allIncluded ? 'success.50' : someIncluded ? 'warning.50' : 'grey.50',
            mx: -2,
            mt: -2,
            px: 2,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={allIncluded}
                indeterminate={someIncluded}
                onChange={(e) => handleZoneToggle(e.target.checked)}
                color={allIncluded ? 'success' : 'primary'}
              />
            }
            label={
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {room.name}
              </Typography>
            }
          />
          <Stack direction="row" alignItems="center" gap={1}>
            {hasMembers && (
              <Chip
                label={`${includedCount}/${totalCount} rooms`}
                size="small"
                color={allIncluded ? 'success' : someIncluded ? 'warning' : 'default'}
                variant="filled"
              />
            )}
            <Chip
              label={`${room.baseCapacity} seats`}
              size="small"
              variant="outlined"
              color="info"
            />
          </Stack>
        </Stack>

        {/* Member Rooms Table */}
        {hasMembers && room.memberRooms && (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 700, width: 80 }}>Include</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Room</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Capacity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {room.memberRooms.map((member) => (
                  <TableRow
                    key={member.id}
                    sx={{
                      bgcolor: member.included ? 'success.50' : 'transparent',
                      '&:hover': { bgcolor: member.included ? 'success.100' : 'grey.50' },
                    }}
                  >
                    <TableCell>
                      <Checkbox
                        size="small"
                        checked={member.included}
                        onChange={(e) => onToggleMember(room.id, member.id, e.target.checked)}
                        color="success"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Room {member.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={member.capacity}
                        size="small"
                        variant="outlined"
                        color={member.included ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
