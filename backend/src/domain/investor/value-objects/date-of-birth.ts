export class DateOfBirth {
    private constructor(private readonly dateOfBirth: Date) {
        if (!DateOfBirth.isValid(dateOfBirth)) throw new Error("Invalid date of birth")
    }

    public static create(date: Date): DateOfBirth {
        return new DateOfBirth(date)
    }

    public getValue(): Date {
        return this.dateOfBirth
    }

    public equals(date: DateOfBirth): boolean {
        return this.dateOfBirth.getTime() === date.getValue().getTime()
    }

    private static isValid(date: Date): boolean {
        const today = new Date()
        
        if (date > today) return false

        const age = DateOfBirth.calculateAge(date)
        return age >= 18
    }

    private static calculateAge(date: Date): number {
        const today = new Date()
        let age = today.getFullYear() - date.getFullYear()
        const monthDiff = today.getMonth() - date.getMonth()

        if (monthDiff < 0 || (monthDiff == 0 && today.getDate() < date.getDate())) age--

        return age
    }
}