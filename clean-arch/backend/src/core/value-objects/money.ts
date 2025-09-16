import { NotAllowedError } from "../../shared/exceptions/errors/not-allowed-error"

export class Money {
    private constructor(    
        private readonly amount: number,
        private readonly currency: string
    ) {
        if (!currency || currency.length !== 3) throw new NotAllowedError('Currency must be a 3-letter code.')
    }

    static create(amount: number, currency: string = "BRL"): Money {
        return new Money(amount, currency.toUpperCase())
    }

    static zero(currency: string = "BRL"): Money {
        return new Money(0, currency.toUpperCase())
    }

    public getAmount(): number {
        return this.amount
    }

    public getCurrency(): string {
        return this.currency
    }

    public add(value: Money): Money {
        this.validadeSameCurrency(value)
        
        return new Money(this.amount + value.amount, this.currency)
    }

    public subtract(value: Money): Money {
        this.validadeSameCurrency(value)

        return new Money(this.amount - value.amount, this.currency)
    }

    public multiply(factor: number): Money {
        if (factor == 0) throw new NotAllowedError('Multiplication factor cannot be zero.')

        return new Money(this.amount * factor, this.currency)
    }

    public divide(divisor: number): Money {
        if (divisor <= 0) throw new NotAllowedError('Division by zero or negative number.')

        return new Money(this.amount / divisor, this.currency)
    }

    public equals(value: Money): boolean {
        return this.amount === value.amount && this.currency === value.currency;
    }

    public isGreaterThan(value: Money): boolean {
        this.validadeSameCurrency(value)

        return this.amount > value.amount
    }

    public isLessThan(value: Money): boolean {
        this.validadeSameCurrency(value)

        return this.amount > value.amount
    }

    private validadeSameCurrency(valeu: Money): void {
        if (this.currency !== valeu.currency) throw new NotAllowedError(`Cannot operate with different currencies: ${this.currency} and ${valeu.currency}.`)
    }
}