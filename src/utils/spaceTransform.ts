import type { Floor, MemberRoom, Room } from '../types';

export type SpaceDivisionRow = {
  BUILDING?: string;
  LEVEL?: string;
  STUDIO?: string;
  ROOM?: string;
  'ASTRA OCCUPANCY'?: string;
  'GROUP ID'?: string;
  'OCCUPANCY %'?: string;
  'SEATS LEFT'?: string;
  NOTES?: string;
};

export type CombinedSpaceRow = {
  combined_id?: string;
  members?: string;
  capacity_override?: string;
  mode?: string;
};

export type SpaceDataset = {
  rooms: Room[];
  floors: Floor[];
};

const FLOOR_BUFFER_RATIO = 0.15; // allow 15% above base capacity per floor when redistributing

export function buildSpaceDataset(spaceRows: SpaceDivisionRow[], combinedRows: CombinedSpaceRow[]): SpaceDataset {
  const rawRooms = normalizeSpaceRows(spaceRows);
  const { rooms, consumed } = buildRoomsFromCombinedSpaces(rawRooms, combinedRows);

  rawRooms.forEach((room) => {
    if (!consumed.has(room.id)) {
      rooms.push(room);
    }
  });

  const floors = summarizeFloors(rooms);

  return { rooms, floors };
}

function normalizeSpaceRows(rows: SpaceDivisionRow[]): Room[] {
  let currentBuilding = '';
  let currentLevel = '';

  const normalized: Room[] = [];

  rows.forEach((row) => {
    if (row.BUILDING && row.BUILDING.trim()) {
      currentBuilding = row.BUILDING.trim();
    }

    if (row.LEVEL && row.LEVEL.trim()) {
      currentLevel = row.LEVEL.trim();
    }

    const roomId = (row.ROOM ?? '').toString().trim();
    if (!roomId) {
      return;
    }

    const baseCapacity = parseNumber(row['ASTRA OCCUPANCY']);
    if (!baseCapacity) {
      return;
    }

    const name = buildRoomName(row.STUDIO, roomId);

    normalized.push({
      id: roomId,
      building: currentBuilding,
      floor: currentLevel,
      name,
      baseCapacity,
      // Without explicit area data we fall back to capacity as proxy.
      area: baseCapacity,
    });
  });

  return normalized;
}

function buildRoomsFromCombinedSpaces(rawRooms: Room[], combinedRows: CombinedSpaceRow[]): {
  rooms: Room[];
  consumed: Set<string>;
} {
  const roomMap = new Map<string, Room>();
  rawRooms.forEach((room) => roomMap.set(room.id, room));

  const consumed = new Set<string>();
  const rooms: Room[] = [];

  combinedRows.forEach((record) => {
    const members = (record.members ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (!record.combined_id || members.length === 0) {
      return;
    }

    const memberRooms = members
      .map((memberId) => roomMap.get(memberId))
      .filter((room): room is Room => Boolean(room));

    if (memberRooms.length === 0) {
      return;
    }

    memberRooms.forEach((room) => consumed.add(room.id));

    const capacityOverride = parseNumber(record.capacity_override);
    const baseCapacity = capacityOverride || memberRooms.reduce((sum, room) => sum + room.baseCapacity, 0);
    const area = memberRooms.reduce((sum, room) => sum + room.area, 0);

    const reference = memberRooms[0];

    // Build detailed member room info for individual selection
    const memberRoomDetails: MemberRoom[] = memberRooms.map((room) => ({
      id: room.id,
      name: room.name,
      capacity: room.baseCapacity,
      included: true,
    }));

    rooms.push({
      id: record.combined_id,
      building: reference.building,
      floor: reference.floor,
      name: `Zone ${record.combined_id}`,
      baseCapacity,
      area,
      combinedMembers: members,
      memberRooms: memberRoomDetails,
      mode: record.mode,
    });
  });

  return { rooms, consumed };
}

function summarizeFloors(rooms: Room[]): Floor[] {
  const floorMap = new Map<string, Floor>();

  rooms.forEach((room) => {
    const floorId = buildFloorId(room.building, room.floor);
    const entry = floorMap.get(floorId) ?? {
      id: floorId,
      building: room.building,
      floor: room.floor,
      totalArea: 0,
      totalCapacity: 0,
      baseCapacity: 0,
    };

    entry.totalArea += room.area;
    entry.baseCapacity += room.baseCapacity;
    entry.totalCapacity = Math.round(entry.baseCapacity * (1 + FLOOR_BUFFER_RATIO));

    floorMap.set(floorId, entry);
  });

  return Array.from(floorMap.values());
}

export function buildFloorId(building: string, floor: string): string {
  return `${building}__${floor}`;
}

function buildRoomName(studio: string | undefined, roomId: string): string {
  const cleanedStudio = (studio ?? '').replace(/\s+/g, ' ').trim();
  if (cleanedStudio && cleanedStudio !== '-') {
    return `${cleanedStudio} (${roomId})`;
  }

  return `Room ${roomId}`;
}

function parseNumber(value?: string | number): number {
  if (typeof value === 'number') {
    return value;
  }

  if (!value) {
    return 0;
  }

  const parsed = Number(String(value).replace(/[^0-9.-]+/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}
