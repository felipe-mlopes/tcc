import { Transaction } from "@/domain/transaction/entities/transaction";

export class TransactionPresenter {
  static toHTTP(transaction: Transaction) {
    return {
        id: transaction.id.toValue().toString(),
        assetId: transaction.assetId.toValue().toString(),
        portfolioId: transaction.portfolioId.toValue().toString(),
        quantity: transaction.quantity.getValue(),
        price: transaction.price.getAmount(),
        type: transaction.transactionType,
        dateAt: transaction.dateAt,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
    };
  }
}