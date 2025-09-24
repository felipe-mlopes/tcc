import { 
  analyzeFinancialApplication, 
  quickAnalysis, 
  analyzeComplexityOnly,
  analyzeCouplingOnly,
  customAnalysis,
} from './complexity-analyzer';

async function main() {
    try {
        console.log('🔍 Iniciando análise da aplicação financeira...\n');
        
        // ============================================
        // OPÇÃO 1: Análise completa da aplicação financeira
        // ============================================
        const report = await analyzeFinancialApplication({
            tsConfigPath: './tsconfig.json',
            outputJsonPath: './reports/financial-analysis.json',
            outputHtmlPath: './reports/financial-analysis.html',
            generateJson: true,
            generateHtml: true
        });
        
        console.log('\n📊 RESUMO DA ANÁLISE:');
        console.log(`   📁 Arquivos analisados: ${report.summary.totalFiles}`);
        console.log(`   🏗️ Classes encontradas: ${report.summary.totalClasses}`);
        console.log(`   ⚙️ Métodos analisados: ${report.summary.totalMethods}`);
        console.log(`   📈 Complexidade média: ${report.summary.avgComplexity}`);
        console.log(`   🔗 Acoplamento médio: ${report.summary.avgCoupling}`);
        console.log(`   🤝 Coesão média: ${report.summary.avgCohesion}`);
        console.log(`   ⚠️ Violações detectadas: ${report.summary.violations}`);
        console.log(`   💰 Débito técnico: ${report.summary.technicalDebt}h`);
        
        // Análise por camadas
        console.log('\n🗂️ ANÁLISE POR CAMADAS:');
        const { controllers, services, routes, middleware } = report.layers;
        
        if (controllers.files > 0) {
            console.log(`   📋 Controllers: ${controllers.violations} violações em ${controllers.methods} métodos`);
        }
        if (services.files > 0) {
            console.log(`   🔧 Services: ${services.violations} violações em ${services.methods} métodos`);
        }
        if (routes.files > 0) {
            console.log(`   🛣️ Routes: ${routes.violations} violações em ${routes.methods} métodos`);
        }
        if (middleware.files > 0) {
            console.log(`   🛡️ Middleware: ${middleware.violations} violações em ${middleware.methods} métodos`);
        }
        
        // ============================================
        // OPÇÃO 2: Análise rápida (para CI/CD)
        // ============================================
        console.log('\n🚦 Executando verificação rápida...');
        const quickResult = await quickAnalysis('./tsconfig.json');
        
        const hasHighRiskIssues = 
            quickResult.topIssues.mostComplexMethod?.risk === 'VERY_HIGH' ||
            quickResult.topIssues.mostCoupledClass?.risk === 'VERY_HIGH' ||
            quickResult.topIssues.leastCohesiveClass?.risk === 'VERY_HIGH';
        
        if (hasHighRiskIssues || quickResult.summary.violations > 10) {
            console.log('❌ Projeto tem problemas críticos:');
            
            if (quickResult.topIssues.mostComplexMethod?.risk === 'VERY_HIGH') {
                const method = quickResult.topIssues.mostComplexMethod;
                console.log(`   - Método muito complexo: ${method.className}.${method.methodName} (${method.cyclomaticComplexity})`);
            }
            
            if (quickResult.topIssues.mostCoupledClass?.risk === 'VERY_HIGH') {
                const coupling = quickResult.topIssues.mostCoupledClass;
                console.log(`   - Classe com alto acoplamento: ${coupling.className} (${coupling.efferentCoupling} dependências)`);
            }
            
            if (quickResult.topIssues.leastCohesiveClass?.risk === 'VERY_HIGH') {
                const cohesion = quickResult.topIssues.leastCohesiveClass;
                console.log(`   - Classe com baixa coesão: ${cohesion.className} (${(cohesion.cohesionScore * 100).toFixed(1)}%)`);
            }
            
            console.log('\n💡 PRINCIPAIS RECOMENDAÇÕES:');
            quickResult.recommendations.slice(0, 3).forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
            
            // Para CI/CD, pode falhar o build se necessário
            // process.exit(1);
        } else {
            console.log('✅ Aplicação financeira dentro dos padrões de qualidade!');
        }
        
        // ============================================
        // OPÇÃO 3: Análise focada por tipo de métrica
        // ============================================
        
        // Análise apenas de complexidade (útil para controllers/services complexos)
        console.log('\n🔍 Analisando apenas complexidade...');
        const complexityMetrics = await analyzeComplexityOnly('./tsconfig.json');
        
        const highComplexityMethods = complexityMetrics
            .filter(m => m.cyclomaticComplexity > 15)
            .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)
            .slice(0, 5);
        
        if (highComplexityMethods.length > 0) {
            console.log('⚠️ Métodos com alta complexidade:');
            highComplexityMethods.forEach(method => {
                console.log(`   - ${method.fileName}: ${method.className || 'Global'}.${method.methodName} (${method.cyclomaticComplexity})`);
            });
        }
        
        // Análise de acoplamento (importante para arquitetura)
        console.log('\n🔗 Analisando acoplamento entre classes...');
        const couplingMetrics = await analyzeCouplingOnly('./tsconfig.json');
        
        const highCouplingClasses = couplingMetrics
            .filter(m => m.efferentCoupling > 8)
            .sort((a, b) => b.efferentCoupling - a.efferentCoupling)
            .slice(0, 3);
        
        if (highCouplingClasses.length > 0) {
            console.log('🔗 Classes com alto acoplamento:');
            highCouplingClasses.forEach(cls => {
                console.log(`   - ${cls.className}: ${cls.efferentCoupling} dependências`);
                console.log(`     Instabilidade: ${cls.instability.toFixed(2)} | Distância: ${cls.distance.toFixed(2)}`);
            });
        }
        
        // ============================================
        // OPÇÃO 4: Análise customizada para contexto financeiro
        // ============================================
        console.log('\n💰 Análise específica para aplicação financeira...');
        
        const financialCustomAnalysis = await customAnalysis({
            tsConfigPath: './tsconfig.json',
            includeComplexity: true,
            includeCoupling: true,
            includeCohesion: true,
            complexityThreshold: 8,  // Threshold menor para apps financeiras (mais rigoroso)
            couplingThreshold: 6,    // Acoplamento baixo é crítico
            cohesionThreshold: 0.6   // Coesão alta é importante
        });
        
        // Verificar métodos críticos relacionados a finanças
        const financialMethods = financialCustomAnalysis.complexityMetrics?.filter(m => 
            m.methodName.toLowerCase().includes('transaction') ||
            m.methodName.toLowerCase().includes('payment') ||
            m.methodName.toLowerCase().includes('transfer') ||
            m.methodName.toLowerCase().includes('balance') ||
            m.methodName.toLowerCase().includes('auth') ||
            m.methodName.toLowerCase().includes('validate')
        ) || [];
        
        if (financialMethods.length > 0) {
            console.log('🏦 Métodos financeiros que precisam de atenção:');
            financialMethods.forEach(method => {
                console.log(`   - ${method.methodName}: complexidade ${method.cyclomaticComplexity}, risco ${method.risk}`);
                if (method.risk === 'HIGH' || method.risk === 'VERY_HIGH') {
                    console.log(`     ⚠️ CRÍTICO: Método financeiro com alta complexidade!`);
                }
            });
        }
        
        // ============================================
        // OPÇÃO 5: Análise avançada com classe personalizada
        // ============================================
        /*
        console.log('\n🔧 Executando análise avançada personalizada...');
        const analyzer = new FinancialAppAnalyzer('./tsconfig.json');
        const advancedReport = await analyzer.analyzeFinancialApp();
        
        // Salvar relatório customizado
        await analyzer.exportReport(advancedReport, './reports/advanced-financial-analysis.json');
        await analyzer.saveHTMLReport(advancedReport, './reports/advanced-financial-analysis.html');
        
        console.log('📄 Relatórios avançados salvos em ./reports/');
        */
        
        // ============================================
        // VALIDAÇÃO FINAL PARA APLICAÇÕES FINANCEIRAS
        // ============================================
        console.log('\n🛡️ Validação final para aplicação financeira...');
        
        const criticalIssues: string[] = [];
        
        // Verificar se há métodos de transação muito complexos
        const complexTransactionMethods = complexityMetrics.filter(m => 
            (m.methodName.toLowerCase().includes('transaction') || 
             m.methodName.toLowerCase().includes('payment')) &&
            m.cyclomaticComplexity > 10
        );
        
        if (complexTransactionMethods.length > 0) {
            criticalIssues.push(`${complexTransactionMethods.length} método(s) de transação com alta complexidade`);
        }
        
        // Verificar acoplamento em services críticos
        const criticalServices = couplingMetrics.filter(m => 
            m.className.toLowerCase().includes('service') &&
            m.efferentCoupling > 10
        );
        
        if (criticalServices.length > 0) {
            criticalIssues.push(`${criticalServices.length} service(s) com acoplamento crítico`);
        }
        
        // Verificar débito técnico total
        if (report.summary.technicalDebt > 40) {
            criticalIssues.push(`Débito técnico muito alto: ${report.summary.technicalDebt}h`);
        }
        
        if (criticalIssues.length > 0) {
            console.log('🚨 ALERTAS CRÍTICOS PARA APLICAÇÃO FINANCEIRA:');
            criticalIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
            console.log('\n⚠️ Recomenda-se refatoração antes de deploy em produção!');
        } else {
            console.log('✅ Aplicação financeira aprovada para produção!');
        }
        
        console.log('\n🎯 Análise concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante a análise:', error);
        process.exit(1);
    }
}

// ============================================
// FUNÇÃO AUXILIAR PARA ANÁLISE EM CI/CD
// ============================================
async function validateForCI() {
    try {
        const quickResult = await quickAnalysis('./tsconfig.json');
        
        // Critérios rigorosos para aplicações financeiras
        const maxAllowedViolations = 5;
        const maxTechnicalDebt = 20;
        
        if (quickResult.summary.violations > maxAllowedViolations) {
            console.error(`❌ Muitas violações: ${quickResult.summary.violations} (máximo: ${maxAllowedViolations})`);
            process.exit(1);
        }
        
        if (quickResult.summary.technicalDebt > maxTechnicalDebt) {
            console.error(`❌ Débito técnico alto: ${quickResult.summary.technicalDebt}h (máximo: ${maxTechnicalDebt}h)`);
            process.exit(1);
        }
        
        console.log('✅ Validação CI/CD passou!');
        
    } catch (error) {
        console.error('❌ Falha na validação CI/CD:', error);
        process.exit(1);
    }
}

// Executar análise baseado em argumentos da linha de comando
const args = process.argv.slice(2);

if (args.includes('--ci')) {
    validateForCI();
} else {
    main();
}