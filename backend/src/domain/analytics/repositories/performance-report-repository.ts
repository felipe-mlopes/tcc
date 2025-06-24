import { PerformanceReport } from "../entities/performance-report"

export interface PerformanceReportRepository {
    findById(id: string): Promise<PerformanceReport | null>
    create(performanceReport: PerformanceReport): Promise<void>
    update(performanceReport: PerformanceReport): Promise<void>
    delete(performanceReport: PerformanceReport): Promise<void>
}