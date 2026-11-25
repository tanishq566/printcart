export function calcTieredPrintTotal(
  totalPages: number,
  firstPageRate: number,
  extraPageRate?: number | null
): number {
  if (!Number.isFinite(totalPages) || totalPages <= 0) return 0;
  const first = Number.isFinite(firstPageRate) ? firstPageRate : 0;
  const extra =
    extraPageRate !== null && extraPageRate !== undefined && Number.isFinite(extraPageRate)
      ? extraPageRate
      : first;
  const raw = totalPages === 1 ? first : first + (totalPages - 1) * extra;
  return Math.round(raw * 100) / 100;
}

export function hasTieredExtraRate(firstRate: number, extraRate?: number | null): boolean {
  return (
    extraRate !== null &&
    extraRate !== undefined &&
    Number.isFinite(extraRate) &&
    extraRate !== firstRate
  );
}
