import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Percentage } from "@/domain/value-objects/percentage";
import { Period } from "../../value-objects/period";

interface PerformanceReportProps {
    reportId: UniqueEntityID,
    portfolioId: UniqueEntityID,
    period: Period,
    totalReturn: Percentage,
    annualizedReturn: Percentage,
    volatility: Percentage,
    sharpeRatio: Percentage,
    generatedAt: Date
}

export class PerformanceReport extends Entity<PerformanceReportProps> {}