import type { FinanceInputs, FinanceSummary, StudioSummary, StaffCounts } from '../types';

const RISK_RATE = 0.011; // 1.1%
const TECH_FEE_RATE = 0.025; // 2.5%
const ADMIN_SERVICE_RATE = 0.085; // 8.5%

type RoleConfig = {
  key: keyof StaffCounts;
  role: string;
  compensation?: number;
  useTaCompensation?: boolean;
  ereRate: number;
};

const COMPENSATION_MATRIX: RoleConfig[] = [
  {
    key: 'faculty',
    role: 'Faculty',
    compensation: 85000,
    ereRate: 0.306,
  },
  {
    key: 'taFa',
    role: 'FA / TA',
    useTaCompensation: true,
    ereRate: 0.11,
  },
  {
    key: 'grader',
    role: 'Grader',
    compensation: 18000,
    ereRate: 0.019,
  },
];

export function buildFinanceSummary(
  studioSummary: StudioSummary | null,
  inputs: FinanceInputs
): FinanceSummary | null {
  if (!studioSummary) {
    return null;
  }

  const autoTotalStudents = studioSummary.totalStudents;
  const effectiveTotalStudents = normalizeOverride(inputs.totalStudentsOverride) ?? autoTotalStudents;
  const numberOfStudios = inputs.studioCap > 0 ? Math.ceil(effectiveTotalStudents / inputs.studioCap) : 0;
  const suggestedTaCount = numberOfStudios;

  const breakdown = buildCompensationBreakdown(inputs);

  // Sum cost across all staff based on their counts
  const totalAnnualCost = breakdown.reduce((sum, row) => sum + row.totalCost, 0);

  // Simple semester/year cost based on TA/FA line only (legacy behavior)
  const taFaRow = breakdown.find((r) => r.role.startsWith('FA / TA'));
  const costPerSemester = taFaRow ? (taFaRow.totalCost / inputs.semestersPerYear) : 0;
  const costPerYear = taFaRow ? taFaRow.totalCost : 0;

  return {
    autoTotalStudents,
    effectiveTotalStudents,
    numberOfStudios,
    suggestedTaCount,
    staffCounts: inputs.staffCounts,
    costPerSemester,
    costPerYear,
    totalAnnualCost,
    breakdown,
  };
}

function buildCompensationBreakdown(inputs: FinanceInputs) {
  return COMPENSATION_MATRIX.map((entry) => {
    const count = inputs.staffCounts[entry.key] ?? 0;
    const baseCompensation = entry.useTaCompensation
      ? inputs.taCompensation * inputs.semestersPerYear
      : entry.compensation ?? 0;
    const compensation = baseCompensation * count;
    const ere = compensation * entry.ereRate;
    const risk = compensation * RISK_RATE;
    const techFee = compensation * TECH_FEE_RATE;
    const subtotal = compensation + ere + risk + techFee;
    const adminCharge = subtotal * ADMIN_SERVICE_RATE;
    const totalCost = subtotal + adminCharge;

    return {
      role: `${entry.role} (x${count})`,
      compensation,
      ere,
      risk,
      techFee,
      adminCharge,
      totalCost,
    };
  });
}

function normalizeOverride(value?: number | null): number | undefined {
  if (value == null || Number.isNaN(value)) {
    return undefined;
  }
  return value;
}
