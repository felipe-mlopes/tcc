import { UniqueEntityID } from "@/core/entities/unique-entity-id"
import { Entity } from "@/core/entities/entity"
import { Optional } from "@/core/types/optional"
import { Email } from "@/core/value-objects/email"
import { Name } from "@/core/value-objects/name"
import { CPF } from "@/core/value-objects/cpf"
import { DateOfBirth } from "@/core/value-objects/date-of-birth"

export enum InvestorProfile {
    Conservative = "Conservative",
    Moderate = "Moderate",
    Aggressive = "Aggressive"
}

export interface InvestorProps {
    email: Email,
    name: Name,
    cpf: CPF,
    dateOfBirth: DateOfBirth
    riskProfile: InvestorProfile,
    createdAt: Date,
    updatedAt?: Date
    isActive: boolean 
}

export class Investor extends Entity<InvestorProps> {
    public get email() {
        return this.props.email.getValue()
    }

    public get name() {
        return this.props.name.getValue()
    }

    public get cpf() {
        return this.props.cpf.getValue()
    }

    public get dateOfBirth() {
        return this.props.dateOfBirth.getValue()
    }
    
    public get riskProfile() {
        return this.props.riskProfile
    }

    public get createdAt() {
        return this.props.createdAt
    }

    public get updatedAt() {
        return this.props.updatedAt
    }

    public get isActive() {
        return this.props.isActive
    }

    public set riskProfile(newRiskProfile: InvestorProfile) {
        if(this.props.riskProfile !== newRiskProfile) {
            this.props.riskProfile = newRiskProfile
            this.touch()
        }
    }

    private touch() {
        this.props.updatedAt = new Date()
    }

    public updateName(newName: string) {
        const newNameVerified = Name.create(newName)

        if(!this.props.name.equals(newNameVerified)) {
            this.props.name = newNameVerified
            this.touch()
        }

    }

    public updateEmail(newEmail: string) {
        const newEmailVerified = Email.create(newEmail)

        if(!this.props.email.equals(newEmailVerified)) {
            this.props.email = newEmailVerified
            this.touch()
        }

    }

    public desactive() {
        this.props.isActive = false
        this.touch()
    }

    public static create(props: Optional<InvestorProps, 'createdAt' | 'isActive'>, id?: UniqueEntityID) {
        const investor = new Investor(
            {
                ...props,
                createdAt: props.createdAt ?? new Date(),
                isActive: true
            }, 
            id
    )

        return investor
    }
}