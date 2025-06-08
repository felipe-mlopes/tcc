export class Name {
    private constructor(private readonly name: string) {
        const trimmed = name.trim()

        if (!Name.isValid(trimmed)) throw new Error("Invalid name")
    }

    public static create(name: string): Name {
        return new Name(name)
    }

    public getValue(): string {
        return this.name
    }

    public equals(name: Name): boolean {
        return this.name === name.getValue()
    }

    private static isValid(name: string): boolean {
        if (!name || name.length < 2) return false

        return /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(name)
    }
}