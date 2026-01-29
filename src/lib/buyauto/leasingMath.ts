export interface RestwertEstimate {
  restwertChf: number;
  residualPct: number;
  basePct: number;
  ageAdj: number;
  kmAdj: number;
  endKm: number;
  typicalEndKm: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateBaseResidualPct(termMonths: number): number {
  const points: Array<{ m: number; p: number }> = [
    { m: 24, p: 0.62 },
    { m: 36, p: 0.55 },
    { m: 48, p: 0.48 },
    { m: 60, p: 0.42 },
  ];

  const clamped = clamp(termMonths, points[0].m, points[points.length - 1].m);

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (clamped >= a.m && clamped <= b.m) {
      const t = (clamped - a.m) / (b.m - a.m);
      return lerp(a.p, b.p, t);
    }
  }

  return points[points.length - 1].p;
}

export function estimateRestwert(args: {
  priceChf: number;
  year: number;
  mileageKm: number;
  termMonths: number;
  kmPerYear: number;
  currentYear: number;
}): RestwertEstimate {
  const { priceChf, year, mileageKm, termMonths, kmPerYear, currentYear } = args;

  const ageYears = Math.max(0, currentYear - year);

  const basePct = interpolateBaseResidualPct(termMonths);

  const ageAdj = clamp(0.03 - 0.02 * ageYears, -0.15, 0.03);

  const endKm = mileageKm + kmPerYear * (termMonths / 12);
  const typicalEndKm = mileageKm + 15000 * (termMonths / 12);
  const deltaKm = endKm - typicalEndKm;
  const kmAdj = clamp(-deltaKm / 100000, -0.08, 0.04);

  const residualPct = clamp(basePct + ageAdj + kmAdj, 0.15, 0.7);

  const restwertChf = Math.round(priceChf * residualPct);

  return {
    restwertChf,
    residualPct,
    basePct,
    ageAdj,
    kmAdj,
    endKm,
    typicalEndKm,
  };
}

export interface LeasingRateEstimate {
  restwertChf: number;
  residualPct: number;
  downPaymentChf: number;
  monthlyAmort: number;
  monthlyInterest: number;
  monthlyRateChf: number;
}

export function estimateMonthlyLeasingRate(args: {
  priceChf: number;
  interestRatePct: number;
  downPaymentPct: number;
  termMonths: number;
  restwertChf: number;
}): LeasingRateEstimate {
  const { priceChf, interestRatePct, downPaymentPct, termMonths, restwertChf } = args;

  const downPaymentChf = priceChf * (downPaymentPct / 100);

  const principal = priceChf - downPaymentChf - restwertChf;
  const monthlyAmort = principal / termMonths;

  const monthlyInterest = ((priceChf - downPaymentChf + restwertChf) / 2) * (interestRatePct / 100) / 12;

  const monthlyRateChf = monthlyAmort + monthlyInterest;

  return {
    restwertChf,
    residualPct: priceChf > 0 ? restwertChf / priceChf : 0,
    downPaymentChf,
    monthlyAmort,
    monthlyInterest,
    monthlyRateChf,
  };
}

export function estimateTeaserMonthlyRateChf(args: {
  priceChf: number;
  year: number;
  mileageKm: number;
  interestRatePct: number;
  residualPctAdjustmentPp?: number | null;
  currentYear?: number;
  termMonths?: number;
  kmPerYear?: number;
  downPaymentPct?: number;
}): number | null {
  const {
    priceChf,
    year,
    mileageKm,
    interestRatePct,
    residualPctAdjustmentPp,
    currentYear,
    termMonths = 60,
    kmPerYear = 10000,
    downPaymentPct = 5,
  } = args;

  if (!Number.isFinite(priceChf) || priceChf <= 0) return null;
  if (!Number.isFinite(year) || year <= 0) return null;
  if (!Number.isFinite(mileageKm) || mileageKm < 0) return null;
  if (!Number.isFinite(interestRatePct) || interestRatePct <= 0) return null;

  const yearNow = currentYear ?? new Date().getUTCFullYear();

  const restwert = estimateRestwert({
    priceChf,
    year,
    mileageKm,
    termMonths,
    kmPerYear,
    currentYear: yearNow,
  });

  const rawResidualAdj = Number(residualPctAdjustmentPp ?? 0);
  const residualAdjPp = Number.isFinite(rawResidualAdj) ? clamp(rawResidualAdj, -50, 50) : 0;

  const adjustedResidualPct = clamp(restwert.residualPct + residualAdjPp / 100, 0.15, 0.7);
  const adjustedRestwertChf = Math.round(priceChf * adjustedResidualPct);

  const rate = estimateMonthlyLeasingRate({
    priceChf,
    interestRatePct,
    downPaymentPct,
    termMonths,
    restwertChf: adjustedRestwertChf,
  });

  if (!Number.isFinite(rate.monthlyRateChf) || rate.monthlyRateChf <= 0) return null;

  return Math.round(rate.monthlyRateChf);
}