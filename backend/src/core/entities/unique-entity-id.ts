import { randomUUID } from 'node:crypto'

export class UniqueEntityID {
    private value: String

    toString() {
        return this.value
    }

    toValue() {
        return this.value
    }

    constructor(value?: String) {
        this.value = value ?? randomUUID()
    }

    public equals(id: UniqueEntityID) {
        return id.toValue() == this.value
    }
}