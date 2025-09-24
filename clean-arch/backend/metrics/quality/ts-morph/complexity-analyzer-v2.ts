// =============================================
// BLOCO 1: IMPORTS E DEFINIÇÕES DE TIPOS
// =============================================
// Este bloco define todas as estruturas de dados e importa as dependências necessárias
import * as path from "path";
import * as fs from "fs";

import { 
  Project, 
  SourceFile, 
  FunctionDeclaration, 
  MethodDeclaration, 
  ClassDeclaration, 
  Node,
  SyntaxKind,
  ArrowFunction,
  FunctionExpression,
  ConstructorDeclaration,
  GetAccessorDeclaration,
  SetAccessorDeclaration,
} from 'ts-morph';

/**
 * Métricas de Halstead - Baseadas em operadores e operandos
 * Servem para medir a complexidade algorítmica do código
 */
interface HalsteadMetrics {
  operators: number;           // Total de operadores (+, -, *, etc.)
  operands: number;           // Total de operandos (variáveis, literais)
  distinctOperators: number;   // Operadores únicos
  distinctOperands: number;    // Operandos únicos
  vocabulary: number;         // n = n1 + n2 (vocabulário total)
  length: number;            // N = N1 + N2 (comprimento do programa)
  volume: number;           // V = N * log2(n) (volume)
  difficulty: number;       // D = (n1/2) * (N2/n2) (dificuldade)
  effort: number;          // E = D * V (esforço)
  timeToImplement: number; // T = E / 18 (tempo em segundos)
  bugsDelivered: number;   // B = V / 3000 (bugs estimados)
}

/**
 * Métricas de complexidade para funções e métodos
 * Combina diferentes tipos de métricas de complexidade
 */
interface ComplexityMetric {
  fileName: string;
  filePath: string;
  layer: string;              // Camada arquitetural (domain, infrastructure, etc.)
  className?: string;         // Nome da classe (opcional)
  methodName: string;        // Nome do método/função
  type: string;             // Tipo do componente (ENTITY, SERVICE, etc.)
  cyclomaticComplexity: number;      // Complexidade ciclomática (McCabe)
  cognitiveComplexity: number;       // Complexidade cognitiva
  linesOfCode: number;              // Linhas de código
  parameters: number;               // Número de parâmetros
  nestingDepth: number;            // Profundidade de aninhamento máxima
  maintainabilityIndex: number;    // Índice de manutenibilidade (0-171)
  halsteadComplexity: HalsteadMetrics; // Métricas de Halstead
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'; // Nível de risco
}

/**
 * Métricas de acoplamento entre classes
 * Mede as dependências entre componentes
 */
interface CouplingMetric {
  fileName: string;
  filePath: string;
  layer: string;
  className: string;
  afferentCoupling: number;    // Ca - Classes que dependem desta
  efferentCoupling: number;    // Ce - Classes das quais esta depende
  instability: number;         // I = Ce / (Ca + Ce)
  abstractness: number;        // A = interfaces / total_classes
  distance: number;           // D = |A + I - 1| (distância da linha principal)
  fanIn: number;             // Número de módulos que chamam este
  fanOut: number;           // Número de módulos chamados por este
  coupling: number;         // Índice geral de acoplamento
  imports: string[];        // Lista de importações
  dependencies: string[];   // Dependências internas
  dependents: string[];    // Quem depende desta classe
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
}

/**
 * Métricas de coesão interna das classes
 * Mede quão bem os elementos de uma classe trabalham juntos
 */
interface CohesionMetric {
  fileName: string;
  filePath: string;
  layer: string;
  className: string;
  lcom1: number;                   // LCOM1 - Lack of Cohesion Metric 1
  lcom2: number;                   // LCOM2 - Versão melhorada
  lcom3: number;                   // LCOM3 - Baseado em conectividade
  lcom4: number;                   // LCOM4 - Componentes conectados
  methodCount: number;             // Número de métodos
  fieldCount: number;              // Número de campos/propriedades
  cohesionScore: number;           // Score geral (0-1, maior = melhor)
  tightClassCohesion: number;      // TCC - Coesão estreita
  looseClassCohesion: number;      // LCC - Coesão ampla
  sharedFields: number;            // Campos compartilhados entre métodos
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
}

/**
 * Análise por camada arquitetural
 */
interface LayerAnalysis {
  name: string;
  files: number;
  classes: number;
  interfaces: number;
  avgComplexity: number;
  maxComplexity: number;
  avgCoupling: number;
  avgCohesion: number;
  violations: number;
  totalLoc: number;
  dependencies: string[];
  stability: number;
}

/**
 * Relatório completo da análise
 */
interface ArchitectureReport {
  timestamp: string;
  summary: {
    totalFiles: number;
    totalClasses: number;
    totalMethods: number;
    totalLoc: number;
    avgComplexity: number;
    avgCoupling: number;
    avgCohesion: number;
    violations: number;
    technicalDebt: number;
  };
  layers: { [key: string]: LayerAnalysis };
  complexityMetrics: ComplexityMetric[];
  couplingMetrics: CouplingMetric[];
  cohesionMetrics: CohesionMetric[];
  recommendations: string[];
}

// =============================================
// BLOCO 2: CLASSE PRINCIPAL E INICIALIZAÇÃO
// =============================================
// Define a classe principal que coordena toda a análise

export class AdvancedArchitectureAnalyzer {
    // Propriedades principais do analisador
    private project: Project;                                    // Instância do ts-morph
    private complexityMetrics: ComplexityMetric[] = [];         // Armazena métricas de complexidade
    private couplingMetrics: CouplingMetric[] = [];             // Armazena métricas de acoplamento
    private cohesionMetrics: CohesionMetric[] = [];             // Armazena métricas de coesão
    private dependencyGraph: Map<string, Set<string>> = new Map(); // Grafo de dependências
    private reverseDependencyGraph: Map<string, Set<string>> = new Map(); // Grafo reverso
    private classFieldsMap: Map<string, Map<string, Set<string>>> = new Map(); // Mapa de campos por classe

    /**
     * Construtor - Inicializa o projeto ts-morph
     * @param tsConfigPath Caminho para o tsconfig.json
     */
    constructor(tsConfigPath: string = './tsconfig.json') {
        this.project = new Project({
        tsConfigFilePath: tsConfigPath,
        compilerOptions: {
            allowJs: true,              // Permite arquivos JavaScript
            declaration: true,          // Gera arquivos de declaração
            skipLibCheck: true,        // Pula verificação de bibliotecas
        }
        });
    }

    /**
     * FUNÇÃO PRINCIPAL - Orquestra toda a análise
     * Executa as análises em sequência e gera o relatório final
     */
    public async analyzeAll(): Promise<ArchitectureReport> {
        console.log('🗂️ Iniciando análise avançada da arquitetura...\n');
        
        // 1. Filtrar arquivos para análise (excluir node_modules, testes, etc.)
        const sourceFiles = this.getAnalyzableFiles();
        console.log(`📊 Analisando ${sourceFiles.length} arquivos TypeScript...\n`);
        
        // 2. Construir estruturas de dependências
        await this.buildDependencyMaps(sourceFiles);
        
        // 3. Executar análises em paralelo para melhor performance
        await this.executeParallelAnalysis(sourceFiles);
        
        // 4. Gerar relatório final
        const report = this.generateReport();
        
        // 5. Exibir resultados
        this.displaySummary(report);
        
        return report;
    }

    /**
     * Filtra arquivos que devem ser analisados
     */
    private getAnalyzableFiles(): SourceFile[] {
        return this.project.getSourceFiles().filter(sf => {
        const filePath = sf.getFilePath();
        return !filePath.includes('node_modules') &&     // Excluir bibliotecas
                !filePath.includes('.spec.') &&          // Excluir testes spec
                !filePath.includes('.test.') &&          // Excluir testes test
                !filePath.includes('.d.ts') &&           // Excluir arquivos de declaração
                filePath.endsWith('.ts');                // Apenas TypeScript
        });
    }

    /**
     * Executa análises em paralelo
     */
    private async executeParallelAnalysis(sourceFiles: SourceFile[]): Promise<void> {
        console.log('🔍 Executando análises...');
        
        const analysisPromises = sourceFiles.map(async (sourceFile) => {
        const filePath = sourceFile.getFilePath();
        const fileName = path.basename(filePath);
        const layer = this.identifyLayer(filePath);
        
        // Executar as três análises principais em paralelo
        await Promise.all([
            this.analyzeComplexity(sourceFile, filePath, fileName, layer),
            this.analyzeCoupling(sourceFile, filePath, fileName, layer),
            this.analyzeCohesion(sourceFile, filePath, fileName, layer)
        ]);
        });
        
        await Promise.all(analysisPromises);
        console.log('✅ Análises concluídas!\n');
    }

    // =============================================
    // BLOCO 3: IDENTIFICAÇÃO DE CAMADAS E TIPOS
    // =============================================
    // Analisa a estrutura do projeto para classificar arquivos por camada arquitetural

    /**
     * Identifica a camada arquitetural baseada no caminho do arquivo
     * Segue os princípios da Clean Architecture
     */
    private identifyLayer(filePath: string): string {
    const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');
    
    // CAMADA DE ENTIDADES - Regras de negócio empresariais fundamentais
    // Contém as regras que nunca mudam, independente da aplicação
    if (normalizedPath.includes('/entities/') || 
        normalizedPath.includes('/domain/entities/')) return 'entities';
    
    // CAMADA DE DOMÍNIO - Regras de negócio específicas da aplicação
    // Use cases, domain services, policies específicas do negócio
    if (normalizedPath.includes('/domain/') || 
        normalizedPath.includes('/use-cases/') || 
        normalizedPath.includes('/usecases/')) return 'domain';
    
    // CAMADA DE APLICAÇÃO - Orquestração de casos de uso
    // Application services que coordenam o fluxo de dados
    if (normalizedPath.includes('/application/') ||
        normalizedPath.includes('/services/')) return 'application';
    
    // CAMADA DE INFRAESTRUTURA - Detalhes de implementação externos
    // Bancos de dados, APIs externas, frameworks
    if (normalizedPath.includes('/infrastructure/') || 
        normalizedPath.includes('/infra/') ||
        normalizedPath.includes('/repositories/')) return 'infrastructure';
    
    // CAMADA DE APRESENTAÇÃO - Interface com o usuário
    // Controllers, APIs REST/GraphQL, validadores de entrada
    if (normalizedPath.includes('/presentation/') || 
        normalizedPath.includes('/controllers/') || 
        normalizedPath.includes('/api/')) return 'presentation';
    
    // CAMADA COMPARTILHADA - Utilitários e helpers
    // Funções auxiliares, constantes, tipos compartilhados
    if (normalizedPath.includes('/shared/') || 
        normalizedPath.includes('/common/') || 
        normalizedPath.includes('/utils/')) return 'shared';
    
    return 'other';
    }

    /**
     * Identifica o tipo específico do componente
     * Analisa nome do arquivo e classe para determinar o padrão arquitetural
     */
    private identifyComponentType(filePath: string, className?: string): string {
    const fileName = path.basename(filePath).toLowerCase();
    const fullPath = filePath.toLowerCase();
    
    // === ANÁLISE BASEADA NO NOME DO ARQUIVO ===
    
    // Domain Layer Patterns
    if (fileName.includes('entity')) return 'ENTITY';
    if (fileName.includes('value-object') || fileName.includes('vo')) return 'VALUE_OBJECT';
    if (fileName.includes('aggregate')) return 'AGGREGATE';
    if (fileName.includes('domain-service')) return 'DOMAIN_SERVICE';
    
    // Use Case Patterns  
    if (fileName.includes('usecase') || fileName.includes('use-case')) return 'USE_CASE';
    
    // Infrastructure Patterns
    if (fileName.includes('repository')) return 'REPOSITORY';
    if (fileName.includes('gateway')) return 'GATEWAY';
    if (fileName.includes('adapter')) return 'ADAPTER';
    
    // Service Patterns (context-dependent)
    if (fileName.includes('service')) {
        if (fullPath.includes('/domain/')) return 'DOMAIN_SERVICE';
        if (fullPath.includes('/infrastructure/')) return 'INFRA_SERVICE';
        if (fullPath.includes('/application/')) return 'APPLICATION_SERVICE';
        return 'SERVICE';
    }
    
    // Presentation Layer Patterns
    if (fileName.includes('controller')) return 'CONTROLLER';
    if (fileName.includes('guard')) return 'GUARD';
    if (fileName.includes('interceptor')) return 'INTERCEPTOR';
    if (fileName.includes('middleware')) return 'MIDDLEWARE';
    if (fileName.includes('decorator')) return 'DECORATOR';
    
    // Utility Patterns
    if (fileName.includes('factory')) return 'FACTORY';
    if (fileName.includes('builder')) return 'BUILDER';
    if (fileName.includes('mapper')) return 'MAPPER';
    if (fileName.includes('dto')) return 'DTO';
    if (fileName.includes('exception') || fileName.includes('error')) return 'EXCEPTION';
    if (fileName.includes('config')) return 'CONFIG';
    if (fileName.includes('types') || fileName.includes('interface')) return 'TYPES';
    if (fileName.includes('module')) return 'MODULE';
    
    // === ANÁLISE BASEADA NO NOME DA CLASSE ===
    if (className) {
        const lowerClassName = className.toLowerCase();
        if (lowerClassName.includes('entity')) return 'ENTITY';
        if (lowerClassName.includes('repository')) return 'REPOSITORY';
        if (lowerClassName.includes('service')) return 'SERVICE';
        if (lowerClassName.includes('controller')) return 'CONTROLLER';
        if (lowerClassName.includes('usecase')) return 'USE_CASE';
        if (lowerClassName.includes('factory')) return 'FACTORY';
        if (lowerClassName.includes('builder')) return 'BUILDER';
        if (lowerClassName.includes('adapter')) return 'ADAPTER';
        if (lowerClassName.includes('mapper')) return 'MAPPER';
    }
    
    return 'OTHER';
    }

    /**
     * Valida se a organização das camadas segue os princípios da Clean Architecture
     * Verifica violações de dependência entre camadas
     */
    private validateLayerDependencies(): string[] {
    const violations: string[] = [];
    
    // Regras da Clean Architecture:
    // 1. Entidades não podem depender de nenhuma outra camada
    // 2. Domínio só pode depender de Entidades
    // 3. Aplicação pode depender de Domínio e Entidades
    // 4. Infraestrutura pode depender de todas as camadas internas
    // 5. Apresentação pode depender de Aplicação, Domínio e Entidades
    
    for (const [filePath, dependencies] of this.dependencyGraph) {
        const currentLayer = this.identifyLayer(filePath);
        
        for (const depPath of dependencies) {
        const depLayer = this.identifyLayer(depPath);
        
        // Verificar violações específicas
        if (currentLayer === 'entities' && depLayer !== 'entities') {
            violations.push(`VIOLAÇÃO: Entidade ${filePath} depende de ${depLayer}`);
        }
        
        if (currentLayer === 'domain' && !['entities', 'domain'].includes(depLayer)) {
            violations.push(`VIOLAÇÃO: Domínio ${filePath} depende de ${depLayer}`);
        }
        
        if (currentLayer === 'presentation' && depLayer === 'infrastructure') {
            violations.push(`VIOLAÇÃO: Apresentação ${filePath} depende diretamente de Infraestrutura`);
        }
        }
    }
    
    return violations;
    }

    // =============================================
    // BLOCO 4: ANÁLISE DE DEPENDÊNCIAS
    // =============================================
    // Constrói o grafo de dependências do projeto analisando imports e exports

    /**
     * Constrói mapas de dependências analisando todos os imports do projeto
     * Cria tanto o grafo direto quanto o reverso para análises de acoplamento
     */
    private async buildDependencyMaps(sourceFiles: SourceFile[]): Promise<void> {
        console.log('🔗 Construindo grafo de dependências...');
        
        for (const sourceFile of sourceFiles) {
            const filePath = sourceFile.getFilePath();
            const dependencies = new Set<string>();
            
            // === ANÁLISE DE IMPORTS ESTÁTICOS ===
            // Processa declarações import { ... } from '...'
            sourceFile.getImportDeclarations().forEach(importDecl => {
            const moduleSpecifier = importDecl.getModuleSpecifierValue();
            
            // Processar apenas dependências internas do projeto
            if (!this.isExternalDependency(moduleSpecifier)) {
                const resolvedPath = this.resolveImportPath(filePath, moduleSpecifier);
                if (resolvedPath) {
                dependencies.add(resolvedPath);
                }
            }
            });
            
            // === ANÁLISE DE DYNAMIC IMPORTS ===
            // Processa chamadas import() dinâmicas
            sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(callExpr => {
            const expression = callExpr.getExpression();
            
            if (Node.isIdentifier(expression) && expression.getText() === 'import') {
                const args = callExpr.getArguments();
                if (args.length > 0 && Node.isStringLiteral(args[0])) {
                const moduleSpecifier = args[0].getLiteralValue();
                if (!this.isExternalDependency(moduleSpecifier)) {
                    const resolvedPath = this.resolveImportPath(filePath, moduleSpecifier);
                    if (resolvedPath) {
                    dependencies.add(resolvedPath);
                    }
                }
                }
            }
            });
            
            // === ANÁLISE DE REQUIRE (Node.js) ===
            // Processa chamadas require() para compatibilidade
            sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(callExpr => {
            const expression = callExpr.getExpression();
            
            if (Node.isIdentifier(expression) && expression.getText() === 'require') {
                const args = callExpr.getArguments();
                if (args.length > 0 && Node.isStringLiteral(args[0])) {
                const moduleSpecifier = args[0].getLiteralValue();
                if (!this.isExternalDependency(moduleSpecifier)) {
                    const resolvedPath = this.resolveImportPath(filePath, moduleSpecifier);
                    if (resolvedPath) {
                    dependencies.add(resolvedPath);
                    }
                }
                }
            }
            });
            
            // Armazenar no grafo principal
            this.dependencyGraph.set(filePath, dependencies);
            
            // === CONSTRUÇÃO DO GRAFO REVERSO ===
            // Para cada dependência, registrar que este arquivo a utiliza
            dependencies.forEach(dep => {
            if (!this.reverseDependencyGraph.has(dep)) {
                this.reverseDependencyGraph.set(dep, new Set());
            }
            this.reverseDependencyGraph.get(dep)!.add(filePath);
            });
            
            // === MAPEAMENTO DE CAMPOS DE CLASSES ===
            // Necessário para cálculos de coesão
            this.mapClassFields(sourceFile);
        }
        
        // Estatísticas do grafo construído
        this.logDependencyStats();
    }

    /**
     * Verifica se um módulo é dependência externa (biblioteca)
     */
    private isExternalDependency(moduleSpecifier: string): boolean {
        const externalDeps = [
            // Core Node.js modules
            'fs', 'path', 'crypto', 'util', 'stream', 'events', 'http', 'https',
            // Popular libraries
            'typescript', 'reflect-metadata', 'rxjs', '@nestjs', 'lodash', 
            'moment', 'uuid', 'axios', 'express', 'prisma', 'typeorm',
            // Framework-specific
            'react', 'angular', 'vue', '@angular', '@vue'
        ];
        
        // É externa se:
        // 1. Começa com um dos prefixos conhecidos
        // 2. Não é um import relativo (./ ou ../)  
        // 3. Não começa com @ seguido de caminho relativo
        return externalDeps.some(dep => moduleSpecifier.startsWith(dep)) || 
                (!moduleSpecifier.startsWith('./') && 
                !moduleSpecifier.startsWith('../') &&
                !moduleSpecifier.startsWith('@/'));
    }

    /**
     * Resolve caminhos de import relativos para absolutos
     */
    private resolveImportPath(fromFile: string, moduleSpecifier: string): string | null {
        if (moduleSpecifier.startsWith('./') || moduleSpecifier.startsWith('../')) {
            const resolved = path.resolve(path.dirname(fromFile), moduleSpecifier);
            
            // Tentar diferentes extensões comuns
            const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
            
            for (const ext of extensions) {
            const fullPath = resolved + ext;
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
            }
            
            // Se é um diretório, tentar index
            if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
            const indexPath = path.join(resolved, 'index.ts');
            if (fs.existsSync(indexPath)) {
                return indexPath;
            }
            }
        }
        
        return null;
        }

        /**
         * Mapeia campos/propriedades de classes para análise de coesão
         */
    private mapClassFields(sourceFile: SourceFile): void {
        const filePath = sourceFile.getFilePath();
        
        sourceFile.getClasses().forEach(classDecl => {
            const className = classDecl.getName();
            if (!className) return;
            
            if (!this.classFieldsMap.has(filePath)) {
            this.classFieldsMap.set(filePath, new Map());
            }
            
            const fields = new Set<string>();
            
            // === MAPEAR PROPRIEDADES ===
            classDecl.getProperties().forEach(prop => {
            const propName = prop.getName();
            if (propName) fields.add(propName);
            });
            
            // === MAPEAR PARÂMETROS DO CONSTRUTOR ===
            // No TypeScript, parâmetros do construtor com modificadores (public, private, protected)
            // automaticamente se tornam propriedades da classe
            classDecl.getConstructors().forEach(constructor => {
            constructor.getParameters().forEach(param => {
                if (param.hasModifier(SyntaxKind.PublicKeyword) ||
                    param.hasModifier(SyntaxKind.PrivateKeyword) ||
                    param.hasModifier(SyntaxKind.ProtectedKeyword)) {
                const paramName = param.getName();
                if (paramName) fields.add(paramName);
                }
            });
            });
            
            this.classFieldsMap.get(filePath)!.set(className, fields);
        });
        }

        /**
         * Calcula métricas do grafo de dependências
         */
    private logDependencyStats(): void {
        const totalNodes = this.dependencyGraph.size;
        const totalEdges = Array.from(this.dependencyGraph.values())
            .reduce((sum, deps) => sum + deps.size, 0);
        
        // Calcular densidade do grafo (0 a 1)
        const maxEdges = totalNodes * (totalNodes - 1);
        const density = maxEdges > 0 ? totalEdges / maxEdges : 0;
        
        // Encontrar arquivos com mais dependências
        const highCouplingFiles = Array.from(this.dependencyGraph.entries())
            .sort(([,a], [,b]) => b.size - a.size)
            .slice(0, 5);
        
        console.log(`✅ Grafo de dependências construído:`);
        console.log(`   📊 ${totalNodes} nós (arquivos)`);
        console.log(`   🔗 ${totalEdges} arestas (dependências)`);
        console.log(`   📈 Densidade: ${(density * 100).toFixed(2)}%`);
        
        if (highCouplingFiles.length > 0) {
            console.log(`   ⚠️  Arquivos com mais dependências:`);
            highCouplingFiles.forEach(([file, deps]) => {
            const fileName = path.basename(file);
            console.log(`      - ${fileName}: ${deps.size} dependências`);
            });
        }
        
        console.log('');
    }

    // =============================================
    // BLOCO 5: ANÁLISE DE COMPLEXIDADE CICLOMÁTICA
    // =============================================
    // Implementa o algoritmo de McCabe para medir complexidade ciclomática

    /**
     * Análise principal de complexidade de um arquivo
     * Processa classes, métodos, funções e construtores
     */
    private async analyzeComplexity(sourceFile: SourceFile, filePath: string, fileName: string, layer: string): Promise<void> {
        // === ANÁLISE DE CLASSES ===
        sourceFile.getClasses().forEach(classDecl => {
            const className = classDecl.getName() || 'AnonymousClass';
            const componentType = this.identifyComponentType(filePath, className);
            
            // Métodos da classe
            classDecl.getMethods().forEach(method => {
            const metrics = this.calculateMethodComplexity(method, filePath, fileName, layer, className, componentType);
            this.complexityMetrics.push(metrics);
            });
            
            // Construtores
            classDecl.getConstructors().forEach(constructor => {
            const metrics = this.calculateConstructorComplexity(constructor, filePath, fileName, layer, className, componentType);
            this.complexityMetrics.push(metrics);
            });
            
            // Getters
            classDecl.getGetAccessors().forEach(getter => {
            const metrics = this.calculateAccessorComplexity(getter, filePath, fileName, layer, className, componentType, 'getter');
            this.complexityMetrics.push(metrics);
            });
            
            // Setters
            classDecl.getSetAccessors().forEach(setter => {
            const metrics = this.calculateAccessorComplexity(setter, filePath, fileName, layer, className, componentType, 'setter');
            this.complexityMetrics.push(metrics);
            });
        });

        // === ANÁLISE DE FUNÇÕES INDEPENDENTES ===
        sourceFile.getFunctions().forEach(func => {
            const metrics = this.calculateFunctionComplexity(func, filePath, fileName, layer);
            this.complexityMetrics.push(metrics);
        });

        // === ANÁLISE DE ARROW FUNCTIONS E FUNCTION EXPRESSIONS ===
        sourceFile.getVariableStatements().forEach(varStmt => {
            varStmt.getDeclarations().forEach(decl => {
            const initializer = decl.getInitializer();
            if (initializer && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
                const functionName = decl.getName();
                const metrics = this.calculateArrowFunctionComplexity(initializer, filePath, fileName, layer, functionName);
                this.complexityMetrics.push(metrics);
            }
            });
        });
    }

    /**
     * COMPLEXIDADE CICLOMÁTICA (McCabe)
     * Mede o número de caminhos linearmente independentes através do código
     * Fórmula: V(G) = E - N + 2P (onde E=arestas, N=nós, P=componentes)
     * Implementação prática: 1 + número de pontos de decisão
     */
    private calculateCyclomaticComplexity(node: Node): number {
        let complexity = 1; // Complexidade base - um caminho sempre existe
        
        const traverse = (currentNode: Node) => {
            const kind = currentNode.getKind();
            
            switch (kind) {
            // === ESTRUTURAS CONDICIONAIS ===
            case SyntaxKind.IfStatement:           // if, else if
                complexity++;
                break;
                
            case SyntaxKind.ConditionalExpression: // operador ternário (? :)
                complexity++;
                break;
                
            // === ESTRUTURAS DE REPETIÇÃO ===  
            case SyntaxKind.WhileStatement:        // while
            case SyntaxKind.DoStatement:           // do-while
            case SyntaxKind.ForStatement:          // for
            case SyntaxKind.ForInStatement:        // for-in
            case SyntaxKind.ForOfStatement:        // for-of
                complexity++;
                break;
                
            // === SWITCH CASES ===
            case SyntaxKind.CaseClause:            // cada case adiciona um caminho
                complexity++;
                break;
                
            // === TRATAMENTO DE EXCEÇÕES ===
            case SyntaxKind.CatchClause:           // catch
                complexity++;
                break;
                
            // === OPERADORES LÓGICOS ===
            case SyntaxKind.BinaryExpression:
                const binaryExpr = currentNode.asKindOrThrow(SyntaxKind.BinaryExpression);
                const operator = binaryExpr.getOperatorToken().getKind();
                
                // && e || criam caminhos alternativos devido ao short-circuit
                if (operator === SyntaxKind.AmpersandAmpersandToken ||  // &&
                    operator === SyntaxKind.BarBarToken ||             // ||
                    operator === SyntaxKind.QuestionQuestionToken) {   // ?? (nullish coalescing)
                complexity++;
                }
                break;
                
            // === RECURSOS MODERNOS DO TYPESCRIPT ===
            case SyntaxKind.QuestionDotToken:      // Optional chaining (?.)
                complexity++; // Cria caminho alternativo se propriedade não existir
                break;
            }
            
            // Recursão nos nós filhos
            currentNode.getChildren().forEach(traverse);
        };
        
        traverse(node);
        return complexity;
    }

    /**
     * COMPLEXIDADE COGNITIVA  
     * Mede a dificuldade de compreensão considerando aninhamento
     * Mais precisa que ciclomática para medir dificuldade real
     */
    private calculateCognitiveComplexity(node: Node): number {
        let complexity = 0;
        
        const traverse = (currentNode: Node, nestingLevel: number = 0) => {
            const kind = currentNode.getKind();
            let increment = 0;
            let nestingIncrement = 0;
            
            switch (kind) {
            // === ESTRUTURAS COM ANINHAMENTO (penaliza aninhamento) ===
            case SyntaxKind.IfStatement:
            case SyntaxKind.SwitchStatement:
            case SyntaxKind.ForStatement:
            case SyntaxKind.ForInStatement:
            case SyntaxKind.ForOfStatement:
            case SyntaxKind.WhileStatement:
            case SyntaxKind.DoStatement:
            case SyntaxKind.CatchClause:
                increment = 1 + nestingLevel; // +1 base + nível de aninhamento
                nestingIncrement = 1;
                break;
                
            // === OPERADORES CONDICIONAIS (sem penalizar aninhamento) ===
            case SyntaxKind.ConditionalExpression:
                increment = 1;
                break;
                
            // === OPERADORES LÓGICOS ===
            case SyntaxKind.BinaryExpression:
                const binaryExpr = currentNode.asKindOrThrow(SyntaxKind.BinaryExpression);
                const operator = binaryExpr.getOperatorToken().getKind();
                if (operator === SyntaxKind.AmpersandAmpersandToken || 
                    operator === SyntaxKind.BarBarToken) {
                increment = 1;
                }
                break;
                
            // === FUNÇÕES ANINHADAS (penaliza muito) ===
            case SyntaxKind.FunctionDeclaration:
            case SyntaxKind.ArrowFunction:
            case SyntaxKind.FunctionExpression:
                if (nestingLevel > 0) { // Só penaliza se estiver aninhada
                increment = 1 + nestingLevel;
                nestingIncrement = 1;
                }
                break;
            }
            
            complexity += increment;
            
            currentNode.getChildren().forEach(child => 
            traverse(child, nestingLevel + nestingIncrement)
            );
        };
        
        traverse(node);
        return complexity;
    }

    /**
     * Calcula métricas para um método de classe
     */
    private calculateMethodComplexity(
    method: MethodDeclaration, 
    filePath: string, 
    fileName: string, 
    layer: string, 
    className: string,
    componentType: string
    ): ComplexityMetric {
        const methodName = method.getName();
        const cyclomaticComplexity = this.calculateCyclomaticComplexity(method);
        const cognitiveComplexity = this.calculateCognitiveComplexity(method);
        const linesOfCode = this.countLinesOfCode(method);
        const parameters = method.getParameters().length;
        const nestingDepth = this.calculateNestingDepth(method);
        const halsteadComplexity = this.calculateHalsteadMetrics(method);
        const maintainabilityIndex = this.calculateMaintainabilityIndex(
            halsteadComplexity, cyclomaticComplexity, linesOfCode
        );
        
        return {
            fileName,
            filePath,
            layer,
            className,
            methodName,
            type: componentType,
            cyclomaticComplexity,
            cognitiveComplexity,
            linesOfCode,
            parameters,
            nestingDepth,
            maintainabilityIndex,
            halsteadComplexity,
            risk: this.calculateRisk(cyclomaticComplexity, cognitiveComplexity, maintainabilityIndex)
        };
    }

    /**
     * Calcula métricas para um construtor
     */
    private calculateConstructorComplexity(
    constructor: ConstructorDeclaration, 
    filePath: string, 
    fileName: string, 
    layer: string, 
    className: string,
    componentType: string
    ): ComplexityMetric {
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(constructor);
    const cognitiveComplexity = this.calculateCognitiveComplexity(constructor);
    const linesOfCode = this.countLinesOfCode(constructor);
    const parameters = constructor.getParameters().length;
    const nestingDepth = this.calculateNestingDepth(constructor);
    const halsteadComplexity = this.calculateHalsteadMetrics(constructor);
    const maintainabilityIndex = this.calculateMaintainabilityIndex(
        halsteadComplexity, cyclomaticComplexity, linesOfCode
    );
    
        return {
            fileName,
            filePath,
            layer,
            className,
            methodName: 'constructor',
            type: componentType,
            cyclomaticComplexity,
            cognitiveComplexity,
            linesOfCode,
            parameters,
            nestingDepth,
            maintainabilityIndex,
            halsteadComplexity,
            risk: this.calculateRisk(cyclomaticComplexity, cognitiveComplexity, maintainabilityIndex)
        };
    }

    // =============================================
    // BLOCO 6: MÉTRICAS DE HALSTEAD E FUNÇÕES AUXILIARES
    // =============================================
    // Calcula métricas baseadas em operadores e operandos + funções de suporte

    /**
     * MÉTRICAS DE HALSTEAD
     * Baseadas na contagem de operadores e operandos únicos e totais
     * Fornecem estimativas de esforço, tempo e bugs
     */
    private calculateHalsteadMetrics(node: Node): HalsteadMetrics {
        const operators = new Set<string>();      // Operadores únicos
        const operands = new Set<string>();       // Operandos únicos  
        let totalOperators = 0;                   // Total de operadores
        let totalOperands = 0;                    // Total de operandos
        
        const traverse = (currentNode: Node) => {
            const kind = currentNode.getKind();
            const text = currentNode.getText().trim();
            
            // === IDENTIFICAR OPERADORES ===
            if (this.isOperator(kind)) {
            operators.add(text);
            totalOperators++;
            }
            // === IDENTIFICAR OPERANDOS ===
            else if (this.isOperand(kind)) {
            operands.add(text);
            totalOperands++;
            }
            
            // Recursão nos filhos
            currentNode.getChildren().forEach(traverse);
        };
        
        traverse(node);
        
        // === CÁLCULO DAS MÉTRICAS HALSTEAD ===
        const n1 = operators.size;           // η1 - Operadores únicos
        const n2 = operands.size;            // η2 - Operandos únicos
        const N1 = totalOperators;           // N1 - Total de operadores
        const N2 = totalOperands;            // N2 - Total de operandos
        
        const vocabulary = n1 + n2;          // n = n1 + n2 (vocabulário)
        const length = N1 + N2;              // N = N1 + N2 (comprimento)
        const volume = length * Math.log2(vocabulary || 1);     // V = N * log2(n)
        const difficulty = (n1 / 2) * (N2 / (n2 || 1));       // D = (n1/2) * (N2/n2)
        const effort = difficulty * volume;                      // E = D * V
        const timeToImplement = effort / 18;                    // T = E / 18 segundos
        const bugsDelivered = volume / 3000;                    // B = V / 3000
        
        return {
            operators: N1,
            operands: N2,
            distinctOperators: n1,
            distinctOperands: n2,
            vocabulary,
            length,
            volume,
            difficulty,
            effort,
            timeToImplement,
            bugsDelivered
        };
    }

    /**
     * Identifica se um token é um operador
     */
    private isOperator(kind: SyntaxKind): boolean {
        const operatorKinds = [
            // Aritméticos
            SyntaxKind.PlusToken, SyntaxKind.MinusToken, SyntaxKind.AsteriskToken,
            SyntaxKind.SlashToken, SyntaxKind.PercentToken, SyntaxKind.AsteriskAsteriskToken,
            
            // Comparação
            SyntaxKind.EqualsEqualsToken, SyntaxKind.ExclamationEqualsToken,
            SyntaxKind.EqualsEqualsEqualsToken, SyntaxKind.ExclamationEqualsEqualsToken,
            SyntaxKind.LessThanToken, SyntaxKind.GreaterThanToken,
            SyntaxKind.LessThanEqualsToken, SyntaxKind.GreaterThanEqualsToken,
            
            // Lógicos
            SyntaxKind.AmpersandAmpersandToken, SyntaxKind.BarBarToken,
            SyntaxKind.ExclamationToken,
            
            // Bitwise
            SyntaxKind.AmpersandToken, SyntaxKind.BarToken, SyntaxKind.CaretToken,
            SyntaxKind.TildeToken, SyntaxKind.LessThanLessThanToken, SyntaxKind.GreaterThanGreaterThanToken,
            
            // Atribuição
            SyntaxKind.EqualsToken, SyntaxKind.PlusEqualsToken, SyntaxKind.MinusEqualsToken,
            SyntaxKind.AsteriskEqualsToken, SyntaxKind.SlashEqualsToken,
            
            // Unários
            SyntaxKind.PlusPlusToken, SyntaxKind.MinusMinusToken,
            
            // Modernos
            SyntaxKind.QuestionQuestionToken, SyntaxKind.QuestionDotToken,
        ];
        
        return operatorKinds.includes(kind);
    }

    /**
     * Identifica se um token é um operando
     */
    private isOperand(kind: SyntaxKind): boolean {
        const operandKinds = [
            // Identificadores
            SyntaxKind.Identifier,
            
            // Literais
            SyntaxKind.StringLiteral, SyntaxKind.NumericLiteral, SyntaxKind.BigIntLiteral,
            SyntaxKind.NoSubstitutionTemplateLiteral,
            
            // Palavras-chave como valores
            SyntaxKind.TrueKeyword, SyntaxKind.FalseKeyword, SyntaxKind.NullKeyword,
            SyntaxKind.UndefinedKeyword, SyntaxKind.ThisKeyword, SyntaxKind.SuperKeyword,
        ];
        
        return operandKinds.includes(kind);
    }

    /**
     * FUNÇÕES AUXILIARES PARA CÁLCULO DE MÉTRICAS
     */

    /**
     * Conta linhas de código efetivas (excluindo comentários e linhas vazias)
     */
    private countLinesOfCode(node: Node): number {
        const text = node.getText();
        const lines = text.split('\n');
        
        return lines.filter(line => {
            const trimmed = line.trim();
            // Excluir linhas vazias e comentários
            return trimmed.length > 0 && 
                !trimmed.startsWith('//') && 
                !trimmed.startsWith('/*') && 
                !trimmed.startsWith('*') &&
                trimmed !== '*/';
        }).length;
    }

    /**
     * Calcula a profundidade máxima de aninhamento
     * Importante para medir complexidade estrutural
     */
    private calculateNestingDepth(node: Node): number {
        let maxDepth = 0;
        
        const traverse = (currentNode: Node, currentDepth: number = 0) => {
            const kind = currentNode.getKind();
            let newDepth = currentDepth;
            
            // === ESTRUTURAS QUE AUMENTAM ANINHAMENTO ===
            const nestingStructures = [
            SyntaxKind.IfStatement,
            SyntaxKind.ForStatement,
            SyntaxKind.ForInStatement,
            SyntaxKind.ForOfStatement,
            SyntaxKind.WhileStatement,
            SyntaxKind.DoStatement,
            SyntaxKind.SwitchStatement,
            SyntaxKind.TryStatement,
            SyntaxKind.CatchClause,
            SyntaxKind.FunctionDeclaration,
            SyntaxKind.ArrowFunction,
            SyntaxKind.FunctionExpression,
            ];
            
            if (nestingStructures.includes(kind)) {
            newDepth++;
            maxDepth = Math.max(maxDepth, newDepth);
            }
            
            // Recursão com novo nível de profundidade
            currentNode.getChildren().forEach(child => traverse(child, newDepth));
        };
        
        traverse(node);
        return maxDepth;
    }

    /**
     * ÍNDICE DE MANUTENIBILIDADE
     * Combina complexidade ciclomática, Halstead e linhas de código
     * Fórmula: 171 - 5.2 * ln(aveE) - 0.23 * aveV(g) - 16.2 * ln(aveLOC)
     * Resultado: 0-171 (maior = mais manutenível)
     */
    private calculateMaintainabilityIndex(
    halstead: HalsteadMetrics, 
    cyclomatic: number, 
    loc: number
    ): number {
        // Evitar logaritmo de zero
        const aveE = Math.max(halstead.effort, 1);
        const aveVg = Math.max(cyclomatic, 1);
        const aveLOC = Math.max(loc, 1);
        
        const index = 171 - 5.2 * Math.log(aveE) - 0.23 * aveVg - 16.2 * Math.log(aveLOC);
        
        // Normalizar entre 0 e 171
        return Math.max(0, Math.min(171, index));
    }

    /**
     * CÁLCULO DE NÍVEL DE RISCO
     * Combina diferentes métricas para determinar risco geral
     */
    private calculateRisk(
    cyclomatic: number, 
    cognitive: number, 
    maintainability: number
    ): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
        let riskScore = 0;
        
        // === COMPLEXIDADE CICLOMÁTICA ===
        if (cyclomatic > 20) riskScore += 3;      // Muito alta
        else if (cyclomatic > 10) riskScore += 2;  // Alta
        else if (cyclomatic > 5) riskScore += 1;   // Moderada
        
        // === COMPLEXIDADE COGNITIVA ===
        if (cognitive > 25) riskScore += 3;        // Muito alta
        else if (cognitive > 15) riskScore += 2;   // Alta  
        else if (cognitive > 10) riskScore += 1;   // Moderada
        
        // === MANUTENIBILIDADE ===
        if (maintainability < 20) riskScore += 3;      // Muito baixa
        else if (maintainability < 40) riskScore += 2;  // Baixa
        else if (maintainability < 60) riskScore += 1;  // Moderada
        
        // === CLASSIFICAÇÃO FINAL ===
        if (riskScore >= 7) return 'VERY_HIGH';    // 7-9 pontos
        if (riskScore >= 5) return 'HIGH';         // 5-6 pontos  
        if (riskScore >= 3) return 'MEDIUM';       // 3-4 pontos
        return 'LOW';                              // 0-2 pontos
    }

    /**
     * Calcula complexidade para accessor (getter/setter)
     */
    private calculateAccessorComplexity(
        accessor: GetAccessorDeclaration | SetAccessorDeclaration, 
        filePath: string, 
        fileName: string, 
        layer: string, 
        className: string,
        componentType: string,
        accessorType: 'getter' | 'setter'
        ): ComplexityMetric {
        const methodName = `${accessorType}_${accessor.getName()}`;
        const cyclomaticComplexity = this.calculateCyclomaticComplexity(accessor);
        const cognitiveComplexity = this.calculateCognitiveComplexity(accessor);
        const linesOfCode = this.countLinesOfCode(accessor);
        const parameters = accessor.getParameters().length;
        const nestingDepth = this.calculateNestingDepth(accessor);
        const halsteadComplexity = this.calculateHalsteadMetrics(accessor);
        const maintainabilityIndex = this.calculateMaintainabilityIndex(
            halsteadComplexity, cyclomaticComplexity, linesOfCode
        );
        
        return {
            fileName,
            filePath,
            layer,
            className,
            methodName,
            type: componentType,
            cyclomaticComplexity,
            cognitiveComplexity,
            linesOfCode,
            parameters,
            nestingDepth,
            maintainabilityIndex,
            halsteadComplexity,
            risk: this.calculateRisk(cyclomaticComplexity, cognitiveComplexity, maintainabilityIndex)
        };
    }

    /**
     * Calcula complexidade para arrow function
     */
    private calculateArrowFunctionComplexity(
        func: ArrowFunction | FunctionExpression, 
        filePath: string, 
        fileName: string, 
        layer: string,
        functionName: string
    ): ComplexityMetric {
        const cyclomaticComplexity = this.calculateCyclomaticComplexity(func);
        const cognitiveComplexity = this.calculateCognitiveComplexity(func);
        const linesOfCode = this.countLinesOfCode(func);
        const parameters = func.getParameters().length;
        const nestingDepth = this.calculateNestingDepth(func);
        const halsteadComplexity = this.calculateHalsteadMetrics(func);
        const maintainabilityIndex = this.calculateMaintainabilityIndex(
            halsteadComplexity, cyclomaticComplexity, linesOfCode
        );
        
        return {
            fileName,
            filePath,
            layer,
            methodName: functionName,
            type: 'FUNCTION',
            cyclomaticComplexity,
            cognitiveComplexity,
            linesOfCode,
            parameters,
            nestingDepth,
            maintainabilityIndex,
            halsteadComplexity,
            risk: this.calculateRisk(cyclomaticComplexity, cognitiveComplexity, maintainabilityIndex)
        };
    }

    // =============================================
    // BLOCO 7: ANÁLISE DE ACOPLAMENTO
    // =============================================
    // Mede as dependências entre classes e módulos

    /**
     * Análise principal de acoplamento de um arquivo
     * Calcula métricas Ca, Ce, Instabilidade, Abstractness, Distance
     */
    private async analyzeCoupling(sourceFile: SourceFile, filePath: string, fileName: string, layer: string): Promise<void> {
        // Analisar apenas classes (o acoplamento se aplica principalmente a classes)
        sourceFile.getClasses().forEach(classDecl => {
            const className = classDecl.getName();
            if (!className) return;
            
            const metrics = this.calculateCouplingMetrics(classDecl, filePath, fileName, layer, className);
            this.couplingMetrics.push(metrics);
        });
    }

    /**
     * Calcula todas as métricas de acoplamento para uma classe
     */
    private calculateCouplingMetrics(
        classDecl: ClassDeclaration, 
        filePath: string, 
        fileName: string, 
        layer: string, 
        className: string
    ): CouplingMetric {
        // === CÁLCULO DO ACOPLAMENTO EFERENTE (Ce) ===
        // Número de classes/módulos dos quais esta classe depende
        const dependencies = this.dependencyGraph.get(filePath) || new Set();
        const efferentCoupling = dependencies.size;
        
        // === CÁLCULO DO ACOPLAMENTO AFERENTE (Ca) ===
        // Número de classes/módulos que dependem desta classe
        const dependents = this.reverseDependencyGraph.get(filePath) || new Set();
        const afferentCoupling = dependents.size;
        
        // === INSTABILIDADE (I) ===
        // I = Ce / (Ca + Ce)
        // 0 = Completamente estável, 1 = Completamente instável
        const totalCoupling = afferentCoupling + efferentCoupling;
        const instability = totalCoupling > 0 ? efferentCoupling / totalCoupling : 0;
        
        // === ABSTRACTNESS (A) ===
        // Proporção de classes abstratas em relação ao total
        const abstractness = this.calculateAbstractness(filePath);
        
        // === DISTANCE FROM MAIN SEQUENCE (D) ===
        // D = |A + I - 1|
        // Distância da "linha principal" ideal (A + I = 1)
        const distance = Math.abs(abstractness + instability - 1);
        
        // === FAN-IN e FAN-OUT ===
        const fanIn = afferentCoupling;   // Mesmo que Ca
        const fanOut = efferentCoupling;  // Mesmo que Ce
        
        // === ÍNDICE GERAL DE ACOPLAMENTO ===
        const coupling = this.calculateOverallCoupling(classDecl, filePath);
        
        // === LISTAS DE DEPENDÊNCIAS ===
        const imports = this.getImportsList(filePath);
        const internalDependencies = this.getInternalDependencies(filePath);
        const classDependents = Array.from(dependents);
        
        return {
            fileName,
            filePath,
            layer,
            className,
            afferentCoupling,
            efferentCoupling,
            instability,
            abstractness,
            distance,
            fanIn,
            fanOut,
            coupling,
            imports,
            dependencies: internalDependencies,
            dependents: classDependents,
            risk: this.calculateCouplingRisk(efferentCoupling, afferentCoupling, instability, distance)
        };
    }

    /**
     * Calcula a abstractness de um arquivo
     * A = (interfaces + classes abstratas) / total de classes
     */
    private calculateAbstractness(filePath: string): number {
        const sourceFile = this.project.getSourceFile(filePath);
        if (!sourceFile) return 0;
        
        const interfaces = sourceFile.getInterfaces().length;
        const classes = sourceFile.getClasses();
        const totalClasses = classes.length;
        
        if (totalClasses === 0) return interfaces > 0 ? 1 : 0;
        
        // Contar classes abstratas
        const abstractClasses = classes.filter(cls => cls.isAbstract()).length;
        
        return (interfaces + abstractClasses) / (totalClasses + interfaces);
    }

    /**
     * Calcula índice geral de acoplamento analisando o uso interno de outras classes
     */
    private calculateOverallCoupling(classDecl: ClassDeclaration, filePath: string): number {
        let couplingScore = 0;
        
        // === ACOPLAMENTO POR HERANÇA ===
        const extendsClause = classDecl.getExtends();
        if (extendsClause) {
            couplingScore += 3; // Herança cria acoplamento forte
        }
        
        // === ACOPLAMENTO POR IMPLEMENTAÇÃO ===
        const implementsClause = classDecl.getImplements();
        couplingScore += implementsClause.length * 2; // Implementação cria acoplamento médio
        
        // === ACOPLAMENTO POR COMPOSIÇÃO ===
        const properties = classDecl.getProperties();
        properties.forEach(prop => {
            const typeNode = prop.getTypeNode();
            if (typeNode) {
            // Se a propriedade é de um tipo customizado (não primitivo)
            const typeText = typeNode.getText();
            if (!this.isPrimitiveType(typeText)) {
                couplingScore += 1; // Composição cria acoplamento leve
            }
            }
        });
        
        // === ACOPLAMENTO POR PARÂMETROS DE MÉTODO ===
        const methods = classDecl.getMethods();
        methods.forEach(method => {
            const parameters = method.getParameters();
            parameters.forEach(param => {
            const typeNode = param.getTypeNode();
            if (typeNode && !this.isPrimitiveType(typeNode.getText())) {
                couplingScore += 0.5;
            }
            });
        });
        
        // === ACOPLAMENTO POR DEPENDÊNCIAS NO CONSTRUTOR ===
        const constructors = classDecl.getConstructors();
        constructors.forEach(constructor => {
            const parameters = constructor.getParameters();
            parameters.forEach(param => {
            // Dependency Injection aumenta acoplamento
            if (param.hasModifier(SyntaxKind.PrivateKeyword) ||
                param.hasModifier(SyntaxKind.ProtectedKeyword) ||
                param.hasModifier(SyntaxKind.PublicKeyword)) {
                couplingScore += 1;
            }
            });
        });
        
        return couplingScore;
    }

    /**
     * Verifica se um tipo é primitivo (não gera acoplamento)
     */
    private isPrimitiveType(typeText: string): boolean {
        const primitiveTypes = [
            'string', 'number', 'boolean', 'void', 'null', 'undefined', 
            'any', 'unknown', 'never', 'object', 'Date', 'Array', 'Promise'
        ];
        
        return primitiveTypes.some(type => typeText.toLowerCase().includes(type.toLowerCase()));
    }

    /**
     * Obtém lista de imports de um arquivo
     */
    private getImportsList(filePath: string): string[] {
        const sourceFile = this.project.getSourceFile(filePath);
        if (!sourceFile) return [];
        
        return sourceFile.getImportDeclarations().map(importDecl => {
            const moduleSpecifier = importDecl.getModuleSpecifierValue();
            const namedImports = importDecl.getNamedImports().map(ni => ni.getName());
            const defaultImport = importDecl.getDefaultImport()?.getText() || '';
            
            return `${moduleSpecifier}: ${[defaultImport, ...namedImports].filter(Boolean).join(', ')}`;
        });
    }

    /**
     * Obtém dependências internas (não bibliotecas externas)
     */
    private getInternalDependencies(filePath: string): string[] {
        const dependencies = this.dependencyGraph.get(filePath) || new Set();
        return Array.from(dependencies).map(dep => path.basename(dep));
    }

    /**
     * Calcula nível de risco do acoplamento
     */
    private calculateCouplingRisk(
        efferent: number,
        afferent: number, 
        instability: number,
        distance: number
    ): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
        let riskScore = 0;
        
        // === ACOPLAMENTO EFERENTE (Ce) ===
        if (efferent > 15) riskScore += 3;       // Muito dependente
        else if (efferent > 10) riskScore += 2;  // Muito acoplado
        else if (efferent > 5) riskScore += 1;   // Moderadamente acoplado
        
        // === INSTABILIDADE ===
        if (instability > 0.8) riskScore += 2;   // Muito instável
        else if (instability > 0.6) riskScore += 1; // Instável
        
        // === DISTÂNCIA DA LINHA PRINCIPAL ===
        if (distance > 0.7) riskScore += 3;      // Muito longe da linha ideal
        else if (distance > 0.5) riskScore += 2; // Longe da linha ideal
        else if (distance > 0.3) riskScore += 1; // Moderadamente longe
        
        // === COMBINAÇÃO PERIGOSA ===
        // Alto acoplamento eferente + alta instabilidade = muito perigoso
        if (efferent > 10 && instability > 0.7) riskScore += 2;
        
        // === CLASSIFICAÇÃO FINAL ===
        if (riskScore >= 8) return 'VERY_HIGH';
        if (riskScore >= 5) return 'HIGH'; 
        if (riskScore >= 3) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * MÉTRICAS ESPECÍFICAS DE ACOPLAMENTO
     */

    /**
     * Calcula Data Abstraction Coupling (DAC)
     * Número de tipos de dados abstratos definidos em uma classe
     */
    private calculateDataAbstractionCoupling(classDecl: ClassDeclaration): number {
        let dacCount = 0;
        
        // Contar propriedades que são tipos abstratos (não primitivos)
        classDecl.getProperties().forEach(prop => {
            const typeNode = prop.getTypeNode();
            if (typeNode) {
            const typeText = typeNode.getText();
            // Se não é tipo primitivo, é abstração de dados
            if (!this.isPrimitiveType(typeText) && 
                !typeText.includes('[]') && // Não é array
                !typeText.includes('Promise')) { // Não é Promise
                dacCount++;
            }
            }
        });
        
        return dacCount;
    }

    /**
     * Calcula Message Passing Coupling (MPC)  
     * Número de chamadas para outros objetos
     */
    private calculateMessagePassingCoupling(classDecl: ClassDeclaration): number {
        let mpcCount = 0;
        
        // Analisar métodos da classe
        classDecl.getMethods().forEach(method => {
            // Contar chamadas de método (expressões de acesso a propriedades com chamada)
            method.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(callExpr => {
            const expression = callExpr.getExpression();
            
            // Se é uma chamada em outro objeto (objeto.metodo())
            if (Node.isPropertyAccessExpression(expression)) {
                mpcCount++;
            }
            });
        });
        
        return mpcCount;
    }

    /**
     * ANÁLISE DE ACOPLAMENTO ENTRE CAMADAS
     * Verifica se as dependências respeitam a arquitetura
     */
    private analyzeLayerCoupling(): { violations: string[], metrics: any } {
        const violations: string[] = [];
        const layerMetrics = new Map<string, { inbound: number, outbound: number }>();
        
        // Inicializar métricas das camadas
        const layers = ['entities', 'domain', 'application', 'infrastructure', 'presentation', 'shared'];
        layers.forEach(layer => {
            layerMetrics.set(layer, { inbound: 0, outbound: 0 });
        });
        
        // Analisar dependências entre camadas
        for (const [filePath, dependencies] of this.dependencyGraph) {
            const sourceLayer = this.identifyLayer(filePath);
            
            dependencies.forEach(depPath => {
            const targetLayer = this.identifyLayer(depPath);
            
            if (sourceLayer !== targetLayer) {
                // Incrementar métricas
                const sourceMetrics = layerMetrics.get(sourceLayer);
                const targetMetrics = layerMetrics.get(targetLayer);
                
                if (sourceMetrics) sourceMetrics.outbound++;
                if (targetMetrics) targetMetrics.inbound++;
                
                // Verificar violações da Clean Architecture
                const violation = this.checkArchitecturalViolation(sourceLayer, targetLayer, filePath, depPath);
                if (violation) {
                violations.push(violation);
                }
            }
            });
        }
        
        return {
            violations,
            metrics: Object.fromEntries(layerMetrics)
        };
    }

    /**
     * Verifica violações específicas da Clean Architecture
     */
    private checkArchitecturalViolation(
        sourceLayer: string, 
        targetLayer: string, 
        sourcePath: string, 
        targetPath: string
    ): string | null {
        const sourceFile = path.basename(sourcePath);
        const targetFile = path.basename(targetPath);
        
        // Regras da Clean Architecture
        switch (sourceLayer) {
            case 'entities':
            // Entidades não devem depender de nenhuma outra camada
            if (targetLayer !== 'entities') {
                return `VIOLAÇÃO CRÍTICA: Entidade ${sourceFile} depende de ${targetLayer} (${targetFile})`;
            }
            break;
            
            case 'domain':
            // Domínio só pode depender de entidades
            if (targetLayer !== 'entities' && targetLayer !== 'domain') {
                return `VIOLAÇÃO: Domínio ${sourceFile} depende de ${targetLayer} (${targetFile})`;
            }
            break;
            
            case 'application':
            // Aplicação pode depender de domínio e entidades
            if (!['entities', 'domain', 'application'].includes(targetLayer)) {
                return `VIOLAÇÃO: Aplicação ${sourceFile} depende de ${targetLayer} (${targetFile})`;
            }
            break;
            
            case 'presentation':
            // Apresentação não deve depender diretamente de infraestrutura
            if (targetLayer === 'infrastructure') {
                return `VIOLAÇÃO: Apresentação ${sourceFile} depende diretamente de Infraestrutura (${targetFile})`;
            }
            break;
        }
        
        return null;
    }

    // =============================================
    // BLOCO 8: ANÁLISE DE COESÃO
    // =============================================
    // Mede quão bem os elementos de uma classe trabalham juntos

    /**
     * Análise principal de coesão de um arquivo
     * Calcula diferentes métricas LCOM (Lack of Cohesion in Methods)
     */
    private async analyzeCohesion(sourceFile: SourceFile, filePath: string, fileName: string, layer: string): Promise<void> {
        // Analisar apenas classes (coesão se aplica a classes)
        sourceFile.getClasses().forEach(classDecl => {
            const className = classDecl.getName();
            if (!className) return;
            
            const metrics = this.calculateCohesionMetrics(classDecl, filePath, fileName, layer, className);
            this.cohesionMetrics.push(metrics);
        });
    }

    /**
    * Calcula todas as métricas de coesão para uma classe
    */
    private calculateCohesionMetrics(
        classDecl: ClassDeclaration,
        filePath: string,
        fileName: string,
        layer: string,
        className: string
    ): CohesionMetric {
        const methods = classDecl.getMethods();
        const properties = classDecl.getProperties();
        const fields = this.getClassFields(classDecl);
        
        // Mapear quais campos cada método utiliza
        const methodFieldUsage = this.mapMethodFieldUsage(methods, fields);
        
        // === CALCULAR DIFERENTES LCOM ===
        const lcom1 = this.calculateLCOM1(methodFieldUsage, methods.length, fields.size);
        const lcom2 = this.calculateLCOM2(methodFieldUsage, methods.length, fields.size);
        const lcom3 = this.calculateLCOM3(methodFieldUsage, methods.length);
        const lcom4 = this.calculateLCOM4(methodFieldUsage);
        
        // === MÉTRICAS DE COESÃO ESPECÍFICAS ===
        const tcc = this.calculateTCC(methodFieldUsage, methods);
        const lcc = this.calculateLCC(methodFieldUsage, methods);
        
        // === MÉTRICAS AUXILIARES ===
        const sharedFields = this.calculateSharedFields(methodFieldUsage);
        const cohesionScore = this.calculateOverallCohesionScore(lcom1, lcom2, tcc, lcc);
        
        return {
            fileName,
            filePath,
            layer,
            className,
            lcom1,
            lcom2,
            lcom3,
            lcom4,
            methodCount: methods.length,
            fieldCount: fields.size,
            cohesionScore,
            tightClassCohesion: tcc,
            looseClassCohesion: lcc,
            sharedFields,
            risk: this.calculateCohesionRisk(lcom1, lcom2, cohesionScore, methods.length)
        };
    }

    /**
     * Obtém todos os campos/propriedades de uma classe
     */
    private getClassFields(classDecl: ClassDeclaration): Set<string> {
        const fields = new Set<string>();
        
        // === PROPRIEDADES DECLARADAS ===
        classDecl.getProperties().forEach(prop => {
            const propName = prop.getName();
            if (propName) fields.add(propName);
        });
        
        // === PARÂMETROS DO CONSTRUTOR (com modificadores) ===
        classDecl.getConstructors().forEach(constructor => {
            constructor.getParameters().forEach(param => {
            // Parâmetros com modificadores se tornam propriedades automaticamente
            if (param.hasModifier(SyntaxKind.PublicKeyword) ||
                param.hasModifier(SyntaxKind.PrivateKeyword) ||
                param.hasModifier(SyntaxKind.ProtectedKeyword)) {
                const paramName = param.getName();
                if (paramName) fields.add(paramName);
            }
            });
        });
        
        return fields;
    }

    /**
     * Mapeia quais campos cada método utiliza
     */
    private mapMethodFieldUsage(methods: MethodDeclaration[], fields: Set<string>): Map<string, Set<string>> {
        const usage = new Map<string, Set<string>>();
        
        methods.forEach(method => {
            const methodName = method.getName();
            const usedFields = new Set<string>();
            
            // Analisar o corpo do método em busca de referências a campos
            method.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression).forEach(propAccess => {
            const expression = propAccess.getExpression();
            
            // Verificar se é acesso a propriedade da própria classe (this.propriedade)
            if (Node.isThisExpression(expression)) {
                const propertyName = propAccess.getName();
                if (fields.has(propertyName)) {
                usedFields.add(propertyName);
                }
            }
            });
            
            // Também verificar identificadores simples que podem ser campos
            method.getDescendantsOfKind(SyntaxKind.Identifier).forEach(identifier => {
            const identifierName = identifier.getText();
            if (fields.has(identifierName)) {
                // Verificar se não é uma declaração de parâmetro ou variável local
                const parent = identifier.getParent();
                if (!Node.isParametered(parent) && !Node.isVariableDeclaration(parent)) {
                usedFields.add(identifierName);
                }
            }
            });
            
            usage.set(methodName, usedFields);
        });
        
        return usage;
    }

    /**
     * LCOM1 - Lack of Cohesion in Methods versão 1
     * Fórmula: P - Q (onde P = pares que não compartilham campos, Q = pares que compartilham)
     * Resultado: Menor = melhor coesão
     */
    private calculateLCOM1(
        methodFieldUsage: Map<string, Set<string>>,
        methodCount: number,
        fieldCount: number
    ): number {
        if (methodCount < 2) return 0;
        
        const methods = Array.from(methodFieldUsage.keys());
        let P = 0; // Pares que NÃO compartilham campos
        let Q = 0; // Pares que compartilham campos
        
        // Comparar todos os pares de métodos
        for (let i = 0; i < methods.length; i++) {
            for (let j = i + 1; j < methods.length; j++) {
            const method1Fields = methodFieldUsage.get(methods[i]) || new Set();
            const method2Fields = methodFieldUsage.get(methods[j]) || new Set();
            
            // Verificar se compartilham algum campo
            const hasSharedFields = Array.from(method1Fields).some(field => 
                method2Fields.has(field)
            );
            
            if (hasSharedFields) {
                Q++;
            } else {
                P++;
            }
            }
        }
        
        return Math.max(0, P - Q);
    }

    /**
     * LCOM2 - Versão melhorada do LCOM1
     * Fórmula: (P - Q) / (P + Q) se P > Q, senão 0
     * Normaliza o resultado entre 0 e 1
     */
    private calculateLCOM2(
        methodFieldUsage: Map<string, Set<string>>,
        methodCount: number,
        fieldCount: number
    ): number {
        if (methodCount < 2) return 0;
        
        const methods = Array.from(methodFieldUsage.keys());
        let P = 0;
        let Q = 0;
        
        for (let i = 0; i < methods.length; i++) {
            for (let j = i + 1; j < methods.length; j++) {
            const method1Fields = methodFieldUsage.get(methods[i]) || new Set();
            const method2Fields = methodFieldUsage.get(methods[j]) || new Set();
            
            const hasSharedFields = Array.from(method1Fields).some(field => 
                method2Fields.has(field)
            );
            
            if (hasSharedFields) {
                Q++;
            } else {
                P++;
            }
            }
        }
        
        const total = P + Q;
        return total > 0 && P > Q ? (P - Q) / total : 0;
    }

    /**
     * LCOM3 - Baseado em conectividade de métodos
     * Calcula componentes conectados no grafo método-campo
     */
    private calculateLCOM3(
        methodFieldUsage: Map<string, Set<string>>,
        methodCount: number
    ): number {
        if (methodCount <= 1) return 0;
        
        const methods = Array.from(methodFieldUsage.keys());
        const visited = new Set<string>();
        let components = 0;
        
        // DFS para encontrar componentes conectados
        const dfs = (methodName: string) => {
            if (visited.has(methodName)) return;
            visited.add(methodName);
            
            const currentFields = methodFieldUsage.get(methodName) || new Set();
            
            // Visitar métodos conectados (que compartilham campos)
            methods.forEach(otherMethod => {
            if (!visited.has(otherMethod)) {
                const otherFields = methodFieldUsage.get(otherMethod) || new Set();
                
                // Se compartilham pelo menos um campo, estão conectados
                const hasSharedFields = Array.from(currentFields).some(field => 
                otherFields.has(field)
                );
                
                if (hasSharedFields) {
                dfs(otherMethod);
                }
            }
            });
        };
        
        // Contar componentes conectados
        methods.forEach(method => {
            if (!visited.has(method)) {
            dfs(method);
            components++;
            }
        });
        
        return components;
    }

    /**
     * LCOM4 - Componentes conectados considerando chamadas entre métodos
     */
    private calculateLCOM4(methodFieldUsage: Map<string, Set<string>>): number {
    const methods = Array.from(methodFieldUsage.keys());
    if (methods.length <= 1) return 0;
    
    // Para LCOM4, consideramos tanto campos compartilhados quanto chamadas entre métodos
    // Por simplicidade, usamos apenas campos compartilhados aqui
    return this.calculateLCOM3(methodFieldUsage, methods.length);
    }

    /**
     * TCC - Tight Class Cohesion
     * Percentual de pares de métodos que estão diretamente conectados
     */
    private calculateTCC(
        methodFieldUsage: Map<string, Set<string>>,
        methods: MethodDeclaration[]
    ): number {
        if (methods.length < 2) return 1;
        
        const methodNames = methods.map(m => m.getName());
        let connectedPairs = 0;
        let totalPairs = 0;
        
        for (let i = 0; i < methodNames.length; i++) {
            for (let j = i + 1; j < methodNames.length; j++) {
            totalPairs++;
            
            const method1Fields = methodFieldUsage.get(methodNames[i]) || new Set();
            const method2Fields = methodFieldUsage.get(methodNames[j]) || new Set();
            
            // Verificar se compartilham campos
            const hasSharedFields = Array.from(method1Fields).some(field => 
                method2Fields.has(field)
            );
            
            if (hasSharedFields) {
                connectedPairs++;
            }
            }
        }
        
        return totalPairs > 0 ? connectedPairs / totalPairs : 0;
    }

    /**
     * LCC - Loose Class Cohesion  
     * Percentual de pares de métodos conectados direta ou indiretamente
     */
    private calculateLCC(
        methodFieldUsage: Map<string, Set<string>>,
        methods: MethodDeclaration[]
    ): number {
        if (methods.length < 2) return 1;
        
        const methodNames = methods.map(m => m.getName());
        const totalPairs = (methodNames.length * (methodNames.length - 1)) / 2;
        
        // Criar grafo de conectividade
        const connected = new Map<string, Set<string>>();
        
        methodNames.forEach(method => {
            connected.set(method, new Set());
        });
        
        // Adicionar conexões diretas
        for (let i = 0; i < methodNames.length; i++) {
            for (let j = i + 1; j < methodNames.length; j++) {
            const method1 = methodNames[i];
            const method2 = methodNames[j];
            
            const method1Fields = methodFieldUsage.get(method1) || new Set();
            const method2Fields = methodFieldUsage.get(method2) || new Set();
            
            const hasSharedFields = Array.from(method1Fields).some(field => 
                method2Fields.has(field)
            );
            
            if (hasSharedFields) {
                connected.get(method1)!.add(method2);
                connected.get(method2)!.add(method1);
            }
            }
        }
        
        // Contar pares conectados (direta ou indiretamente) usando Floyd-Warshall
        const reachable = new Map<string, Set<string>>();
        
        methodNames.forEach(method => {
            const connectedSet = connected.get(method) as Set<string> || new Set<string>();
            reachable.set(method, new Set([method, ...Array.from(connectedSet)]));
        });
        
        // Floyd-Warshall para encontrar conectividade transitiva
        methodNames.forEach(k => {
            methodNames.forEach(i => {
            methodNames.forEach(j => {
                if (reachable.get(i)!.has(k) && reachable.get(k)!.has(j)) {
                reachable.get(i)!.add(j);
                }
            });
            });
        });
        
        let connectedPairs = 0;
        for (let i = 0; i < methodNames.length; i++) {
            for (let j = i + 1; j < methodNames.length; j++) {
            if (reachable.get(methodNames[i])!.has(methodNames[j])) {
                connectedPairs++;
            }
            }
        }
        
        return totalPairs > 0 ? connectedPairs / totalPairs : 0;
    }

    /**
     * Calcula número de campos compartilhados entre métodos
     */
    private calculateSharedFields(methodFieldUsage: Map<string, Set<string>>): number {
        const allFields = new Set<string>();
        const fieldMethodCount = new Map<string, number>();
        
        // Contar quantos métodos usam cada campo
        methodFieldUsage.forEach((fields, method) => {
            fields.forEach(field => {
            allFields.add(field);
            fieldMethodCount.set(field, (fieldMethodCount.get(field) || 0) + 1);
            });
        });
        
        // Contar campos usados por mais de um método
        let sharedFields = 0;
        fieldMethodCount.forEach((count, field) => {
            if (count > 1) {
            sharedFields++;
            }
        });
        
        return sharedFields;
    }

    /**
     * Calcula score geral de coesão combinando diferentes métricas
     */
    private calculateOverallCohesionScore(
        lcom1: number,
        lcom2: number,
        tcc: number,
        lcc: number
    ): number {
    // Normalizar LCOM (menor é melhor) para escala 0-1 (maior é melhor)
    const normalizedLCOM1 = lcom1 > 0 ? 1 / (1 + lcom1) : 1;
    const normalizedLCOM2 = 1 - lcom2;
    
    // TCC e LCC já estão em escala 0-1 (maior é melhor)
    const scores = [normalizedLCOM1, normalizedLCOM2, tcc, lcc];
    
    // Média ponderada (TCC e LCC têm peso maior por serem mais precisas)
    const weights = [0.2, 0.2, 0.3, 0.3];
    
    return scores.reduce((sum, score, index) => sum + (score * weights[index]), 0);
    }

    /**
    * Calcula nível de risco da coesão
    */
    private calculateCohesionRisk(
        lcom1: number,
        lcom2: number,
        cohesionScore: number,
        methodCount: number
    ): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
        let riskScore = 0;
        
        // === LCOM1 ===
        if (lcom1 > methodCount) riskScore += 3;      // Muito alta falta de coesão
        else if (lcom1 > methodCount / 2) riskScore += 2;  // Alta falta de coesão
        else if (lcom1 > 0) riskScore += 1;           // Alguma falta de coesão
        
        // === LCOM2 ===
        if (lcom2 > 0.8) riskScore += 2;              // Muito baixa coesão
        else if (lcom2 > 0.5) riskScore += 1;         // Baixa coesão
        
        // === SCORE GERAL ===
        if (cohesionScore < 0.3) riskScore += 3;      // Coesão muito baixa
        else if (cohesionScore < 0.5) riskScore += 2; // Coesão baixa
        else if (cohesionScore < 0.7) riskScore += 1; // Coesão moderada
        
        // === NÚMERO DE MÉTODOS ===
        // Muitos métodos com baixa coesão é mais perigoso
        if (methodCount > 20 && cohesionScore < 0.5) riskScore += 2;
        
        // === CLASSIFICAÇÃO FINAL ===
        if (riskScore >= 7) return 'VERY_HIGH';
        if (riskScore >= 5) return 'HIGH';
        if (riskScore >= 3) return 'MEDIUM';
        return 'LOW';
    }

    // =============================================
    // BLOCO 9: GERAÇÃO DE RELATÓRIOS E EXIBIÇÃO
    // =============================================
    // Consolida todas as métricas e gera relatórios detalhados

    /**
     * Gera o relatório final consolidando todas as métricas
     */
    private generateReport(): ArchitectureReport {
        console.log('📋 Gerando relatório final...');
        
        const summary = this.generateSummary();
        const layers = this.generateLayerAnalysis();
        const recommendations = this.generateRecommendations();
        
        return {
            timestamp: new Date().toISOString(),
            summary,
            layers,
            complexityMetrics: this.complexityMetrics,
            couplingMetrics: this.couplingMetrics,
            cohesionMetrics: this.cohesionMetrics,
            recommendations
        };
    }

    /**
     * Gera resumo executivo das métricas
     */
    private generateSummary(): ArchitectureReport['summary'] {
        const totalFiles = new Set([
            ...this.complexityMetrics.map(m => m.filePath),
            ...this.couplingMetrics.map(m => m.filePath),
            ...this.cohesionMetrics.map(m => m.filePath)
        ]).size;
        
        const totalClasses = new Set([
            ...this.couplingMetrics.map(m => `${m.filePath}#${m.className}`),
            ...this.cohesionMetrics.map(m => `${m.filePath}#${m.className}`)
        ]).size;
        
        const totalMethods = this.complexityMetrics.length;
        
        const totalLoc = this.complexityMetrics.reduce((sum, m) => sum + m.linesOfCode, 0);
        
        const avgComplexity = totalMethods > 0 
            ? this.complexityMetrics.reduce((sum, m) => sum + m.cyclomaticComplexity, 0) / totalMethods 
            : 0;
        
        const avgCoupling = this.couplingMetrics.length > 0
            ? this.couplingMetrics.reduce((sum, m) => sum + m.efferentCoupling, 0) / this.couplingMetrics.length
            : 0;
        
        const avgCohesion = this.cohesionMetrics.length > 0
            ? this.cohesionMetrics.reduce((sum, m) => sum + m.cohesionScore, 0) / this.cohesionMetrics.length
            : 0;
        
        // Contar violações arquiteturais
        const violations = this.countViolations();
        
        // Calcular débito técnico estimado
        const technicalDebt = this.calculateTechnicalDebt();
        
        return {
            totalFiles,
            totalClasses,
            totalMethods,
            totalLoc,
            avgComplexity: Number(avgComplexity.toFixed(2)),
            avgCoupling: Number(avgCoupling.toFixed(2)),
            avgCohesion: Number(avgCohesion.toFixed(2)),
            violations,
            technicalDebt: Number(technicalDebt.toFixed(2))
        };
    }

    /**
     * Conta violações de diferentes tipos
     */
    private countViolations(): number {
        let violations = 0;
        
        // Violações de complexidade
        violations += this.complexityMetrics.filter(m => 
            m.risk === 'HIGH' || m.risk === 'VERY_HIGH'
        ).length;
        
        // Violações de acoplamento
        violations += this.couplingMetrics.filter(m => 
            m.risk === 'HIGH' || m.risk === 'VERY_HIGH'
        ).length;
        
        // Violações de coesão
        violations += this.cohesionMetrics.filter(m => 
            m.risk === 'HIGH' || m.risk === 'VERY_HIGH'
        ).length;
        
        // Violações arquiteturais
        const layerViolations = this.analyzeLayerCoupling();
        violations += layerViolations.violations.length;
        
        return violations;
    }

    /**
     * Calcula o débito técnico estimado em horas
     */
    private calculateTechnicalDebt(): number {
        let debtHours = 0;
        
        // === DÉBITO POR COMPLEXIDADE ===
        this.complexityMetrics.forEach(metric => {
            const complexity = metric.cyclomaticComplexity;
            const cognitiveComplexity = metric.cognitiveComplexity;
            
            // Fórmula baseada em estudos empíricos
            // Complexidade > 10 = 1 hora por ponto acima de 10
            if (complexity > 10) {
                debtHours += (complexity - 10) * 0.5;
            }
            
            // Complexidade cognitiva alta adiciona mais débito
            if (cognitiveComplexity > 15) {
                debtHours += (cognitiveComplexity - 15) * 0.3;
            }
            
            // Baixa manutenibilidade aumenta significativamente o débito
            if (metric.maintainabilityIndex < 40) {
                debtHours += (40 - metric.maintainabilityIndex) * 0.1;
            }
        });
        
        // === DÉBITO POR ACOPLAMENTO ===
        this.couplingMetrics.forEach(metric => {
            // Alto acoplamento eferente
            if (metric.efferentCoupling > 10) {
                debtHours += (metric.efferentCoupling - 10) * 0.2;
            }
            
            // Alta instabilidade
            if (metric.instability > 0.7) {
                debtHours += metric.instability * 2;
            }
            
            // Distância da linha principal
            if (metric.distance > 0.5) {
                debtHours += metric.distance * 3;
            }
        });
        
        // === DÉBITO POR COESÃO ===
        this.cohesionMetrics.forEach(metric => {
            // Baixa coesão
            if (metric.cohesionScore < 0.5) {
                debtHours += (0.5 - metric.cohesionScore) * 4;
            }
            
            // LCOM alto
            if (metric.lcom1 > metric.methodCount) {
                debtHours += (metric.lcom1 - metric.methodCount) * 0.1;
            }
        });
        
        return debtHours;
    }

    /**
     * Gera análise por camada arquitetural
     */
    private generateLayerAnalysis(): { [key: string]: LayerAnalysis } {
        const layers: { [key: string]: LayerAnalysis } = {};
        
        // Inicializar estrutura das camadas
        const layerNames = ['entities', 'domain', 'application', 'infrastructure', 'presentation', 'shared', 'other'];
        
        layerNames.forEach(layerName => {
            layers[layerName] = {
                name: layerName,
                files: 0,
                classes: 0,
                interfaces: 0,
                avgComplexity: 0,
                maxComplexity: 0,
                avgCoupling: 0,
                avgCohesion: 0,
                violations: 0,
                totalLoc: 0,
                dependencies: [],
                stability: 0
            };
        });
        
        // === ANÁLISE DE COMPLEXIDADE POR CAMADA ===
        const complexityByLayer = new Map<string, number[]>();
        const locByLayer = new Map<string, number>();
        
        this.complexityMetrics.forEach(metric => {
            const layer = metric.layer;
            
            if (!complexityByLayer.has(layer)) {
                complexityByLayer.set(layer, []);
            }
            
            complexityByLayer.get(layer)!.push(metric.cyclomaticComplexity);
            locByLayer.set(layer, (locByLayer.get(layer) || 0) + metric.linesOfCode);
            
            layers[layer].files++;
            layers[layer].totalLoc = locByLayer.get(layer) || 0;
            
            // Contar violações de complexidade
            if (metric.risk === 'HIGH' || metric.risk === 'VERY_HIGH') {
                layers[layer].violations++;
            }
        });
        
        // Calcular médias de complexidade
        complexityByLayer.forEach((complexities, layer) => {
            if (complexities.length > 0) {
                layers[layer].avgComplexity = Number((complexities.reduce((a, b) => a + b, 0) / complexities.length).toFixed(2));
                layers[layer].maxComplexity = Math.max(...complexities);
            }
        });
        
        // === ANÁLISE DE ACOPLAMENTO POR CAMADA ===
        const couplingByLayer = new Map<string, number[]>();
        
        this.couplingMetrics.forEach(metric => {
            const layer = metric.layer;
            
            if (!couplingByLayer.has(layer)) {
                couplingByLayer.set(layer, []);
            }
            
            couplingByLayer.get(layer)!.push(metric.efferentCoupling);
            layers[layer].classes++;
            
            // Contar violações de acoplamento
            if (metric.risk === 'HIGH' || metric.risk === 'VERY_HIGH') {
                layers[layer].violations++;
            }
            
            // Coletar dependências únicas
            metric.dependencies.forEach(dep => {
                if (!layers[layer].dependencies.includes(dep)) {
                    layers[layer].dependencies.push(dep);
                }
            });
        });
        
        // Calcular médias de acoplamento
        couplingByLayer.forEach((couplings, layer) => {
            if (couplings.length > 0) {
                layers[layer].avgCoupling = Number((couplings.reduce((a, b) => a + b, 0) / couplings.length).toFixed(2));
            }
        });
        
        // === ANÁLISE DE COESÃO POR CAMADA ===
        const cohesionByLayer = new Map<string, number[]>();
        
        this.cohesionMetrics.forEach(metric => {
            const layer = metric.layer;
            
            if (!cohesionByLayer.has(layer)) {
                cohesionByLayer.set(layer, []);
            }
            
            cohesionByLayer.get(layer)!.push(metric.cohesionScore);
            
            // Contar violações de coesão
            if (metric.risk === 'HIGH' || metric.risk === 'VERY_HIGH') {
                layers[layer].violations++;
            }
        });
        
        // Calcular médias de coesão
        cohesionByLayer.forEach((cohesions, layer) => {
            if (cohesions.length > 0) {
                layers[layer].avgCohesion = Number((cohesions.reduce((a, b) => a + b, 0) / cohesions.length).toFixed(2));
            }
        });
        
        // === CALCULAR ESTABILIDADE DA CAMADA ===
        Object.keys(layers).forEach(layerName => {
            layers[layerName].stability = this.calculateLayerStability(layerName);
        });
        
        // Contar interfaces
        this.project.getSourceFiles().forEach(sourceFile => {
            const layer = this.identifyLayer(sourceFile.getFilePath());
            const interfaces = sourceFile.getInterfaces().length;
            layers[layer].interfaces += interfaces;
        });
        
        return layers;
    }

    /**
     * Calcula estabilidade de uma camada
     */
    private calculateLayerStability(layerName: string): number {
        const layerFiles = this.getFilesByLayer(layerName);
        let totalAfferent = 0;
        let totalEfferent = 0;
        
        layerFiles.forEach(filePath => {
            // Acoplamento aferente (quantos dependem desta camada)
            const dependents = this.reverseDependencyGraph.get(filePath) || new Set();
            const externalDependents = Array.from(dependents).filter(dep => 
                this.identifyLayer(dep) !== layerName
            );
            totalAfferent += externalDependents.length;
            
            // Acoplamento eferente (de quantos esta camada depende)
            const dependencies = this.dependencyGraph.get(filePath) || new Set();
            const externalDependencies = Array.from(dependencies).filter(dep => 
                this.identifyLayer(dep) !== layerName
            );
            totalEfferent += externalDependencies.length;
        });
        
        const totalCoupling = totalAfferent + totalEfferent;
        return totalCoupling > 0 ? totalEfferent / totalCoupling : 0;
    }

    /**
     * Obtém arquivos de uma camada específica
     */
    private getFilesByLayer(layerName: string): string[] {
        return this.project.getSourceFiles()
            .map(sf => sf.getFilePath())
            .filter(filePath => this.identifyLayer(filePath) === layerName);
    }

    /**
     * Gera recomendações baseadas nas métricas coletadas
     */
    private generateRecommendations(): string[] {
        const recommendations: string[] = [];
        
        // === RECOMENDAÇÕES DE COMPLEXIDADE ===
        const highComplexityMethods = this.complexityMetrics.filter(m => 
            m.cyclomaticComplexity > 15 || m.cognitiveComplexity > 20
        );
        
        if (highComplexityMethods.length > 0) {
            recommendations.push(
                `🔴 COMPLEXIDADE CRÍTICA: ${highComplexityMethods.length} método(s) com alta complexidade. ` +
                `Considere refatorar: ${highComplexityMethods.slice(0, 3).map(m => 
                    `${m.className ? m.className + '.' : ''}${m.methodName}`).join(', ')}`
            );
        }
        
        // Verificar métodos com muitos parâmetros
        const highParameterMethods = this.complexityMetrics.filter(m => m.parameters > 5);
        if (highParameterMethods.length > 0) {
            recommendations.push(
                `🟡 PARÂMETROS EXCESSIVOS: ${highParameterMethods.length} método(s) com mais de 5 parâmetros. ` +
                `Considere usar objetos de configuração ou Builder Pattern.`
            );
        }
        
        // Verificar baixa manutenibilidade
        const lowMaintainabilityMethods = this.complexityMetrics.filter(m => m.maintainabilityIndex < 20);
        if (lowMaintainabilityMethods.length > 0) {
            recommendations.push(
                `🔴 MANUTENIBILIDADE CRÍTICA: ${lowMaintainabilityMethods.length} método(s) com baixíssima manutenibilidade. ` +
                `Refatoração urgente necessária.`
            );
        }
        
        // === RECOMENDAÇÕES DE ACOPLAMENTO ===
        const tightlyCoupledClasses = this.couplingMetrics.filter(m => 
            m.efferentCoupling > 15 || m.instability > 0.8
        );
        
        if (tightlyCoupledClasses.length > 0) {
            recommendations.push(
                `🔴 ACOPLAMENTO CRÍTICO: ${tightlyCoupledClasses.length} classe(s) muito acoplada(s). ` +
                `Aplique Dependency Injection e Interface Segregation Principle.`
            );
        }
        
        // Verificar distância da linha principal
        const badDesignClasses = this.couplingMetrics.filter(m => m.distance > 0.7);
        if (badDesignClasses.length > 0) {
            recommendations.push(
                `🟡 DESIGN QUESTIONÁVEL: ${badDesignClasses.length} classe(s) distante(s) da linha principal. ` +
                `Reavalie a responsabilidade e abstração dessas classes.`
            );
        }
        
        // === RECOMENDAÇÕES DE COESÃO ===
        const lowCohesionClasses = this.cohesionMetrics.filter(m => 
            m.cohesionScore < 0.4 || m.lcom1 > m.methodCount
        );
        
        if (lowCohesionClasses.length > 0) {
            recommendations.push(
                `🔴 COESÃO CRÍTICA: ${lowCohesionClasses.length} classe(s) com baixa coesão. ` +
                `Considere aplicar Single Responsibility Principle e dividir as classes.`
            );
        }
        
        // Verificar classes com muitos métodos
        const godClasses = this.cohesionMetrics.filter(m => m.methodCount > 20);
        if (godClasses.length > 0) {
            recommendations.push(
                `🟡 GOD CLASSES: ${godClasses.length} classe(s) com mais de 20 métodos. ` +
                `Considere decompor em classes menores e mais específicas.`
            );
        }
        
        // === RECOMENDAÇÕES ARQUITETURAIS ===
        const layerViolations = this.analyzeLayerCoupling();
        if (layerViolations.violations.length > 0) {
            recommendations.push(
                `🔴 VIOLAÇÕES ARQUITETURAIS: ${layerViolations.violations.length} violação(ões) da Clean Architecture detectada(s). ` +
                `Revise as dependências entre camadas.`
            );
        }
        
        // Verificar camadas instáveis
        const layers = this.generateLayerAnalysis();
        const unstableLayers = Object.values(layers).filter(layer => 
            layer.stability > 0.8 && layer.files > 0
        );
        
        if (unstableLayers.length > 0) {
            recommendations.push(
                `🟡 CAMADAS INSTÁVEIS: ${unstableLayers.map(l => l.name).join(', ')} apresentam alta instabilidade. ` +
                `Considere estabilizar através de abstrações.`
            );
        }
        
        // === RECOMENDAÇÕES DE DÉBITO TÉCNICO ===
        const technicalDebt = this.calculateTechnicalDebt();
        if (technicalDebt > 40) {
            recommendations.push(
                `🔴 DÉBITO TÉCNICO ALTO: Estimadas ${technicalDebt.toFixed(1)} horas de refatoração necessárias. ` +
                `Priorize a resolução dos problemas de maior impacto.`
            );
        } else if (technicalDebt > 20) {
            recommendations.push(
                `🟡 DÉBITO TÉCNICO MODERADO: Estimadas ${technicalDebt.toFixed(1)} horas de refatoração. ` +
                `Planeje ciclos de refatoração regulares.`
            );
        }
        
        // === RECOMENDAÇÕES GERAIS ===
        if (recommendations.length === 0) {
            recommendations.push(
                `✅ ARQUITETURA SAUDÁVEL: Poucas violações detectadas. ` +
                `Mantenha as boas práticas e monitore regularmente.`
            );
        }
        
        // Adicionar recomendações de melhores práticas
        recommendations.push(
            `💡 PRÁTICAS RECOMENDADAS: Implemente testes unitários, ` +
            `use static analysis tools, e faça revisões de código regulares.`
        );
        
        return recommendations;
    }

    /**
     * Exibe resumo das análises no console
     */
    private displaySummary(report: ArchitectureReport): void {
        console.log('\n' + '='.repeat(80));
        console.log('📊 RELATÓRIO DE ANÁLISE ARQUITETURAL');
        console.log('='.repeat(80));
        
        const summary = report.summary;
        
        console.log('\n📋 RESUMO EXECUTIVO:');
        console.log(`   📁 Arquivos analisados: ${summary.totalFiles}`);
        console.log(`   🏗️  Classes encontradas: ${summary.totalClasses}`);
        console.log(`   ⚙️  Métodos analisados: ${summary.totalMethods}`);
        console.log(`   📝 Linhas de código: ${summary.totalLoc.toLocaleString()}`);
        console.log(`   🔄 Complexidade média: ${summary.avgComplexity}`);
        console.log(`   🔗 Acoplamento médio: ${summary.avgCoupling}`);
        console.log(`   🤝 Coesão média: ${summary.avgCohesion}`);
        console.log(`   ⚠️  Violações detectadas: ${summary.violations}`);
        console.log(`   💰 Débito técnico: ${summary.technicalDebt}h`);
        
        // === ANÁLISE POR CAMADAS ===
        console.log('\n🏗️ ANÁLISE POR CAMADAS:');
        Object.values(report.layers)
            .filter(layer => layer.files > 0)
            .sort((a, b) => b.violations - a.violations)
            .forEach(layer => {
                const riskLevel = layer.violations > 10 ? '🔴' : 
                                layer.violations > 5 ? '🟡' : '🟢';
                console.log(`   ${riskLevel} ${layer.name.toUpperCase()}:`);
                console.log(`      📁 ${layer.files} arquivos | 🏗️ ${layer.classes} classes`);
                console.log(`      🔄 Complexidade: ${layer.avgComplexity} | 🔗 Acoplamento: ${layer.avgCoupling}`);
                console.log(`      🤝 Coesão: ${layer.avgCohesion} | ⚠️ Violações: ${layer.violations}`);
            });
        
        // === TOP PROBLEMAS ===
        console.log('\n🚨 TOP PROBLEMAS:');
        
        // Maior complexidade
        const mostComplexMethod = this.complexityMetrics
            .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)[0];
        if (mostComplexMethod) {
            console.log(`   🔴 Maior complexidade: ${mostComplexMethod.className ? mostComplexMethod.className + '.' : ''}${mostComplexMethod.methodName} (${mostComplexMethod.cyclomaticComplexity})`);
        }
        
        // Maior acoplamento
        const mostCoupledClass = this.couplingMetrics
            .sort((a, b) => b.efferentCoupling - a.efferentCoupling)[0];
        if (mostCoupledClass) {
            console.log(`   🔴 Maior acoplamento: ${mostCoupledClass.className} (${mostCoupledClass.efferentCoupling} dependências)`);
        }
        
        // Menor coesão
        const leastCohesiveClass = this.cohesionMetrics
            .sort((a, b) => a.cohesionScore - b.cohesionScore)[0];
        if (leastCohesiveClass) {
            console.log(`   🔴 Menor coesão: ${leastCohesiveClass.className} (${(leastCohesiveClass.cohesionScore * 100).toFixed(1)}%)`);
        }
        
        // === RECOMENDAÇÕES PRINCIPAIS ===
        console.log('\n💡 RECOMENDAÇÕES PRINCIPAIS:');
        report.recommendations.slice(0, 5).forEach((recommendation, index) => {
            console.log(`   ${index + 1}. ${recommendation}`);
        });
        
        console.log('\n' + '='.repeat(80));
        console.log(`✅ Análise concluída em ${new Date().toLocaleString()}`);
        console.log(`📄 Relatório detalhado disponível no objeto retornado`);
        console.log('='.repeat(80) + '\n');
    }

    /**
     * Exporta relatório para arquivo JSON
     */
    public async exportReport(report: ArchitectureReport, outputPath: string = './architecture-report.json'): Promise<void> {
        try {
            const reportJson = JSON.stringify(report, null, 2);
            await fs.writeFile(outputPath, reportJson, 'utf-8', (err) => {
                if (err) throw err
            });
            console.log(`📄 Relatório exportado para: ${outputPath}`);
        } catch (error) {
            console.error(`❌ Erro ao exportar relatório: ${error}`);
            throw error;
        }
    }

    /**
     * Gera relatório HTML
     */
    public generateHTMLReport(report: ArchitectureReport): string {
        const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Relatório de Análise Arquitetural</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
                    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { text-align: center; border-bottom: 3px solid #2196F3; padding-bottom: 20px; margin-bottom: 30px; }
                    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
                    .metric-card { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3; }
                    .metric-value { font-size: 24px; font-weight: bold; color: #2196F3; }
                    .metric-label { color: #666; font-size: 14px; }
                    .section { margin-bottom: 30px; }
                    .section h2 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                    .risk-high { border-left-color: #f44336; }
                    .risk-medium { border-left-color: #ff9800; }
                    .risk-low { border-left-color: #4caf50; }
                    .recommendations { background: #e3f2fd; padding: 20px; border-radius: 8px; }
                    .recommendations ul { margin: 0; padding-left: 20px; }
                    .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .table th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📊 Relatório de Análise Arquitetural</h1>
                        <p>Gerado em: ${new Date(report.timestamp).toLocaleString()}</p>
                    </div>
                    
                    <div class="section">
                        <h2>📋 Resumo Executivo</h2>
                        <div class="summary">
                            <div class="metric-card">
                                <div class="metric-value">${report.summary.totalFiles}</div>
                                <div class="metric-label">Arquivos Analisados</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-value">${report.summary.totalClasses}</div>
                                <div class="metric-label">Classes</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-value">${report.summary.totalMethods}</div>
                                <div class="metric-label">Métodos</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-value">${report.summary.totalLoc.toLocaleString()}</div>
                                <div class="metric-label">Linhas de Código</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-value">${report.summary.avgComplexity}</div>
                                <div class="metric-label">Complexidade Média</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-value">${report.summary.violations}</div>
                                <div class="metric-label">Violações</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h2>🏗️ Análise por Camadas</h2>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Camada</th>
                                    <th>Arquivos</th>
                                    <th>Classes</th>
                                    <th>Complexidade Média</th>
                                    <th>Acoplamento Médio</th>
                                    <th>Coesão Média</th>
                                    <th>Violações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.values(report.layers)
                                    .filter(layer => layer.files > 0)
                                    .map(layer => `
                                    <tr>
                                        <td><strong>${layer.name.toUpperCase()}</strong></td>
                                        <td>${layer.files}</td>
                                        <td>${layer.classes}</td>
                                        <td>${layer.avgComplexity}</td>
                                        <td>${layer.avgCoupling}</td>
                                        <td>${layer.avgCohesion}</td>
                                        <td>${layer.violations}</td>
                                    </tr>
                                    `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="section">
                        <h2>💡 Recomendações</h2>
                        <div class="recommendations">
                            <ul>
                                ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h2>🚨 Top Problemas Detectados</h2>
                        <h3>Alta Complexidade</h3>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Arquivo</th>
                                    <th>Classe</th>
                                    <th>Método</th>
                                    <th>Complexidade Ciclomática</th>
                                    <th>Complexidade Cognitiva</th>
                                    <th>Risco</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${report.complexityMetrics
                                    .filter(m => m.risk === 'HIGH' || m.risk === 'VERY_HIGH')
                                    .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)
                                    .slice(0, 10)
                                    .map(m => `
                                    <tr>
                                        <td>${m.fileName}</td>
                                        <td>${m.className || '-'}</td>
                                        <td>${m.methodName}</td>
                                        <td>${m.cyclomaticComplexity}</td>
                                        <td>${m.cognitiveComplexity}</td>
                                        <td class="risk-${m.risk.toLowerCase()}">${m.risk}</td>
                                    </tr>
                                    `).join('')}
                            </tbody>
                        </table>
                        
                        <h3>Alto Acoplamento</h3>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Arquivo</th>
                                    <th>Classe</th>
                                    <th>Acoplamento Eferente</th>
                                    <th>Instabilidade</th>
                                    <th>Distância</th>
                                    <th>Risco</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${report.couplingMetrics
                                    .filter(m => m.risk === 'HIGH' || m.risk === 'VERY_HIGH')
                                    .sort((a, b) => b.efferentCoupling - a.efferentCoupling)
                                    .slice(0, 10)
                                    .map(m => `
                                    <tr>
                                        <td>${m.fileName}</td>
                                        <td>${m.className}</td>
                                        <td>${m.efferentCoupling}</td>
                                        <td>${m.instability.toFixed(2)}</td>
                                        <td>${m.distance.toFixed(2)}</td>
                                        <td class="risk-${m.risk.toLowerCase()}">${m.risk}</td>
                                    </tr>
                                    `).join('')}
                            </tbody>
                        </table>
                        
                        <h3>Baixa Coesão</h3>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Arquivo</th>
                                    <th>Classe</th>
                                    <th>LCOM1</th>
                                    <th>Score de Coesão</th>
                                    <th>Métodos</th>
                                    <th>Risco</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${report.cohesionMetrics
                                    .filter(m => m.risk === 'HIGH' || m.risk === 'VERY_HIGH')
                                    .sort((a, b) => a.cohesionScore - b.cohesionScore)
                                    .slice(0, 10)
                                    .map(m => `
                                    <tr>
                                        <td>${m.fileName}</td>
                                        <td>${m.className}</td>
                                        <td>${m.lcom1}</td>
                                        <td>${(m.cohesionScore * 100).toFixed(1)}%</td>
                                        <td>${m.methodCount}</td>
                                        <td class="risk-${m.risk.toLowerCase()}">${m.risk}</td>
                                    </tr>
                                    `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </body>
            </html>
                `;
                
        return html;
    }

    /**
     * Salva relatório HTML
     */
    public async saveHTMLReport(report: ArchitectureReport, outputPath: string = './architecture-report.html'): Promise<void> {
        try {
            const html = this.generateHTMLReport(report);
            await fs.writeFile(outputPath, html, 'utf-8', (err) => {
                if (err) throw err
            });
            console.log(`📄 Relatório HTML salvo em: ${outputPath}`);
        } catch (error) {
            console.error(`❌ Erro ao salvar relatório HTML: ${error}`);
            throw error;
        }
    }

    /**
     * Função principal para análise completa com diferentes formatos de saída
     */
    public async runCompleteAnalysis(options: {
        exportJson?: boolean;
        exportHtml?: boolean;
        jsonPath?: string;
        htmlPath?: string;
    } = {}): Promise<ArchitectureReport> {
        
        const report = await this.analyzeAll();
        
        // Exportar em diferentes formatos se solicitado
        if (options.exportJson) {
            await this.exportReport(report, options.jsonPath);
        }
        
        if (options.exportHtml) {
            await this.saveHTMLReport(report, options.htmlPath);
        }
        
        return report;
    }

    // =============================================
    // BLOCO 10: FUNÇÕES AUXILIARES FINAIS
    // =============================================

    /**
     * Calcula complexidade para função independente
     */
    private calculateFunctionComplexity(
        func: FunctionDeclaration, 
        filePath: string, 
        fileName: string, 
        layer: string
    ): ComplexityMetric {
        const functionName = func.getName() || 'anonymous';
        const cyclomaticComplexity = this.calculateCyclomaticComplexity(func);
        const cognitiveComplexity = this.calculateCognitiveComplexity(func);
        const linesOfCode = this.countLinesOfCode(func);
        const parameters = func.getParameters().length;
        const nestingDepth = this.calculateNestingDepth(func);
        const halsteadComplexity = this.calculateHalsteadMetrics(func);
        const maintainabilityIndex = this.calculateMaintainabilityIndex(
            halsteadComplexity, cyclomaticComplexity, linesOfCode
        );
        
        return {
            fileName,
            filePath,
            layer,
            methodName: functionName,
            type: 'FUNCTION',
            cyclomaticComplexity,
            cognitiveComplexity,
            linesOfCode,
            parameters,
            nestingDepth,
            maintainabilityIndex,
            halsteadComplexity,
            risk: this.calculateRisk(cyclomaticComplexity, cognitiveComplexity, maintainabilityIndex)
        };
    }

    /**
     * Validação final dos resultados
     */
    private validateResults(): boolean {
        const hasComplexityData = this.complexityMetrics.length > 0;
        const hasCouplingData = this.couplingMetrics.length > 0;
        const hasCohesionData = this.cohesionMetrics.length > 0;
        
        if (!hasComplexityData && !hasCouplingData && !hasCohesionData) {
            console.warn('⚠️ Nenhuma métrica foi coletada. Verifique se os arquivos contêm código TypeScript válido.');
            return false;
        }
        
        return true;
    }

    /**
     * Limpa recursos e finaliza análise
     */
    public cleanup(): void {
        this.complexityMetrics = [];
        this.couplingMetrics = [];
        this.cohesionMetrics = [];
        this.dependencyGraph.clear();
        this.reverseDependencyGraph.clear();
        this.classFieldsMap.clear();
        
        console.log('🧹 Recursos limpos com sucesso.');
    }
}

// =============================================
// FUNÇÃO DE EXPORTAÇÃO PARA USO EXTERNO
// =============================================
// Adicionar no final do arquivo complexity-analyzer-v2.ts

/**
 * Função principal exportada para uso externo
 * Executa análise completa da arquitetura do projeto
 * 
 * @param tsConfigPath Caminho para o tsconfig.json (opcional)
 * @param options Opções de exportação dos relatórios
 * @returns Relatório completo da análise arquitetural
 */
export async function runArchitectureAnalysis(
    tsConfigPath: string = './tsconfig.json',
    options: {
        exportJson?: boolean;
        exportHtml?: boolean;
        jsonPath?: string;
        htmlPath?: string;
        verbose?: boolean;
    } = {}
): Promise<ArchitectureReport> {
    
    console.log('🚀 Iniciando análise arquitetural...\n');
    
    try {
        // Criar instância do analisador
        const analyzer = new AdvancedArchitectureAnalyzer(tsConfigPath);
        
        // Executar análise completa
        const report = await analyzer.runCompleteAnalysis({
            exportJson: options.exportJson ?? false,
            exportHtml: options.exportHtml ?? false,
            jsonPath: options.jsonPath ?? './architecture-report.json',
            htmlPath: options.htmlPath ?? './architecture-report.html'
        });
        
        // Log adicional se modo verbose ativado
        if (options.verbose) {
            console.log('\n📈 ESTATÍSTICAS DETALHADAS:');
            console.log(`   🔍 Métodos analisados: ${report.complexityMetrics.length}`);
            console.log(`   🏗️ Classes analisadas: ${report.couplingMetrics.length}`);
            console.log(`   🤝 Análises de coesão: ${report.cohesionMetrics.length}`);
            
            // Top 3 mais complexos
            const topComplex = report.complexityMetrics
                .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)
                .slice(0, 3);
            
            if (topComplex.length > 0) {
                console.log('\n   🔴 TOP 3 MAIS COMPLEXOS:');
                topComplex.forEach((method, index) => {
                    console.log(`      ${index + 1}. ${method.className ? method.className + '.' : ''}${method.methodName} (${method.cyclomaticComplexity})`);
                });
            }
        }
        
        // Limpar recursos
        analyzer.cleanup();
        
        console.log('✅ Análise arquitetural concluída com sucesso!');
        return report;
        
    } catch (error) {
        console.error('❌ Erro durante a análise:', error);
        throw error;
    }
}

/**
 * Função auxiliar para análise rápida com configurações padrão
 * Ideal para uso em CI/CD ou verificações rápidas
 */
export async function quickArchitectureCheck(
    tsConfigPath?: string
): Promise<{
    hasViolations: boolean;
    summary: ArchitectureReport['summary'];
    criticalIssues: string[];
}> {
    
    const report = await runArchitectureAnalysis(tsConfigPath, { verbose: false });
    
    const criticalIssues: string[] = [];
    
    // Verificar problemas críticos
    if (report.summary.technicalDebt > 50) {
        criticalIssues.push(`Alto débito técnico: ${report.summary.technicalDebt}h`);
    }
    
    if (report.summary.violations > 20) {
        criticalIssues.push(`Muitas violações: ${report.summary.violations}`);
    }
    
    const highRiskMethods = report.complexityMetrics.filter(m => m.risk === 'VERY_HIGH').length;
    if (highRiskMethods > 5) {
        criticalIssues.push(`${highRiskMethods} métodos de altíssimo risco`);
    }
    
    return {
        hasViolations: report.summary.violations > 10 || criticalIssues.length > 0,
        summary: report.summary,
        criticalIssues
    };
}

/**
 * Função para análise de uma classe específica
 * Útil para análises pontuais durante desenvolvimento
 */
export async function analyzeSpecificClass(
    filePath: string, 
    className: string,
    tsConfigPath?: string
): Promise<{
    complexity?: ComplexityMetric[];
    coupling?: CouplingMetric;
    cohesion?: CohesionMetric;
}> {
    
    const analyzer = new AdvancedArchitectureAnalyzer(tsConfigPath);
    const report = await analyzer.analyzeAll();
    
    const complexity = report.complexityMetrics.filter(m => 
        m.filePath.includes(filePath) && m.className === className
    );
    
    const coupling = report.couplingMetrics.find(m => 
        m.filePath.includes(filePath) && m.className === className
    );
    
    const cohesion = report.cohesionMetrics.find(m => 
        m.filePath.includes(filePath) && m.className === className
    );
    
    analyzer.cleanup();
    
    return { complexity, coupling, cohesion };
}