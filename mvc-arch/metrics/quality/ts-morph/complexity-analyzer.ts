/// <reference types="node" />
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
  Identifier,
  ArrowFunction,
  FunctionExpression,
  ConstructorDeclaration,
  ImportDeclaration,
  ImportSpecifier,
  PropertyDeclaration,
  PropertyAccessExpression,
  ParameterDeclaration,
  VariableStatement,
  VariableDeclaration
} from 'ts-morph';

// =============================================
// INTERFACES ESPECÍFICAS PARA APLICAÇÃO FINANCEIRA
// =============================================

interface HalsteadMetrics {
  operators: number;
  operands: number;
  distinctOperators: number;
  distinctOperands: number;
  vocabulary: number;
  length: number;
  volume: number;
  difficulty: number;
  effort: number;
  timeToImplement: number;
  bugsDelivered: number;
}

interface ComplexityMetric {
  fileName: string;
  filePath: string;
  layer: 'controllers' | 'services' | 'routes' | 'middleware' | 'other';
  className?: string;
  methodName: string;
  componentType: 'CONTROLLER' | 'SERVICE' | 'ROUTE' | 'MIDDLEWARE' | 'OTHER';
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  parameters: number;
  nestingDepth: number;
  maintainabilityIndex: number;
  halsteadComplexity: HalsteadMetrics;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
}

interface CouplingMetric {
  fileName: string;
  filePath: string;
  layer: string;
  className: string;
  afferentCoupling: number;
  efferentCoupling: number;
  instability: number;
  abstractness: number;
  distance: number;
  coupling: number;
  imports: string[];
  dependencies: string[];
  dependents: string[];
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
}

interface CohesionMetric {
  fileName: string;
  filePath: string;
  layer: string;
  className: string;
  lcom1: number;
  lcom2: number;
  lcom3: number;
  lcom4: number;
  methodCount: number;
  fieldCount: number;
  cohesionScore: number;
  tightClassCohesion: number;
  looseClassCohesion: number;
  sharedFields: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
}

interface FinancialAppReport {
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
  layers: {
    controllers: LayerMetrics;
    services: LayerMetrics;
    routes: LayerMetrics;
    middleware: LayerMetrics;
    other: LayerMetrics;
  };
  complexityMetrics: ComplexityMetric[];
  couplingMetrics: CouplingMetric[];
  cohesionMetrics: CohesionMetric[];
  recommendations: string[];
}

interface LayerMetrics {
  files: number;
  classes: number;
  methods: number;
  avgComplexity: number;
  maxComplexity: number;
  avgCoupling: number;
  avgCohesion: number;
  violations: number;
  totalLoc: number;
  dependencies: string[];
}

// =============================================
// ANALISADOR PRINCIPAL
// =============================================

export class FinancialAppAnalyzer {
    private project: Project;
    private complexityMetrics: ComplexityMetric[] = [];
    private couplingMetrics: CouplingMetric[] = [];
    private cohesionMetrics: CohesionMetric[] = [];
    private dependencyGraph: Map<string, Set<string>> = new Map();
    private reverseDependencyGraph: Map<string, Set<string>> = new Map();
    private classFieldsMap: Map<string, Map<string, Set<string>>> = new Map();

    /**
     * Construtor - Inicializa o projeto ts-morph
     * @param tsConfigPath Caminho para o tsconfig.json
     */
    constructor(tsConfigPath: string = './tsconfig.json') {
    this.project = new Project({
        tsConfigFilePath: tsConfigPath,
        compilerOptions: {
        allowJs: true,
        declaration: true,
        skipLibCheck: true,
        }
    });
    }

    // =============================================
    // MÉTODO PRINCIPAL DE ANÁLISE
    // =============================================

    public async analyzeFinancialApp(): Promise<FinancialAppReport> {
        console.log('Iniciando análise da aplicação financeira...\n');
        
        const sourceFiles = this.getFinancialAppFiles();
        console.log(`Analisando ${sourceFiles.length} arquivos da aplicação...\n`);
        
        await this.buildDependencyMaps(sourceFiles);
        await this.executeAnalysis(sourceFiles);
        
        const report = this.generateFinancialReport();
        this.displayFinancialSummary(report);
        
        return report;
    }

    // =============================================
    // IDENTIFICAÇÃO DE ARQUIVOS E CAMADAS
    // =============================================

    private getFinancialAppFiles(): SourceFile[] {
        return this.project.getSourceFiles().filter((sf: any) => {
        const filePath = sf.getFilePath();
        return !filePath.includes('node_modules') &&
                !filePath.includes('.spec.') &&
                !filePath.includes('.test.') &&
                !filePath.includes('.d.ts') &&
                (filePath.includes('controllers') ||
                filePath.includes('services') ||
                filePath.includes('routes') ||
                filePath.includes('middleware') ||
                filePath.endsWith('.ts'));
        });
    }

    private identifyLayer(filePath: string): 'controllers' | 'services' | 'routes' | 'middleware' | 'other' {
        const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');
        
        if (normalizedPath.includes('/controllers/') || normalizedPath.includes('controller.ts')) {
        return 'controllers';
        }
        
        if (normalizedPath.includes('/services/') || 
            normalizedPath.includes('/servives/') || // Considerando o typo no seu projeto
            normalizedPath.includes('service.ts')) {
        return 'services';
        }
        
        if (normalizedPath.includes('/routes/') || normalizedPath.includes('routes.ts')) {
        return 'routes';
        }
        
        if (normalizedPath.includes('/middleware/') || normalizedPath.includes('middleware.ts')) {
        return 'middleware';
        }
        
        return 'other';
    }

    private identifyComponentType(filePath: string, className?: string): 'CONTROLLER' | 'SERVICE' | 'ROUTE' | 'MIDDLEWARE' | 'OTHER' {
        const fileName = path.basename(filePath).toLowerCase();
        
        if (fileName.includes('controller')) return 'CONTROLLER';
        if (fileName.includes('service')) return 'SERVICE';
        if (fileName.includes('routes')) return 'ROUTE';
        if (fileName.includes('middleware')) return 'MIDDLEWARE';
        
        if (className) {
        const lowerClassName = className.toLowerCase();
        if (lowerClassName.includes('controller')) return 'CONTROLLER';
        if (lowerClassName.includes('service')) return 'SERVICE';
        }
        
        return 'OTHER';
    }

    // =============================================
    // CONSTRUÇÃO DO GRAFO DE DEPENDÊNCIAS
    // =============================================

    private async buildDependencyMaps(sourceFiles: SourceFile[]): Promise<void> {
        console.log('Construindo grafo de dependências...');
        
        for (const sourceFile of sourceFiles) {
        const filePath = sourceFile.getFilePath();
        const dependencies = new Set<string>();
        
        sourceFile.getImportDeclarations().forEach((importDecl: ImportDeclaration) => {
            const moduleSpecifier = importDecl.getModuleSpecifierValue();
            
            if (!this.isExternalDependency(moduleSpecifier)) {
            const resolvedPath = this.resolveImportPath(filePath, moduleSpecifier);
            if (resolvedPath) {
                dependencies.add(resolvedPath);
            }
            }
        });
        
        this.dependencyGraph.set(filePath, dependencies);
        
        dependencies.forEach(dep => {
            if (!this.reverseDependencyGraph.has(dep)) {
            this.reverseDependencyGraph.set(dep, new Set());
            }
            this.reverseDependencyGraph.get(dep)!.add(filePath);
        });
        
        this.mapClassFields(sourceFile);
        }
        
        console.log('Grafo de dependências construído.\n');
    }

    private isExternalDependency(moduleSpecifier: string): boolean {
        const externalDeps = [
        'express', 'prisma', '@prisma/client', 'typescript', 'reflect-metadata',
        'cors', 'helmet', 'express-rate-limit', 'dotenv', 'bcrypt', 'jsonwebtoken',
        'fs', 'path', 'crypto', 'util', 'http', 'https'
        ];
        
        return externalDeps.some(dep => moduleSpecifier.startsWith(dep)) || 
            (!moduleSpecifier.startsWith('./') && 
                !moduleSpecifier.startsWith('../') &&
                !moduleSpecifier.startsWith('@/'));
    }

    private resolveImportPath(fromFile: string, moduleSpecifier: string): string | null {
        if (moduleSpecifier.startsWith('./') || moduleSpecifier.startsWith('../')) {
        const resolved = path.resolve(path.dirname(fromFile), moduleSpecifier);
        
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts'];
        
        for (const ext of extensions) {
            const fullPath = resolved + ext;
            if (fs.existsSync(fullPath)) {
            return fullPath;
            }
        }
        
        if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
            const indexPath = path.join(resolved, 'index.ts');
            if (fs.existsSync(indexPath)) {
            return indexPath;
            }
        }
        }
        
        return null;
    }

    private mapClassFields(sourceFile: SourceFile): void {
        const filePath = sourceFile.getFilePath();
        
        sourceFile.getClasses().forEach((classDecl: ClassDeclaration) => {
        const className = classDecl.getName();
        if (!className) return;
        
        if (!this.classFieldsMap.has(filePath)) {
            this.classFieldsMap.set(filePath, new Map());
        }
        
        const fields = new Set<string>();
        
        classDecl.getProperties().forEach((prop: PropertyDeclaration) => {
            const propName = prop.getName();
            if (propName) fields.add(propName);
        });
        
        classDecl.getConstructors().forEach((constructor: ConstructorDeclaration) => {
            constructor.getParameters().forEach((param: ParameterDeclaration) => {
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

    // =============================================
    // EXECUÇÃO DAS ANÁLISES
    // =============================================

    private async executeAnalysis(sourceFiles: SourceFile[]): Promise<void> {
        console.log('Executando análises de complexidade, acoplamento e coesão...');
        
        for (const sourceFile of sourceFiles) {
        const filePath = sourceFile.getFilePath();
        const fileName = path.basename(filePath);
        const layer = this.identifyLayer(filePath);
        
        await this.analyzeComplexity(sourceFile, filePath, fileName, layer);
        await this.analyzeCoupling(sourceFile, filePath, fileName, layer);
        await this.analyzeCohesion(sourceFile, filePath, fileName, layer);
        }
        
        console.log('Análises concluídas!\n');
    }

    // =============================================
    // ANÁLISE DE COMPLEXIDADE
    // =============================================

    private async analyzeComplexity(
        sourceFile: SourceFile, 
        filePath: string, 
        fileName: string, 
        layer: 'controllers' | 'services' | 'routes' | 'middleware' | 'other'
    ): Promise<void> {
        // Analisar classes (Controllers, Services)
        sourceFile.getClasses().forEach((classDecl: ClassDeclaration) => {
        const className = classDecl.getName() || 'AnonymousClass';
        const componentType = this.identifyComponentType(filePath, className);
        
        // Métodos da classe
        classDecl.getMethods().forEach((method: MethodDeclaration) => {
            const metrics = this.calculateMethodComplexity(method, filePath, fileName, layer, className, componentType);
            this.complexityMetrics.push(metrics);
        });
        
        // Construtores
        classDecl.getConstructors().forEach((constructor: ConstructorDeclaration) => {
            const metrics = this.calculateConstructorComplexity(constructor, filePath, fileName, layer, className, componentType);
            this.complexityMetrics.push(metrics);
        });
        });

        // Analisar funções independentes (routes)
        sourceFile.getFunctions().forEach((func: FunctionDeclaration) => {
        const metrics = this.calculateFunctionComplexity(func, filePath, fileName, layer);
        this.complexityMetrics.push(metrics);
        });

        // Analisar arrow functions e function expressions
        sourceFile.getVariableStatements().forEach((varStmt: VariableStatement) => {
        varStmt.getDeclarations().forEach((decl: VariableDeclaration) => {
            const initializer = decl.getInitializer();
            if (initializer && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
            const functionName = decl.getName();
            const metrics = this.calculateArrowFunctionComplexity(initializer, filePath, fileName, layer, functionName);
            this.complexityMetrics.push(metrics);
            }
        });
        });
    }

    private calculateCyclomaticComplexity(node: Node): number {
        let complexity = 1;
        
        const traverse = (currentNode: Node) => {
        const kind = currentNode.getKind();
        
        switch (kind) {
            case SyntaxKind.IfStatement:
            case SyntaxKind.ConditionalExpression:
            case SyntaxKind.WhileStatement:
            case SyntaxKind.DoStatement:
            case SyntaxKind.ForStatement:
            case SyntaxKind.ForInStatement:
            case SyntaxKind.ForOfStatement:
            case SyntaxKind.CaseClause:
            case SyntaxKind.CatchClause:
            complexity++;
            break;
            
            case SyntaxKind.BinaryExpression:
            const binaryExpr = currentNode.asKindOrThrow(SyntaxKind.BinaryExpression);
            const operator = binaryExpr.getOperatorToken().getKind();
            
            if (operator === SyntaxKind.AmpersandAmpersandToken ||
                operator === SyntaxKind.BarBarToken ||
                operator === SyntaxKind.QuestionQuestionToken) {
                complexity++;
            }
            break;
        }
        
        currentNode.getChildren().forEach(traverse);
        };
        
        traverse(node);
        return complexity;
    }

    private calculateCognitiveComplexity(node: Node): number {
        let complexity = 0;
        
        const traverse = (currentNode: Node, nestingLevel: number = 0) => {
        const kind = currentNode.getKind();
        let increment = 0;
        let nestingIncrement = 0;
        
        switch (kind) {
            case SyntaxKind.IfStatement:
            case SyntaxKind.SwitchStatement:
            case SyntaxKind.ForStatement:
            case SyntaxKind.ForInStatement:
            case SyntaxKind.ForOfStatement:
            case SyntaxKind.WhileStatement:
            case SyntaxKind.DoStatement:
            case SyntaxKind.CatchClause:
            increment = 1 + nestingLevel;
            nestingIncrement = 1;
            break;
            
            case SyntaxKind.ConditionalExpression:
            increment = 1;
            break;
            
            case SyntaxKind.BinaryExpression:
            const binaryExpr = currentNode.asKindOrThrow(SyntaxKind.BinaryExpression);
            const operator = binaryExpr.getOperatorToken().getKind();
            if (operator === SyntaxKind.AmpersandAmpersandToken || 
                operator === SyntaxKind.BarBarToken) {
                increment = 1;
            }
            break;
        }
        
        complexity += increment;
        
        currentNode.getChildren().forEach((child: Node) => 
            traverse(child, nestingLevel + nestingIncrement)
        );
        };
        
        traverse(node);
        return complexity;
    }

    private calculateHalsteadMetrics(node: Node): HalsteadMetrics {
        const operators = new Set<string>();
        const operands = new Set<string>();
        let totalOperators = 0;
        let totalOperands = 0;
        
        const traverse = (currentNode: Node) => {
        const kind = currentNode.getKind();
        const text = currentNode.getText().trim();
        
        if (this.isOperator(kind)) {
            operators.add(text);
            totalOperators++;
        } else if (this.isOperand(kind)) {
            operands.add(text);
            totalOperands++;
        }
        
        currentNode.getChildren().forEach(traverse);
        };
        
        traverse(node);
        
        const n1 = operators.size;
        const n2 = operands.size;
        const N1 = totalOperators;
        const N2 = totalOperands;
        
        const vocabulary = n1 + n2;
        const length = N1 + N2;
        const volume = length * Math.log2(vocabulary || 1);
        const difficulty = (n1 / 2) * (N2 / (n2 || 1));
        const effort = difficulty * volume;
        const timeToImplement = effort / 18;
        const bugsDelivered = volume / 3000;
        
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

    private isOperator(kind: SyntaxKind): boolean {
        const operatorKinds = [
        SyntaxKind.PlusToken, SyntaxKind.MinusToken, SyntaxKind.AsteriskToken,
        SyntaxKind.SlashToken, SyntaxKind.PercentToken,
        SyntaxKind.EqualsEqualsToken, SyntaxKind.ExclamationEqualsToken,
        SyntaxKind.EqualsEqualsEqualsToken, SyntaxKind.ExclamationEqualsEqualsToken,
        SyntaxKind.LessThanToken, SyntaxKind.GreaterThanToken,
        SyntaxKind.LessThanEqualsToken, SyntaxKind.GreaterThanEqualsToken,
        SyntaxKind.AmpersandAmpersandToken, SyntaxKind.BarBarToken,
        SyntaxKind.ExclamationToken, SyntaxKind.EqualsToken,
        SyntaxKind.PlusEqualsToken, SyntaxKind.MinusEqualsToken,
        SyntaxKind.QuestionQuestionToken, SyntaxKind.QuestionDotToken,
        ];
        
        return operatorKinds.includes(kind);
    }

    private isOperand(kind: SyntaxKind): boolean {
        const operandKinds = [
        SyntaxKind.Identifier,
        SyntaxKind.StringLiteral, SyntaxKind.NumericLiteral,
        SyntaxKind.TrueKeyword, SyntaxKind.FalseKeyword, SyntaxKind.NullKeyword,
        SyntaxKind.UndefinedKeyword, SyntaxKind.ThisKeyword,
        ];
        
        return operandKinds.includes(kind);
    }

    private countLinesOfCode(node: Node): number {
        const text = node.getText();
        const lines = text.split('\n');
        
        return lines.filter((line: string) => {
        const trimmed = line.trim();
        return trimmed.length > 0 && 
                !trimmed.startsWith('//') && 
                !trimmed.startsWith('/*') && 
                !trimmed.startsWith('*') &&
                trimmed !== '*/';
        }).length;
    }

    private calculateNestingDepth(node: Node): number {
        let maxDepth = 0;
        
        const traverse = (currentNode: Node, currentDepth: number = 0) => {
        const kind = currentNode.getKind();
        let newDepth = currentDepth;
        
        const nestingStructures = [
            SyntaxKind.IfStatement,
            SyntaxKind.ForStatement, SyntaxKind.ForInStatement, SyntaxKind.ForOfStatement,
            SyntaxKind.WhileStatement, SyntaxKind.DoStatement,
            SyntaxKind.SwitchStatement, SyntaxKind.TryStatement, SyntaxKind.CatchClause,
            SyntaxKind.FunctionDeclaration, SyntaxKind.ArrowFunction, SyntaxKind.FunctionExpression,
        ];
        
        if (nestingStructures.includes(kind)) {
            newDepth++;
            maxDepth = Math.max(maxDepth, newDepth);
        }
        
        currentNode.getChildren().forEach((child: Node) => traverse(child, newDepth));
        };
        
        traverse(node);
        return maxDepth;
    }

    private calculateMaintainabilityIndex(
        halstead: HalsteadMetrics, 
        cyclomatic: number, 
        loc: number
    ): number {
        const aveE = Math.max(halstead.effort, 1);
        const aveVg = Math.max(cyclomatic, 1);
        const aveLOC = Math.max(loc, 1);
        
        const index = 171 - 5.2 * Math.log(aveE) - 0.23 * aveVg - 16.2 * Math.log(aveLOC);
        
        return Math.max(0, Math.min(171, index));
    }

    private calculateRisk(
        cyclomatic: number, 
        cognitive: number, 
        maintainability: number
    ): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
        let riskScore = 0;
        
        if (cyclomatic > 20) riskScore += 3;
        else if (cyclomatic > 10) riskScore += 2;
        else if (cyclomatic > 5) riskScore += 1;
        
        if (cognitive > 25) riskScore += 3;
        else if (cognitive > 15) riskScore += 2;
        else if (cognitive > 10) riskScore += 1;
        
        if (maintainability < 20) riskScore += 3;
        else if (maintainability < 40) riskScore += 2;
        else if (maintainability < 60) riskScore += 1;
        
        if (riskScore >= 7) return 'VERY_HIGH';
        if (riskScore >= 5) return 'HIGH';
        if (riskScore >= 3) return 'MEDIUM';
        return 'LOW';
    }

    private calculateMethodComplexity(
        method: MethodDeclaration,
        filePath: string,
        fileName: string,
        layer: 'controllers' | 'services' | 'routes' | 'middleware' | 'other',
        className: string,
        componentType: 'CONTROLLER' | 'SERVICE' | 'ROUTE' | 'MIDDLEWARE' | 'OTHER'
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
        componentType,
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

    private calculateConstructorComplexity(
        constructor: ConstructorDeclaration,
        filePath: string,
        fileName: string,
        layer: 'controllers' | 'services' | 'routes' | 'middleware' | 'other',
        className: string,
        componentType: 'CONTROLLER' | 'SERVICE' | 'ROUTE' | 'MIDDLEWARE' | 'OTHER'
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
        componentType,
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

    private calculateFunctionComplexity(
        func: FunctionDeclaration,
        filePath: string,
        fileName: string,
        layer: 'controllers' | 'services' | 'routes' | 'middleware' | 'other'
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
        componentType: this.identifyComponentType(filePath),
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

    private calculateArrowFunctionComplexity(
        func: ArrowFunction | FunctionExpression,
        filePath: string,
        fileName: string,
        layer: 'controllers' | 'services' | 'routes' | 'middleware' | 'other',
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
        componentType: this.identifyComponentType(filePath),
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
  // ANÁLISE DE ACOPLAMENTO
  // =============================================

    private async analyzeCoupling(
        sourceFile: SourceFile, 
        filePath: string, 
        fileName: string, 
        layer: string
    ): Promise<void> {
        sourceFile.getClasses().forEach((classDecl: ClassDeclaration) => {
        const className = classDecl.getName();
        if (!className) return;
        
        const metrics = this.calculateCouplingMetrics(classDecl, filePath, fileName, layer, className);
        this.couplingMetrics.push(metrics);
        });
    }

    private calculateCouplingMetrics(
        classDecl: ClassDeclaration,
        filePath: string,
        fileName: string,
        layer: string,
        className: string
    ): CouplingMetric {
        const dependencies = this.dependencyGraph.get(filePath) || new Set();
        const efferentCoupling = dependencies.size;
        
        const dependents = this.reverseDependencyGraph.get(filePath) || new Set();
        const afferentCoupling = dependents.size;
        
        const totalCoupling = afferentCoupling + efferentCoupling;
        const instability = totalCoupling > 0 ? efferentCoupling / totalCoupling : 0;
        
        const abstractness = this.calculateAbstractness(filePath);
        const distance = Math.abs(abstractness + instability - 1);
        const coupling = this.calculateOverallCoupling(classDecl, filePath);
        
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
        coupling,
        imports,
        dependencies: internalDependencies,
        dependents: classDependents,
        risk: this.calculateCouplingRisk(efferentCoupling, afferentCoupling, instability, distance)
        };
    }

    private calculateAbstractness(filePath: string): number {
        const sourceFile = this.project.getSourceFile(filePath);
        if (!sourceFile) return 0;
        
        const interfaces = sourceFile.getInterfaces().length;
        const classes = sourceFile.getClasses();
        const totalClasses = classes.length;
        
        if (totalClasses === 0) return interfaces > 0 ? 1 : 0;
        
        const abstractClasses = classes.filter((cls: ClassDeclaration) => cls.isAbstract()).length;
        
        return (interfaces + abstractClasses) / (totalClasses + interfaces);
    }

    private calculateOverallCoupling(classDecl: ClassDeclaration, filePath: string): number {
        let couplingScore = 0;
        
        const extendsClause = classDecl.getExtends();
        if (extendsClause) {
        couplingScore += 3;
        }
        
        const implementsClause = classDecl.getImplements();
        couplingScore += implementsClause.length * 2;
        
        const properties = classDecl.getProperties();
        properties.forEach((prop: PropertyDeclaration) => {
        const typeNode = prop.getTypeNode();
        if (typeNode) {
            const typeText = typeNode.getText();
            if (!this.isPrimitiveType(typeText)) {
            couplingScore += 1;
            }
        }
        });
        
        const methods = classDecl.getMethods();
        methods.forEach((method: MethodDeclaration) => {
        const parameters = method.getParameters();
        parameters.forEach((param: ParameterDeclaration) => {
            const typeNode = param.getTypeNode();
            if (typeNode && !this.isPrimitiveType(typeNode.getText())) {
            couplingScore += 0.5;
            }
        });
        });
        
        const constructors = classDecl.getConstructors();
        constructors.forEach((constructor: ConstructorDeclaration) => {
        const parameters = constructor.getParameters();
        parameters.forEach((param: ParameterDeclaration) => {
            if (param.hasModifier(SyntaxKind.PrivateKeyword) ||
                param.hasModifier(SyntaxKind.ProtectedKeyword) ||
                param.hasModifier(SyntaxKind.PublicKeyword)) {
            couplingScore += 1;
            }
        });
        });
        
        return couplingScore;
    }

    private isPrimitiveType(typeText: string): boolean {
        const primitiveTypes = [
        'string', 'number', 'boolean', 'void', 'null', 'undefined', 
        'any', 'unknown', 'never', 'object', 'Date', 'Array', 'Promise'
        ];
        
        return primitiveTypes.some(type => typeText.toLowerCase().includes(type.toLowerCase()));
    }

    private getImportsList(filePath: string): string[] {
        const sourceFile = this.project.getSourceFile(filePath);
        if (!sourceFile) return [];
        
        return sourceFile.getImportDeclarations().map((importDecl: ImportDeclaration) => {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        const namedImports = importDecl.getNamedImports().map((ni: ImportSpecifier) => ni.getName());
        const defaultImport = importDecl.getDefaultImport()?.getText() || '';
        
        return `${moduleSpecifier}: ${[defaultImport, ...namedImports].filter(Boolean).join(', ')}`;
        });
    }

    private getInternalDependencies(filePath: string): string[] {
        const dependencies = this.dependencyGraph.get(filePath) || new Set();
        return Array.from(dependencies).map(dep => path.basename(dep));
    }

    private calculateCouplingRisk(
        efferent: number,
        afferent: number,
        instability: number,
        distance: number
    ): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
        let riskScore = 0;
        
        if (efferent > 15) riskScore += 3;
        else if (efferent > 10) riskScore += 2;
        else if (efferent > 5) riskScore += 1;
        
        if (instability > 0.8) riskScore += 2;
        else if (instability > 0.6) riskScore += 1;
        
        if (distance > 0.7) riskScore += 3;
        else if (distance > 0.5) riskScore += 2;
        else if (distance > 0.3) riskScore += 1;
        
        if (efferent > 10 && instability > 0.7) riskScore += 2;
        
        if (riskScore >= 8) return 'VERY_HIGH';
        if (riskScore >= 5) return 'HIGH';
        if (riskScore >= 3) return 'MEDIUM';
        return 'LOW';
    }

      // =============================================
  // ANÁLISE DE COESÃO
  // =============================================

    private async analyzeCohesion(
        sourceFile: SourceFile, 
        filePath: string, 
        fileName: string, 
        layer: string
    ): Promise<void> {
        sourceFile.getClasses().forEach((classDecl: ClassDeclaration) => {
        const className = classDecl.getName();
        if (!className) return;
        
        const metrics = this.calculateCohesionMetrics(classDecl, filePath, fileName, layer, className);
        this.cohesionMetrics.push(metrics);
        });
    }

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
        
        const methodFieldUsage = this.mapMethodFieldUsage(methods, fields);
        
        const lcom1 = this.calculateLCOM1(methodFieldUsage, methods.length, fields.size);
        const lcom2 = this.calculateLCOM2(methodFieldUsage, methods.length, fields.size);
        const lcom3 = this.calculateLCOM3(methodFieldUsage, methods.length);
        const lcom4 = this.calculateLCOM4(methodFieldUsage);
        
        const tcc = this.calculateTCC(methodFieldUsage, methods);
        const lcc = this.calculateLCC(methodFieldUsage, methods);
        
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

    private getClassFields(classDecl: ClassDeclaration): Set<string> {
        const fields = new Set<string>();
        
        classDecl.getProperties().forEach((prop: PropertyDeclaration) => {
        const propName = prop.getName();
        if (propName) fields.add(propName);
        });
        
        classDecl.getConstructors().forEach((constructor: ConstructorDeclaration) => {
        constructor.getParameters().forEach((param: ParameterDeclaration) => {
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

    private mapMethodFieldUsage(methods: MethodDeclaration[], fields: Set<string>): Map<string, Set<string>> {
        const usage = new Map<string, Set<string>>();
        
        methods.forEach(method => {
        const methodName = method.getName();
        const usedFields = new Set<string>();
        
        method.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression).forEach((propAccess: PropertyAccessExpression) => {
            const expression = propAccess.getExpression();
            
            if (Node.isThisExpression(expression)) {
            const propertyName = propAccess.getName();
            if (fields.has(propertyName)) {
                usedFields.add(propertyName);
            }
            }
        });
        
        method.getDescendantsOfKind(SyntaxKind.Identifier).forEach((identifier: Identifier) => {
            const identifierName = identifier.getText();
            if (fields.has(identifierName)) {
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

    private calculateLCOM1(
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
        
        return Math.max(0, P - Q);
    }

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

    private calculateLCOM3(
        methodFieldUsage: Map<string, Set<string>>,
        methodCount: number
    ): number {
        if (methodCount <= 1) return 0;
        
        const methods = Array.from(methodFieldUsage.keys());
        const visited = new Set<string>();
        let components = 0;
        
        const dfs = (methodName: string) => {
        if (visited.has(methodName)) return;
        visited.add(methodName);
        
        const currentFields = methodFieldUsage.get(methodName) || new Set();
        
        methods.forEach(otherMethod => {
            if (!visited.has(otherMethod)) {
            const otherFields = methodFieldUsage.get(otherMethod) || new Set();
            
            const hasSharedFields = Array.from(currentFields).some(field => 
                otherFields.has(field)
            );
            
            if (hasSharedFields) {
                dfs(otherMethod);
            }
            }
        });
        };
        
        methods.forEach(method => {
        if (!visited.has(method)) {
            dfs(method);
            components++;
        }
        });
        
        return components;
    }

    private calculateLCOM4(methodFieldUsage: Map<string, Set<string>>): number {
        const methods = Array.from(methodFieldUsage.keys());
        if (methods.length <= 1) return 0;
        
        return this.calculateLCOM3(methodFieldUsage, methods.length);
    }

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

    private calculateLCC(
        methodFieldUsage: Map<string, Set<string>>,
        methods: MethodDeclaration[]
    ): number {
        if (methods.length < 2) return 1;
        
        const methodNames = methods.map(m => m.getName());
        const totalPairs = (methodNames.length * (methodNames.length - 1)) / 2;
        
        const connected = new Map<string, Set<string>>();
        
        methodNames.forEach(method => {
        connected.set(method, new Set());
        });
        
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
        
        const reachable = new Map<string, Set<string>>();
        
        methodNames.forEach(method => {
        const connectedSet = connected.get(method) || new Set<string>();
        reachable.set(method, new Set([method, ...Array.from(connectedSet)]));
        });
        
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

    private calculateSharedFields(methodFieldUsage: Map<string, Set<string>>): number {
        const fieldMethodCount = new Map<string, number>();
        
        methodFieldUsage.forEach((fields) => {
        fields.forEach(field => {
            fieldMethodCount.set(field, (fieldMethodCount.get(field) || 0) + 1);
        });
        });
        
        let sharedFields = 0;
        fieldMethodCount.forEach((count) => {
        if (count > 1) {
            sharedFields++;
        }
        });
        
        return sharedFields;
    }

    private calculateOverallCohesionScore(
        lcom1: number,
        lcom2: number,
        tcc: number,
        lcc: number
    ): number {
        const normalizedLCOM1 = lcom1 > 0 ? 1 / (1 + lcom1) : 1;
        const normalizedLCOM2 = 1 - lcom2;
        
        const scores = [normalizedLCOM1, normalizedLCOM2, tcc, lcc];
        const weights = [0.2, 0.2, 0.3, 0.3];
        
        return scores.reduce((sum, score, index) => sum + (score * weights[index]), 0);
    }

    private calculateCohesionRisk(
        lcom1: number,
        lcom2: number,
        cohesionScore: number,
        methodCount: number
    ): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
        let riskScore = 0;
        
        if (lcom1 > methodCount) riskScore += 3;
        else if (lcom1 > methodCount / 2) riskScore += 2;
        else if (lcom1 > 0) riskScore += 1;
        
        if (lcom2 > 0.8) riskScore += 2;
        else if (lcom2 > 0.5) riskScore += 1;
        
        if (cohesionScore < 0.3) riskScore += 3;
        else if (cohesionScore < 0.5) riskScore += 2;
        else if (cohesionScore < 0.7) riskScore += 1;
        
        if (methodCount > 20 && cohesionScore < 0.5) riskScore += 2;
        
        if (riskScore >= 7) return 'VERY_HIGH';
        if (riskScore >= 5) return 'HIGH';
        if (riskScore >= 3) return 'MEDIUM';
        return 'LOW';
    }

    // =============================================
    // BLOCO DE GERAÇÃO DE RELATÓRIOS
    // =============================================

    private generateFinancialReport(): FinancialAppReport {
    console.log('Gerando relatório da aplicação financeira...');
    
    const summary = this.generateSummary();
    const layers = this.generateLayerMetrics();
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

    private generateSummary(): FinancialAppReport['summary'] {
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
    
    const violations = this.countViolations();
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

    private generateLayerMetrics(): FinancialAppReport['layers'] {
    const layers = {
        controllers: this.calculateLayerMetrics('controllers'),
        services: this.calculateLayerMetrics('services'),
        routes: this.calculateLayerMetrics('routes'),
        middleware: this.calculateLayerMetrics('middleware'),
        other: this.calculateLayerMetrics('other')
    };
    
    return layers;
    }

    private calculateLayerMetrics(layerName: string): LayerMetrics {
    const layerComplexity = this.complexityMetrics.filter(m => m.layer === layerName);
    const layerCoupling = this.couplingMetrics.filter(m => m.layer === layerName);
    const layerCohesion = this.cohesionMetrics.filter(m => m.layer === layerName);
    
    const files = new Set(layerComplexity.map(m => m.filePath)).size;
    const classes = layerCoupling.length;
    const methods = layerComplexity.length;
    
    const avgComplexity = methods > 0
        ? layerComplexity.reduce((sum, m) => sum + m.cyclomaticComplexity, 0) / methods
        : 0;
    
    const maxComplexity = methods > 0
        ? Math.max(...layerComplexity.map(m => m.cyclomaticComplexity))
        : 0;
    
    const avgCoupling = classes > 0
        ? layerCoupling.reduce((sum, m) => sum + m.efferentCoupling, 0) / classes
        : 0;
    
    const avgCohesion = layerCohesion.length > 0
        ? layerCohesion.reduce((sum, m) => sum + m.cohesionScore, 0) / layerCohesion.length
        : 0;
    
    const violations = [
        ...layerComplexity.filter(m => m.risk === 'HIGH' || m.risk === 'VERY_HIGH'),
        ...layerCoupling.filter(m => m.risk === 'HIGH' || m.risk === 'VERY_HIGH'),
        ...layerCohesion.filter(m => m.risk === 'HIGH' || m.risk === 'VERY_HIGH')
    ].length;
    
    const totalLoc = layerComplexity.reduce((sum, m) => sum + m.linesOfCode, 0);
    
    const dependencies = Array.from(new Set(
        layerCoupling.flatMap(m => m.dependencies)
    ));
    
    return {
        files,
        classes,
        methods,
        avgComplexity: Number(avgComplexity.toFixed(2)),
        maxComplexity,
        avgCoupling: Number(avgCoupling.toFixed(2)),
        avgCohesion: Number(avgCohesion.toFixed(2)),
        violations,
        totalLoc,
        dependencies
    };
    }

    private countViolations(): number {
    let violations = 0;
    
    violations += this.complexityMetrics.filter(m => 
        m.risk === 'HIGH' || m.risk === 'VERY_HIGH'
    ).length;
    
    violations += this.couplingMetrics.filter(m => 
        m.risk === 'HIGH' || m.risk === 'VERY_HIGH'
    ).length;
    
    violations += this.cohesionMetrics.filter(m => 
        m.risk === 'HIGH' || m.risk === 'VERY_HIGH'
    ).length;
    
    return violations;
    }

    private calculateTechnicalDebt(): number {
    let debtHours = 0;
    
    // Débito por complexidade
    this.complexityMetrics.forEach(metric => {
        const complexity = metric.cyclomaticComplexity;
        const cognitiveComplexity = metric.cognitiveComplexity;
        
        if (complexity > 10) {
        debtHours += (complexity - 10) * 0.5;
        }
        
        if (cognitiveComplexity > 15) {
        debtHours += (cognitiveComplexity - 15) * 0.3;
        }
        
        if (metric.maintainabilityIndex < 40) {
        debtHours += (40 - metric.maintainabilityIndex) * 0.1;
        }
    });
    
    // Débito por acoplamento
    this.couplingMetrics.forEach(metric => {
        if (metric.efferentCoupling > 10) {
        debtHours += (metric.efferentCoupling - 10) * 0.2;
        }
        
        if (metric.instability > 0.7) {
        debtHours += metric.instability * 2;
        }
        
        if (metric.distance > 0.5) {
        debtHours += metric.distance * 3;
        }
    });
    
    // Débito por coesão
    this.cohesionMetrics.forEach(metric => {
        if (metric.cohesionScore < 0.5) {
        debtHours += (0.5 - metric.cohesionScore) * 4;
        }
        
        if (metric.lcom1 > metric.methodCount) {
        debtHours += (metric.lcom1 - metric.methodCount) * 0.1;
        }
    });
    
    return debtHours;
    }

    private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Recomendações por Controllers
    const controllerIssues = this.complexityMetrics.filter(m => 
        m.componentType === 'CONTROLLER' && (m.risk === 'HIGH' || m.risk === 'VERY_HIGH')
    );
    
    if (controllerIssues.length > 0) {
        recommendations.push(
        `CONTROLLERS: ${controllerIssues.length} método(s) de controller com alta complexidade. ` +
        `Considere extrair lógica de negócio para services.`
        );
    }
    
    // Recomendações por Services
    const serviceIssues = this.complexityMetrics.filter(m => 
        m.componentType === 'SERVICE' && (m.risk === 'HIGH' || m.risk === 'VERY_HIGH')
    );
    
    if (serviceIssues.length > 0) {
        recommendations.push(
        `SERVICES: ${serviceIssues.length} método(s) de service com alta complexidade. ` +
        `Considere quebrar em métodos menores ou aplicar Strategy Pattern.`
        );
    }
    
    // Recomendações de acoplamento
    const highCouplingClasses = this.couplingMetrics.filter(m => 
        m.efferentCoupling > 10
    );
    
    if (highCouplingClasses.length > 0) {
        recommendations.push(
        `ACOPLAMENTO: ${highCouplingClasses.length} classe(s) com alto acoplamento. ` +
        `Implemente Dependency Injection e revise as responsabilidades das classes.`
        );
    }
    
    // Recomendações de coesão
    const lowCohesionClasses = this.cohesionMetrics.filter(m => 
        m.cohesionScore < 0.4
    );
    
    if (lowCohesionClasses.length > 0) {
        recommendations.push(
        `COESÃO: ${lowCohesionClasses.length} classe(s) com baixa coesão. ` +
        `Aplique Single Responsibility Principle e considere dividir as classes.`
        );
    }
    
    // Recomendações específicas para aplicação financeira
    const transactionMethods = this.complexityMetrics.filter(m => 
        m.methodName.toLowerCase().includes('transaction') && m.cyclomaticComplexity > 8
    );
    
    if (transactionMethods.length > 0) {
        recommendations.push(
        `TRANSAÇÕES: Métodos de transação com alta complexidade detectados. ` +
        `Considere usar Command Pattern para operações financeiras.`
        );
    }
    
    const authMethods = this.complexityMetrics.filter(m => 
        (m.methodName.toLowerCase().includes('auth') || 
        m.methodName.toLowerCase().includes('login')) && m.cyclomaticComplexity > 6
    );
    
    if (authMethods.length > 0) {
        recommendations.push(
        `AUTENTICAÇÃO: Métodos de autenticação complexos detectados. ` +
        `Considere extrair validações para classes especializadas.`
        );
    }
    
    // Recomendação geral de débito técnico
    const technicalDebt = this.calculateTechnicalDebt();
    if (technicalDebt > 20) {
        recommendations.push(
        `DÉBITO TÉCNICO: ${technicalDebt.toFixed(1)} horas estimadas de refatoração. ` +
        `Priorize a resolução dos problemas de maior impacto primeiro.`
        );
    }
    
    if (recommendations.length === 0) {
        recommendations.push(
        `APLICAÇÃO SAUDÁVEL: Poucas violações detectadas. ` +
        `Continue mantendo as boas práticas de desenvolvimento.`
        );
    }
    
    return recommendations;
    }

    private displayFinancialSummary(report: FinancialAppReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO DE ANÁLISE - APLICAÇÃO FINANCEIRA');
    console.log('='.repeat(80));
    
    const summary = report.summary;
    
    console.log('\n📋 RESUMO EXECUTIVO:');
    console.log(`   📁 Arquivos analisados: ${summary.totalFiles}`);
    console.log(`   🏗️  Classes encontradas: ${summary.totalClasses}`);
    console.log(`   ⚙️  Métodos analisados: ${summary.totalMethods}`);
    console.log(`   📝 Linhas de código: ${summary.totalLoc.toLocaleString()}`);
    console.log(`   📊 Complexidade média: ${summary.avgComplexity}`);
    console.log(`   🔗 Acoplamento médio: ${summary.avgCoupling}`);
    console.log(`   🤝 Coesão média: ${summary.avgCohesion}`);
    console.log(`   ⚠️  Violações detectadas: ${summary.violations}`);
    console.log(`   💰 Débito técnico: ${summary.technicalDebt}h`);
    
    // Análise por camadas
    console.log('\n🏗️ ANÁLISE POR CAMADAS:');
    
    const layerOrder = ['controllers', 'services', 'routes', 'middleware', 'other'] as const;
    layerOrder.forEach(layerName => {
        const layer = report.layers[layerName];
        if (layer.files > 0) {
        const riskLevel = layer.violations > 5 ? '🔴' : 
                        layer.violations > 2 ? '🟡' : '🟢';
        console.log(`   ${riskLevel} ${layerName.toUpperCase()}:`);
        console.log(`      📁 ${layer.files} arquivos | 🏗️ ${layer.classes} classes | ⚙️ ${layer.methods} métodos`);
        console.log(`      📊 Complexidade: ${layer.avgComplexity} (max: ${layer.maxComplexity})`);
        console.log(`      🔗 Acoplamento: ${layer.avgCoupling} | 🤝 Coesão: ${layer.avgCohesion}`);
        console.log(`      ⚠️ Violações: ${layer.violations} | 📝 LOC: ${layer.totalLoc}`);
        }
    });
    
    // Top problemas
    console.log('\n🚨 TOP PROBLEMAS:');
    
    const mostComplexMethod = this.complexityMetrics
        .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)[0];
    if (mostComplexMethod) {
        console.log(`   🔴 Maior complexidade: ${mostComplexMethod.className || 'Global'}.${mostComplexMethod.methodName} (${mostComplexMethod.cyclomaticComplexity})`);
    }
    
    const mostCoupledClass = this.couplingMetrics
        .sort((a, b) => b.efferentCoupling - a.efferentCoupling)[0];
    if (mostCoupledClass) {
        console.log(`   🔴 Maior acoplamento: ${mostCoupledClass.className} (${mostCoupledClass.efferentCoupling} dependências)`);
    }
    
    const leastCohesiveClass = this.cohesionMetrics
        .sort((a, b) => a.cohesionScore - b.cohesionScore)[0];
    if (leastCohesiveClass) {
        console.log(`   🔴 Menor coesão: ${leastCohesiveClass.className} (${(leastCohesiveClass.cohesionScore * 100).toFixed(1)}%)`);
    }
    
    // Recomendações principais
    console.log('\n💡 RECOMENDAÇÕES:');
    report.recommendations.slice(0, 5).forEach((recommendation, index) => {
        console.log(`   ${index + 1}. ${recommendation}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log(`✅ Análise concluída em ${new Date().toLocaleString()}`);
    console.log('='.repeat(80) + '\n');
    }

    // =============================================
    // MÉTODOS DE EXPORTAÇÃO
    // =============================================

    public async exportReport(report: FinancialAppReport, outputPath: string = './financial-app-analysis.json'): Promise<void> {
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

    public generateHTMLReport(report: FinancialAppReport): string {
    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Análise de Complexidade - Aplicação Financeira</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #f5f7fa; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
            .header h1 { margin: 0 0 10px 0; font-size: 2.5em; }
            .header p { margin: 0; opacity: 0.9; }
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .metric-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); text-align: center; }
            .metric-value { font-size: 2.5em; font-weight: bold; color: #667eea; margin-bottom: 5px; }
            .metric-label { color: #666; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }
            .section { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); margin-bottom: 30px; }
            .section h2 { margin: 0 0 20px 0; color: #333; font-size: 1.5em; }
            .layer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            .layer-card { border: 2px solid #e1e8ed; border-radius: 8px; padding: 15px; }
            .layer-card h3 { margin: 0 0 15px 0; color: #667eea; text-transform: uppercase; font-size: 1.1em; }
            .layer-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 0.9em; }
            .stat { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f0f0f0; }
            .risk-high { border-color: #e74c3c; }
            .risk-medium { border-color: #f39c12; }
            .risk-low { border-color: #27ae60; }
            .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .table th, .table td { border: 1px solid #e1e8ed; padding: 12px 8px; text-align: left; font-size: 0.9em; }
            .table th { background: #f8f9fa; font-weight: 600; }
            .recommendations { background: #e8f4fd; border-left: 4px solid #667eea; padding: 20px; border-radius: 0 8px 8px 0; }
            .recommendations ul { margin: 0; padding-left: 20px; }
            .recommendations li { margin-bottom: 10px; line-height: 1.6; }
            .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; text-transform: uppercase; }
            .badge.high { background: #fee; color: #c53030; }
            .badge.medium { background: #fffaf0; color: #dd6b20; }
            .badge.low { background: #f0fff4; color: #38a169; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 Análise de Complexidade</h1>
                <p>Aplicação Financeira - ${new Date(report.timestamp).toLocaleDateString('pt-BR')}</p>
            </div>
            
            <div class="summary-grid">
                <div class="metric-card">
                    <div class="metric-value">${report.summary.totalFiles}</div>
                    <div class="metric-label">Arquivos</div>
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
                    <div class="metric-value">${report.summary.avgComplexity}</div>
                    <div class="metric-label">Complexidade Média</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${report.summary.violations}</div>
                    <div class="metric-label">Violações</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${report.summary.technicalDebt}h</div>
                    <div class="metric-label">Débito Técnico</div>
                </div>
            </div>
            
            <div class="section">
                <h2>🏗️ Análise por Camadas</h2>
                <div class="layer-grid">
                    ${Object.entries(report.layers).filter(([_, layer]) => layer.files > 0).map(([name, layer]) => `
                    <div class="layer-card ${layer.violations > 5 ? 'risk-high' : layer.violations > 2 ? 'risk-medium' : 'risk-low'}">
                        <h3>${name}</h3>
                        <div class="layer-stats">
                            <div class="stat"><span>Arquivos:</span><span>${layer.files}</span></div>
                            <div class="stat"><span>Classes:</span><span>${layer.classes}</span></div>
                            <div class="stat"><span>Métodos:</span><span>${layer.methods}</span></div>
                            <div class="stat"><span>Complexidade:</span><span>${layer.avgComplexity}</span></div>
                            <div class="stat"><span>Acoplamento:</span><span>${layer.avgCoupling}</span></div>
                            <div class="stat"><span>Coesão:</span><span>${layer.avgCohesion}</span></div>
                            <div class="stat"><span>Violações:</span><span>${layer.violations}</span></div>
                            <div class="stat"><span>LOC:</span><span>${layer.totalLoc}</span></div>
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="section">
                <h2>🚨 Métodos de Alta Complexidade</h2>
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
                                <td><span class="badge ${m.risk.toLowerCase()}">${m.risk}</span></td>
                            </tr>
                            `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h2>🔗 Classes com Alto Acoplamento</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Arquivo</th>
                            <th>Classe</th>
                            <th>Acoplamento Eferente</th>
                            <th>Instabilidade</th>
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
                                <td><span class="badge ${m.risk.toLowerCase()}">${m.risk}</span></td>
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
        </div>
    </body>
    </html>`;
    }

    public async saveHTMLReport(report: FinancialAppReport, outputPath: string = './financial-app-analysis.html'): Promise<void> {
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
}

// =============================================
// FUNÇÃO DE EXPORTAÇÃO PARA USO EXTERNO
// =============================================

/**
 * Função principal para executar análise completa da aplicação financeira
 * @param options Opções de configuração para a análise
 * @returns Promise com o relatório completo da análise
 */
export async function analyzeFinancialApplication(options: {
  tsConfigPath?: string;
  outputJsonPath?: string;
  outputHtmlPath?: string;
  generateHtml?: boolean;
  generateJson?: boolean;
}): Promise<FinancialAppReport> {
  const {
    tsConfigPath = './tsconfig.json',
    outputJsonPath = './financial-app-analysis.json',
    outputHtmlPath = './financial-app-analysis.html',
    generateHtml = true,
    generateJson = true
  } = options;

  try {
    // Inicializar o analisador
    const analyzer = new FinancialAppAnalyzer(tsConfigPath);
    
    // Executar a análise completa
    console.log('🚀 Iniciando análise da aplicação financeira...\n');
    const report = await analyzer.analyzeFinancialApp();
    
    // Exportar relatórios conforme solicitado
    const exportPromises: Promise<void>[] = [];
    
    if (generateJson) {
      exportPromises.push(analyzer.exportReport(report, outputJsonPath));
    }
    
    if (generateHtml) {
      exportPromises.push(analyzer.saveHTMLReport(report, outputHtmlPath));
    }
    
    // Aguardar todas as exportações
    await Promise.all(exportPromises);
    
    console.log('\n✅ Análise concluída com sucesso!');
    
    return report;
    
  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
    throw error;
  }
}

/**
 * Função simplificada para análise rápida
 * @param tsConfigPath Caminho para o tsconfig.json
 * @returns Promise com métricas resumidas
 */
export async function quickAnalysis(tsConfigPath: string = './tsconfig.json'): Promise<{
  summary: FinancialAppReport['summary'];
  topIssues: {
    mostComplexMethod?: ComplexityMetric;
    mostCoupledClass?: CouplingMetric;
    leastCohesiveClass?: CohesionMetric;
  };
  recommendations: string[];
}> {
  const analyzer = new FinancialAppAnalyzer(tsConfigPath);
  const report = await analyzer.analyzeFinancialApp();
  
  const mostComplexMethod = report.complexityMetrics
    .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)[0];
  
  const mostCoupledClass = report.couplingMetrics
    .sort((a, b) => b.efferentCoupling - a.efferentCoupling)[0];
  
  const leastCohesiveClass = report.cohesionMetrics
    .sort((a, b) => a.cohesionScore - b.cohesionScore)[0];
  
  return {
    summary: report.summary,
    topIssues: {
      mostComplexMethod,
      mostCoupledClass,
      leastCohesiveClass
    },
    recommendations: report.recommendations
  };
}

/**
 * Função para analisar apenas complexidade
 * @param tsConfigPath Caminho para o tsconfig.json
 * @returns Promise com métricas de complexidade
 */
export async function analyzeComplexityOnly(
  tsConfigPath: string = './tsconfig.json'
): Promise<ComplexityMetric[]> {
  const analyzer = new FinancialAppAnalyzer(tsConfigPath);
  await analyzer.analyzeFinancialApp();
  return analyzer['complexityMetrics']; // Acesso à propriedade privada
}

/**
 * Função para analisar apenas acoplamento
 * @param tsConfigPath Caminho para o tsconfig.json
 * @returns Promise com métricas de acoplamento
 */
export async function analyzeCouplingOnly(
  tsConfigPath: string = './tsconfig.json'
): Promise<CouplingMetric[]> {
  const analyzer = new FinancialAppAnalyzer(tsConfigPath);
  await analyzer.analyzeFinancialApp();
  return analyzer['couplingMetrics']; // Acesso à propriedade privada
}

/**
 * Função para analisar apenas coesão
 * @param tsConfigPath Caminho para o tsconfig.json
 * @returns Promise com métricas de coesão
 */
export async function analyzeCohesionOnly(
  tsConfigPath: string = './tsconfig.json'
): Promise<CohesionMetric[]> {
  const analyzer = new FinancialAppAnalyzer(tsConfigPath);
  await analyzer.analyzeFinancialApp();
  return analyzer['cohesionMetrics']; // Acesso à propriedade privada
}

/**
 * Função utilitária para análise customizada
 * @param config Configuração personalizada
 * @returns Promise com relatório customizado
 */
export async function customAnalysis(config: {
  tsConfigPath?: string;
  includeComplexity?: boolean;
  includeCoupling?: boolean;
  includeCohesion?: boolean;
  complexityThreshold?: number;
  couplingThreshold?: number;
  cohesionThreshold?: number;
}): Promise<Partial<FinancialAppReport>> {
  const {
    tsConfigPath = './tsconfig.json',
    includeComplexity = true,
    includeCoupling = true,
    includeCohesion = true,
    complexityThreshold = 10,
    couplingThreshold = 8,
    cohesionThreshold = 0.5
  } = config;

  const analyzer = new FinancialAppAnalyzer(tsConfigPath);
  const fullReport = await analyzer.analyzeFinancialApp();
  
  const customReport: Partial<FinancialAppReport> = {
    timestamp: fullReport.timestamp,
    summary: fullReport.summary
  };
  
  if (includeComplexity) {
    customReport.complexityMetrics = fullReport.complexityMetrics
      .filter(m => m.cyclomaticComplexity >= complexityThreshold);
  }
  
  if (includeCoupling) {
    customReport.couplingMetrics = fullReport.couplingMetrics
      .filter(m => m.efferentCoupling >= couplingThreshold);
  }
  
  if (includeCohesion) {
    customReport.cohesionMetrics = fullReport.cohesionMetrics
      .filter(m => m.cohesionScore <= cohesionThreshold);
  }
  
  return customReport;
}

// Exportar interfaces para uso externo
export type {
  ComplexityMetric,
  CouplingMetric,
  CohesionMetric,
  FinancialAppReport,
  HalsteadMetrics,
  LayerMetrics
};