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

  const safePrice = Number.isFinite(priceChf) ? priceChf : 0;
  const safeYear = Number.isFinite(year) ? year : currentYear;
  const safeMileage = Number.isFinite(mileageKm) ? Math.max(0, mileageKm) : 0;
  const safeTermMonths = Number.isFinite(termMonths) ? Math.max(1, Math.floor(termMonths)) : 60;
  const safeKmPerYear = Number.isFinite(kmPerYear) ? Math.max(0, kmPerYear) : 15000;

  const ageYears = Math.max(0, currentYear - safeYear);
  const basePct = interpolateBaseResidualPct(safeTermMonths);

  const ageAdj = clamp(0.03 - 0.02 * ageYears, -0.15, 0.03);

  const endKm = safeMileage + safeKmPerYear * (safeTermMonths / 12);
  const typicalEndKm = safeMileage + 15000 * (safeTermMonths / 12);
  const deltaKm = endKm - typicalEndKm;
  const kmAdj = clamp(-deltaKm / 100000, -0.08, 0.04);

  const residualPct = clamp(basePct + ageAdj + kmAdj, 0.15, 0.7);
  const restwertChf = Math.round(safePrice * residualPct);

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

  const safePrice = Number.isFinite(priceChf) ? Math.max(0, priceChf) : 0;
  const safeRestwert = Number.isFinite(restwertChf) ? Math.max(0, restwertChf) : 0;

  const months = Number.isFinite(termMonths) ? Math.max(1, Math.floor(termMonths)) : 60;

  const safeInterestRatePct = Number.isFinite(interestRatePct) ? Math.max(0, interestRatePct) : 0;
  const safeDownPaymentPct = Number.isFinite(downPaymentPct) ? downPaymentPct : 0;

  const downPaymentChf = safePrice * (safeDownPaymentPct / 100);

  const principalRaw = safePrice - downPaymentChf - safeRestwert;
  const principal = Number.isFinite(principalRaw) ? Math.max(0, principalRaw) : 0;
  const monthlyAmort = principal / months;

  const interestBase = (safePrice - downPaymentChf + safeRestwert) / 2;
  const monthlyInterestRaw = interestBase * (safeInterestRatePct / 100) / 12;
  const monthlyInterest = Number.isFinite(monthlyInterestRaw) ? Math.max(0, monthlyInterestRaw) : 0;

  const monthlyRateRaw = monthlyAmort + monthlyInterest;
  const monthlyRateChf = Number.isFinite(monthlyRateRaw) ? Math.max(0, monthlyRateRaw) : 0;

  return {
    restwertChf: safeRestwert,
    residualPct: safePrice > 0 ? safeRestwert / safePrice : 0,
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