export class Quantity {
    private constructor(private readonly value: number) {
      if (value < 0) throw new Error('Quantity cannot be negative.')
    }
  
    public static create(value: number): Quantity {
      return new Quantity(value)
    }
  
    public static zero(): Quantity {
      return new Quantity(0)
    }
  
    public getValue(): number {
      return this.value
    }
  
    public add(other: Quantity): Quantity {
      return new Quantity(this.value + other.value)
    }
  
    public subtract(other: Quantity): Quantity {
      if (this.value < other.value) throw new Error('Insufficient quantity for subtraction.')

      return new Quantity(this.value - other.value)
    }
  
    public multiply(factor: number): Quantity {
      if (factor < 0) throw new Error('Multiplication factor cannot be negative.')
      
      return new Quantity(this.value * factor)
    }
  
    public equals(other: Quantity): boolean {
      return this.value === other.value
    }
  
    public isZero(): boolean {
      return this.value === 0
    }
  
    public isGreaterThan(other: Quantity): boolean {
      return this.value > other.value
    }
  
    public toString(): string {
      return this.value.toString()
    }
  }