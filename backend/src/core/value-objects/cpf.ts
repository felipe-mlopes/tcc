export class CPF {
    private constructor(private readonly cpf: string) {
        const cleanCPF = CPF.clean(cpf)

        if (!CPF.isValid(cpf)) throw new Error("Invalid cpf format")
    }

    public static create(cpf: string): CPF {
        return new CPF(cpf)
    }

    public getValue(): string {
        return this.cpf
    }

    public equals(cpf: CPF): boolean {
        return this.cpf === cpf.getValue()
    }

    private static clean(cpf: string): string {
        return cpf.replace(/\D/g, '')
    }

    private static isValid(cpf: string): boolean {
        const cleaned = CPF.clean(cpf)

        if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) return false

        const digits = cleaned.split('').map(Number)

        if (digits[9] < 0 || digits[9] > 9) return false
        if (digits[10] < 0 || digits[10] > 9) return false

        return true
    }

    private static calculateVerifierDigit(digits: number[], factor: number): number {
        const total = digits.slice(0, factor - 1).reduce(
            (sum, digit, index) => {
                return sum + digit * (factor - index - 1)
            },
            0
        )

        const remainder = (total * 10) % 11
        return remainder === 10 ? 0 : remainder
    }
}