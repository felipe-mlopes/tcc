import { Injectable } from "@nestjs/common"

import { Either, left, right } from "@/shared/exceptions/either"
import { WrongCredentialsError } from "@/shared/exceptions/errors/wrong-credentials-error"
import { InvestorRepository } from "../repositories/investor-repository"
import { HashComparer } from "../cryptography/hash-comparer"
import { Encrypter } from "../cryptography/encrypter"

interface AuthenticateInvestorServiceRequest {
  email: string
  password: string
}

type AuthenticateInvestorServiceResponse = Either<
  WrongCredentialsError,
  {
    accessToken: string
  }
>

@Injectable()
export class AuthenticateInvestorService {
  constructor(
    readonly investorRepository: InvestorRepository,
    readonly hashComparer: HashComparer,
    readonly encrypter: Encrypter,
  ) {}

  async execute({
    email,
    password,
  }: AuthenticateInvestorServiceRequest): Promise<AuthenticateInvestorServiceResponse> {
    const investor = await this.investorRepository.findByEmail(email)

    if (!investor) {
      return left(new WrongCredentialsError())
    }

    const isPasswordValid = await this.hashComparer.compare(
      password,
      investor.password,
    )

    if (!isPasswordValid) {
      return left(new WrongCredentialsError())
    }

    const accessToken = await this.encrypter.encrypt({
      sub: investor.id.toString(),
    })

    return right({
      accessToken,
    })
  }
}