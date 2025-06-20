export class TotalValue {
    public constructor(private readonly value: number) {
      if (value < 0) throw new Error("TotalValue cannot be negative");
    }
  
    getValue() {
      return this.value;
    }
  
    static zero(): TotalValue {
      return new TotalValue(0);
    }
  }