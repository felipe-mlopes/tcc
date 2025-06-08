export class Email {
    private constructor(private readonly email: string) {
        if (!Email.isValid(email)) throw new Error("Invalid email format")
    }

    public static create(email: string): Email {
        return new Email(email)
    }

    public getValue(): string {
        return this.email
    }

    public equals(email: Email): boolean {
        return this.email === email.getValue()
    }

    private static isValid(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        return emailRegex.test(email)
    }
}