import { Either, left, right } from "@/core/either";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { Transaction } from "../entities/transaction";
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository";
import { TransactionRepository } from "../repositories/transaction-repository";

interface FetchTransactionsHistoryByInvestorIdServiceRequest {
    investorId: string,
    page: number
}

type FetchTransactionsHistoryByInvestorIdServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    transactions: Transaction[]
}>

export class FetchTransactionsHistoryByInvestorIdService {
    constructor(
        private investorRepository: InvestorRepository,
        private transactionRepository: TransactionRepository
    ) {}

    async execute({
        investorId,
        page
    }: FetchTransactionsHistoryByInvestorIdServiceRequest): Promise<FetchTransactionsHistoryByInvestorIdServiceResponse> {
        const investor = await this.investorRepository.findById(investorId)
        if (!investor) return left(new ResourceNotFoundError())

        const id = String(investor.investorId)

        const transactions = await this.transactionRepository.findManyByUserId(id, {
            page
        })

        return right({
            transactions
        })
    }
}