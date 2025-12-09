export type MemberRoom = {
  id: string;
  name: string;
  capacity: number;
  included: boolean;
};

export type Room = {
  id: string;
  building: string;
  floor: string;
  name: string;
  baseCapacity: number;
  area: number;
  combinedMembers?: string[];
  memberRooms?: MemberRoom[];
  mode?: string;
  included?: boolean;
};

export type Floor = {
  id: string;
  building: string;
  floor: string;
  totalArea: number;
  totalCapacity: number;
  baseCapacity: number;
};

export type ProgramInput = {
  id: string;
  label: string;
  size: number;
};

/** @deprecated Use ProgramInput */
export type CohortInput = ProgramInput;

export type Studio = {
  id: string;
  size: number;
  programs: Record<string, number>;
};

/** @deprecated Use Studio */
export type Group = Studio;

export type StudioSummary = {
  studios: Studio[];
  totalStudents: number;
  totalStudios: number;
  remainder: number;
};

/** @deprecated Use StudioSummary */
export type GroupingSummary = StudioSummary;

export type AllocationOptions = {
  shuffleSeed?: number;
};

export type RoomAssignment = {
  roomId: string;
  roomName: string;
  building: string;
  floor: string;
  baseCapacity: number;
  dynamicCapacity: number;
  extraCapacityUsed: number;
  studios: Studio[];
  memberRooms?: string[];
};

export type StaffCounts = {
  faculty: number;
  taFa: number;
  grader: number;
};

export type FinanceInputs = {
  totalStudentsOverride?: number | null;
  studioCap: number;
  semestersPerYear: number;
  taCompensation: number;
  staffCounts: StaffCounts;
};

export type CompensationBreakdown = {
  role: string;
  compensation: number;
  ere: number;
  risk: number;
  techFee: number;
  adminCharge: number;
  totalCost: number;
};

export type FinanceSummary = {
  autoTotalStudents: number;
  effectiveTotalStudents: number;
  numberOfStudios: number;
  suggestedTaCount: number;
  staffCounts: StaffCounts;
  costPerSemester: number;
  costPerYear: number;
  totalAnnualCost: number;
  breakdown: CompensationBreakdown[];
};

export type FloorAllocationState = {
  floorId: string;
  building: string;
  floorLabel: string;
  totalCapacity: number;
  baseCapacity: number;
  extraCapacityAllowed: number;
  extraCapacityUsed: number;
  remainingBuffer: number;
};

export type AllocationResult = {
  assignments: RoomAssignment[];
  floorStates: FloorAllocationState[];
  unassignedStudios: Studio[];
  studioToRoom: Record<string, string | null>;
  diagnostics: string[];
};
