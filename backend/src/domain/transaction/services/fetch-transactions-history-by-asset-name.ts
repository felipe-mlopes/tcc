import { Either, left, right } from "@/core/either"
import { NotAllowedError } from "@/core/errors/not-allowed-error"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
import { Transaction } from "../entities/transaction"
import { TransactionRepository } from "../repositories/transaction-repository"
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository"

interface FetchTransactionsHistoryByAssetNameServiceRequest {
    investorId: string,
    assetName: string,
    page: number
}

type FetchTransactionsHistoryByAssetNameServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    transactions: Transaction[]
}>

export class FetchTransactionsHistoryByAssetNameService {
    constructor(
        private investorRepository: InvestorRepository,
        private transactionRepository: TransactionRepository
    ) {}

    async execute({
        investorId,
        assetName,
        page
    }: FetchTransactionsHistoryByAssetNameServiceRequest): Promise<FetchTransactionsHistoryByAssetNameServiceResponse> {
        const investor = await this.investorRepository.findById(investorId)
        if (!investor) return left(new ResourceNotFoundError())

        const transactions = await this.transactionRepository.findManyByAssetName(
            assetName,
            { page }
        )

        return right({
            transactions
        })
    }
}