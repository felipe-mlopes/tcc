export class Percentage {
    private constructor(private readonly value: number) {
    }
  
    public static create(value: number): Percentage {
      return new Percentage(value)
    }
  
    public static zero(): Percentage {
      return new Percentage(0)
    }
  
    public static fromDecimal(decimal: number): Percentage {
      return new Percentage(decimal * 100)
    }
  
    public getValue(): number {
      return this.value
    }
  
    public getDecimal(): number {
      return this.value / 100
    }
  
    public isPositive(): boolean {
      return this.value > 0
    }
  
    public isNegative(): boolean {
      return this.value < 0
    }
  
    public equals(other: Percentage): boolean {
      return Math.abs(this.value - other.value) < 0.001 // Precisão de 3 casas decimais
    }
  
    public toString(): string {
      return `${this.value.toFixed(2)}%`
    }
  }