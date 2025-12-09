import type { AllocationResult } from '../types';

export function exportAllocationCsv(result: AllocationResult): void {
  const rows: string[] = [];
  rows.push(
    [
      'Room ID',
      'Room Name',
      'Building',
      'Floor',
      'Base Capacity',
      'Dynamic Capacity',
      'Extra Capacity Used',
      'Assigned Studios',
    ].join(',')
  );

  result.assignments.forEach((assignment) => {
    const studioList = assignment.studios.map((studio) => `${studio.id} (${studio.size})`).join(' | ');
    rows.push(
      [
        assignment.roomId,
        assignment.roomName,
        assignment.building,
        assignment.floor,
        assignment.baseCapacity,
        assignment.dynamicCapacity,
        assignment.extraCapacityUsed,
        escapeCsv(studioList),
      ].join(',')
    );
  });

  if (result.unassignedStudios.length > 0) {
    rows.push('');
    rows.push('Unassigned Studios');
    result.unassignedStudios.forEach((studio) => {
      rows.push(`${studio.id},${studio.size}`);
    });
  }

  downloadCsv(rows.join('\n'), 'allocation-export.csv');
}

function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
