import { Money } from "@/core/value-objects/money";
import { Quantity } from "@/core/value-objects/quantity";
import { Investment } from "../entities/investment";
import { Transaction } from "@/domain/transaction/entities/transaction";
import { Either, left, right } from "@/core/either";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

export type UpdateInvestmentServiceResponse = Either<NotAllowedError, {
    newQuantity: Quantity
    newAveragePrice: Money
    newTotalInvested: Money
    newCurrentValue: Money
    newProfitLoss: Money
}>

export class UpdateInvestmentService {

    static async calculateBuyImpact(
        currentInvestment: Investment | null,
        transaction: Transaction
    ): Promise<UpdateInvestmentServiceResponse> {
        if (!transaction.isBuyTransaction) return left(new NotAllowedError())

        let investment: Investment

        if (currentInvestment) {
            const clonedInvestment = Investment.create({
                investmentId: currentInvestment.investmentId,
                assetId: currentInvestment.assetId,
                quantity: currentInvestment.quantity,
                currentPrice: currentInvestment.currentPrice,
                createdAt: currentInvestment.createdAt,
                updatedAt: currentInvestment.updatedAt
            }, currentInvestment.id)

            currentInvestment.transactions.forEach(t => {
                if (t.quantity.isZero()) throw new NotAllowedError()
                if (!t.price || t.price.getAmount() <= 0) throw new NotAllowedError()
                if (t.price.getCurrency() !== currentInvestment.currentPrice.getCurrency()) throw new NotAllowedError()

                clonedInvestment.addQuantity(t.quantity, t.price)
            })

            if (transaction.quantity.isZero()) throw new NotAllowedError()
            if (!transaction.price || transaction.price.getAmount() <= 0) throw new NotAllowedError()
            if (transaction.price.getCurrency() !== clonedInvestment.currentPrice.getCurrency()) throw new NotAllowedError()

            clonedInvestment.addQuantity(transaction.quantity, transaction.price)
            investment = clonedInvestment
        } else {
            investment = Investment.create({
                investmentId: new UniqueEntityID(),
                assetId: transaction.assetId,
                quantity: transaction.quantity,
                currentPrice: transaction.price,
                initialQuantity: transaction.quantity,
                initialPrice: transaction.price
            })
        }

        return right({
            newQuantity: investment.quantity,
            newAveragePrice: investment.averagePrice,
            newTotalInvested: investment.getTotalInvested(),
            newCurrentValue: investment.getCurrentValue(),
            newProfitLoss: investment.getProfitLoss()
        })
    }

    static async calculateSellImpact(
        currentInvestment: Investment,
        transaction: Transaction
    ): Promise<UpdateInvestmentServiceResponse> {
        if (!transaction.isSellTransaction()) {
            return left(new NotAllowedError())
        }

        if (!currentInvestment.hasQuantity()) {
            return left(new NotAllowedError())
        }

        const clonedInvestment = Investment.create({
            investmentId: currentInvestment.investmentId,
            assetId: currentInvestment.assetId,
            quantity: currentInvestment.quantity,
            currentPrice: currentInvestment.currentPrice,
            createdAt: currentInvestment.createdAt,
            updatedAt: currentInvestment.updatedAt
        }, currentInvestment.id)

        currentInvestment.transactions.forEach(t => {
            if (t.quantity.isZero()) throw new NotAllowedError()
            if (!t.price || t.price.getAmount() <= 0) throw new NotAllowedError()
            if (t.price.getCurrency() !== currentInvestment.currentPrice.getCurrency()) throw new NotAllowedError()

            clonedInvestment.addQuantity(t.quantity, t.price)
        })

        if(transaction.quantity.isZero()) throw new NotAllowedError()
        if(transaction.quantity.isGreaterThan(clonedInvestment.quantity)) throw new NotAllowedError()

        clonedInvestment.reduceQuantity(transaction.quantity)

        return right({
            newQuantity: clonedInvestment.quantity,
            newAveragePrice: clonedInvestment.averagePrice,
            newTotalInvested: clonedInvestment.getTotalInvested(),
            newCurrentValue: clonedInvestment.getCurrentValue(),
            newProfitLoss: clonedInvestment.getProfitLoss()
        })
    }
    
    static async calculateDividendImpact(
        currentInvestment: Investment,
        transaction: Transaction
    ): Promise<UpdateInvestmentServiceResponse> {
        if (!transaction.isDividendTransaction()) return left(new NotAllowedError())
        
        return right({
            newQuantity: currentInvestment.quantity,
            newAveragePrice: currentInvestment.averagePrice,
            newTotalInvested: currentInvestment.getTotalInvested(),
            newCurrentValue: currentInvestment.getCurrentValue(),
            newProfitLoss: currentInvestment.getProfitLoss()
        })
    }

    static async recalculateFromTransactionHistory(
        transactions: Transaction[],
        currentPrice: Money,
        assetId: UniqueEntityID
    ): Promise<UpdateInvestmentServiceResponse> {
        if (transactions.length === 0) return left(new NotAllowedError())

        const sortedTransactions = transactions
            .filter(t => t.assetId.equals(assetId))
            .sort((a, b) => a.dateAt.getTime() - b.dateAt.getTime())

        if (sortedTransactions.length === 0) return left(new NotAllowedError())

        let investment: Investment | null = null

        for (const transaction of sortedTransactions) {
            if (transaction.isBuyTransaction()) {

                if (transaction.quantity.isZero()) throw new NotAllowedError()
                if (!transaction.price || transaction.price.getAmount() <= 0) throw new NotAllowedError()

                if (!investment) {

                    // Cria o investimento inicial
                    investment = Investment.create({
                        investmentId: new UniqueEntityID(),
                        assetId: transaction.assetId,
                        quantity: transaction.quantity,
                        currentPrice: currentPrice,
                        initialQuantity: transaction.quantity,
                        initialPrice: transaction.price
                    })
                } else {

                    // Adiciona compra ao investimento existente
                    if (transaction.price.getCurrency() !== investment.currentPrice.getCurrency()) throw new NotAllowedError()

                    investment.addQuantity(transaction.quantity, transaction.price)
                }
            } else if (transaction.isSellTransaction() && investment) {

                // Processa venda
                if(transaction.quantity.isGreaterThan(investment.quantity)) throw new NotAllowedError()
                investment.reduceQuantity(transaction.quantity)
            }
        }

        if (!investment) return left(new NotAllowedError())

        // Atualiza o preço atual
        investment.updateCurrentPrice(currentPrice)

        return right({
            newQuantity: investment.quantity,
            newAveragePrice: investment.averagePrice,
            newTotalInvested: investment.getTotalInvested(),
            newCurrentValue: investment.getCurrentValue(),
            newProfitLoss: investment.getProfitLoss()
        })
    }
}