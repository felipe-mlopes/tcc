export class DateOfBirth {
    private constructor(private readonly dateOfBirth: Date) {
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

    public static isValid(date: Date): boolean {
        if (!(date instanceof Date) || isNaN(date.getTime())) return false
        
        const today = new Date()
        if (date > today) return false

        const age = DateOfBirth.calculateAge(date)
        return age >= 18
    }

    public static calculateAge(date: Date): number {
        const today = new Date()
        let age = today.getFullYear() - date.getFullYear()
        const monthDiff = today.getMonth() - date.getMonth()

        if (monthDiff < 0 || (monthDiff == 0 && today.getDate() < date.getDate())) age--

        return age
    }
}