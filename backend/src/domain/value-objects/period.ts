const ALLOWED_PERIODS = ['1M', '3M', '6M', '1Y', '3Y', '5Y', 'YTD'] as const;

export type PeriodValue = typeof ALLOWED_PERIODS[number];

export class Period {
  private readonly value: PeriodValue;

  private constructor(value: PeriodValue) {
    this.value = value;
  }

  public static create(value: string): Period {
    if (!ALLOWED_PERIODS.includes(value as PeriodValue)) {
      throw new Error(`Invalid period value: ${value}`);
    }

    return new Period(value as PeriodValue);
  }

  public getValue(): PeriodValue {
    return this.value;
  }

  public equals(other: Period): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
