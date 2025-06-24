import { UniqueEntityID } from "@/core/entities/unique-entity-id"
import { Email } from "../../value-objects/email"
import { Name } from "../../value-objects/name"
import { CPF } from "../../value-objects/cpf"
import { DateOfBirth } from "../../value-objects/date-of-birth"
import { Entity } from "@/core/entities/entity"
import { Optional } from "@/core/types/optional"

export enum InvestorProfile {
    Conservative = "Conservative",
    Moderate = "Moderate",
    Aggressive = "Aggressive"
}

interface InvestorProps {
    investorId: UniqueEntityID,
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
    get investorId() {
        return this.props.investorId
    }

    get email() {
        return this.props.email.getValue()
    }

    get name() {
        return this.props.name.getValue()
    }

    get cpf() {
        return this.props.cpf.getValue()
    }

    get dateOfBirth() {
        return this.props.dateOfBirth.getValue()
    }
    
    get riskProfile() {
        return this.props.riskProfile
    }

    get createdAt() {
        return this.props.createdAt
    }

    get updatedAt() {
        return this.props.updatedAt
    }

    get isActive() {
        return this.props.isActive
    }

    set email(newEmail: string) {
        const newEmailVerified = Email.create(newEmail)

        if(!this.props.email.equals(newEmailVerified)) {
            this.props.email.getValue() == newEmail
        }
    }

    set name(newName: string) {
        const newNameVerified = Name.create(newName)

        if(!this.props.name.equals(newNameVerified)) {
            this.props.name.getValue() == newName
        }
    }

    set riskProfile(newRiskProfile: InvestorProfile) {
        if(this.props.riskProfile !== newRiskProfile) {
            this.props.riskProfile == newRiskProfile
            this.touch()
        }
    }

    set isActive(active: boolean) {
        if (this.props.isActive !== active) {
            this.props.isActive == active
            this.touch()
        }
    }

    private touch() {
        this.props.updatedAt = new Date()
    }

    public updateName(newName: Name) {
        this.props.name = newName
        this.touch()
    }

    public updateEmail(newEmail: Email) {
        this.props.email = newEmail
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