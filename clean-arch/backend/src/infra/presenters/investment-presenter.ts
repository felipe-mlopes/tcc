import { Investment } from "@/domain/portfolio/entities/investment";

export class InvestmentPresenter {
  static toHTTP(investment: Investment) {
    return {
      id: investment.id.toValue().toString(),
      assetId: investment.assetId.toValue().toString(),
      portfolioId: investment.portfolioId.toValue().toString(),
      quantity: investment.quantity.getValue(),
      currentPrice: investment.currentPrice.getAmount(),
    };
  }
}