import { runArchitectureAnalysis, quickArchitectureCheck, analyzeSpecificClass } from './complexity-analyzer-v2';

async function main() {
    try {
        console.log('🔍 Iniciando análise da arquitetura...\n');
        
        // ============================================
        // OPÇÃO 1: Análise completa com relatórios
        // ============================================
        const report = await runArchitectureAnalysis('./tsconfig.json', {
            exportJson: true,
            exportHtml: true,
            jsonPath: './reports/architecture-report.json',
            htmlPath: './reports/architecture-report.html',
            verbose: true
        });
        
        console.log('\n📊 RESULTADOS:');
        console.log(`   📁 Arquivos analisados: ${report.summary.totalFiles}`);
        console.log(`   🏗️ Classes encontradas: ${report.summary.totalClasses}`);
        console.log(`   ⚙️ Métodos analisados: ${report.summary.totalMethods}`);
        console.log(`   ⚠️ Violações detectadas: ${report.summary.violations}`);
        console.log(`   💰 Débito técnico: ${report.summary.technicalDebt}h`);
        
        // ============================================
        // OPÇÃO 2: Verificação rápida (para CI/CD)
        // ============================================
        console.log('\n🚦 Executando verificação rápida...');
        const quickCheck = await quickArchitectureCheck();
        
        if (quickCheck.hasViolations) {
            console.log('❌ Projeto tem problemas críticos:');
            quickCheck.criticalIssues.forEach(issue => {
                console.log(`   - ${issue}`);
            });
            process.exit(1); // Falha para CI/CD
        } else {
            console.log('✅ Projeto dentro dos padrões de qualidade!');
        }
        
        // ============================================
        // OPÇÃO 3: Análise de classe específica
        // ============================================
        /* 
        const classAnalysis = await analyzeSpecificClass(
            'src/services/UserService.ts',
            'UserService'
        );
        
        if (classAnalysis.complexity) {
            console.log('\n🔍 Análise da classe UserService:');
            classAnalysis.complexity.forEach(method => {
                console.log(`   ${method.methodName}: complexidade ${method.cyclomaticComplexity}`);
            });
        }
        */
        
    } catch (error) {
        console.error('❌ Erro na análise:', error);
        process.exit(1);
    }
}

// Executar análise
main();