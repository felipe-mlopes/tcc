import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { Project, SourceFile, FunctionDeclaration, MethodDeclaration, ClassDeclaration, PropertyDeclaration } from 'ts-morph';

interface ComplexityMetric {
  fileName: string;
  filePath: string;
  layer: string;
  className?: string;
  methodName: string;
  type: string;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  parameters: number;
  nestingDepth: number;
  maintainabilityIndex: number;
  risk: string;
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
  imports: string[];
  exports: string[];
  dependencies: string[];
  dependents: string[];
  risk: string;
}

interface CohesionMetric {
  fileName: string;
  filePath: string;
  layer: string;
  className: string;
  lcom4: number;
  lcom5: number;
  methodCount: number;
  fieldCount: number;
  cohesionScore: number;
  tightClassCohesion: number;
  looseClassCohesion: number;
  risk: string;
}

interface LayerAnalysis {
  name: string;
  files: number;
  avgComplexity: number;
  maxComplexity: number;
  avgCoupling: number;
  avgCohesion: number;
  violations: number;
  totalLoc: number;
}

interface ArchitectureReport {
  timestamp: string;
  architecture: string;
  framework: string;
  summary: {
    totalFiles: number;
    totalClasses: number;
    totalMethods: number;
    totalLoc: number;
    avgComplexity: number;
    avgCoupling: number;
    avgCohesion: number;
    violations: number;
  };
  layers: { [key: string]: LayerAnalysis };
  complexityMetrics: ComplexityMetric[];
  couplingMetrics: CouplingMetric[];
  cohesionMetrics: CohesionMetric[];
  recommendations: string[];
  trends: any;
}

class ArchitectureAnalyzer {
  private project: Project;
  private complexityMetrics: ComplexityMetric[] = [];
  private couplingMetrics: CouplingMetric[] = [];
  private cohesionMetrics: CohesionMetric[] = [];
  private dependencyMap: Map<string, string[]> = new Map();
  private reverseDepMap: Map<string, string[]> = new Map();

  constructor(tsConfigPath: string = './tsconfig.json') {
    this.project = new Project({
      tsConfigFilePath: tsConfigPath,
      compilerOptions: {
        allowJs: true,
        declaration: true,
      }
    });
  }

  // Identificador de camadas baseado na Clean Architecture
  private identifyLayer(filePath: string): string {
    const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');
    
    if (normalizedPath.includes('/core/') || normalizedPath.includes('/entities/')) return 'core';
    if (normalizedPath.includes('/domain/') || normalizedPath.includes('/use-cases/')) return 'domain';
    if (normalizedPath.includes('/infrastructure/') || normalizedPath.includes('/infra/')) return 'infrastructure';
    if (normalizedPath.includes('/presentation/') || normalizedPath.includes('/controllers/')) return 'presentation';
    if (normalizedPath.includes('/shared/') || normalizedPath.includes('/common/')) return 'shared';
    
    return 'other';
  }

  // Identificador de tipos de componente
  private identifyComponentType(filePath: string, node?: any): string {
    const fileName = path.basename(filePath).toLowerCase();
    
    if (fileName.includes('entity')) return 'ENTITY';
    if (fileName.includes('repository')) return 'REPOSITORY';
    if (fileName.includes('service')) {
      if (filePath.includes('/core/') || filePath.includes('/domain/')) return 'USE_CASE';
      if (filePath.includes('/infrastructure/')) return 'INFRA_SERVICE';
      return 'DOMAIN_SERVICE';
    }
    if (fileName.includes('controller')) return 'CONTROLLER';
    if (fileName.includes('module')) return 'MODULE';
    if (fileName.includes('gateway')) return 'GATEWAY';
    if (fileName.includes('factory')) return 'FACTORY';
    if (fileName.includes('builder')) return 'BUILDER';
    if (fileName.includes('adapter')) return 'ADAPTER';
    if (fileName.includes('mapper')) return 'MAPPER';
    if (fileName.includes('dto')) return 'DTO';
    if (fileName.includes('value-object') || fileName.includes('vo')) return 'VALUE_OBJECT';
    if (fileName.includes('aggregate')) return 'AGGREGATE';
    if (fileName.includes('guard')) return 'GUARD';
    if (fileName.includes('interceptor')) return 'INTERCEPTOR';
    if (fileName.includes('middleware')) return 'MIDDLEWARE';
    if (fileName.includes('decorator')) return 'DECORATOR';
    if (fileName.includes('exception') || fileName.includes('error')) return 'EXCEPTION';
    if (fileName.includes('config')) return 'CONFIG';
    if (fileName.includes('types') || fileName.includes('interface')) return 'TYPES';
    
    return 'OTHER';
  }

  private isExternalDependency(moduleSpecifier: string): boolean {
    const externalDeps = [
      'typescript', 'reflect-metadata', 'rxjs', 'class-transformer',
      'class-validator', 'uuid', 'bcrypt', 'jsonwebtoken', 'prisma',
      'lodash', 'moment', 'axios', 'express', '@nestjs'
    ];
    return externalDeps.some(dep => moduleSpecifier.startsWith(dep));
  }

  // Análise completa
  public async analyzeAll(): Promise<ArchitectureReport> {
    console.log('🗂️  Iniciando análise completa da arquitetura...\n');
    
    const sourceFiles = this.project.getSourceFiles().filter(
      sf => !sf.getFilePath().includes('node_modules') && 
            !sf.getFilePath().includes('.spec.') &&
            !sf.getFilePath().includes('.test.') &&
            sf.getFilePath().endsWith('.ts')
    );
    
    console.log(`📊 Analisando ${sourceFiles.length} arquivos TypeScript...\n`);
    
    // Primeira passada: construir mapa de dependências
    this.buildDependencyMap(sourceFiles);
    
    // Segunda passada: analisar métricas
    for (const sourceFile of sourceFiles) {
      await this.analyzeFile(sourceFile);
    }
    
    const report = this.generateReport();
    
    // Salvar relatórios
    this.saveReports(report);
    
    // Exibir resumo no console
    this.displaySummary(report);
    
    return report;
  }

  // Construir mapa de dependências
  private buildDependencyMap(sourceFiles: SourceFile[]): void {
    sourceFiles.forEach(sourceFile => {
      const filePath = sourceFile.getFilePath();
      const dependencies: string[] = [];
      
      // Analisar imports
      sourceFile.getImportDeclarations().forEach(importDecl => {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        if (moduleSpecifier.startsWith('./') || moduleSpecifier.startsWith('../')) {
          // Resolver path relativo
          const resolvedPath = path.resolve(path.dirname(filePath), moduleSpecifier);
          dependencies.push(resolvedPath);
        } else if (!moduleSpecifier.startsWith('@nestjs') && 
                   !moduleSpecifier.startsWith('node:') &&
                   !this.isExternalDependency(moduleSpecifier)) {
          dependencies.push(moduleSpecifier);
        }
      });
      
      this.dependencyMap.set(filePath, dependencies);
      
      // Construir mapa reverso
      dependencies.forEach(dep => {
        if (!this.reverseDepMap.has(dep)) {
          this.reverseDepMap.set(dep, []);
        }
        this.reverseDepMap.get(dep)!.push(filePath);
      });
    });
  }

  // Analisar arquivo individual
  private async analyzeFile(sourceFile: SourceFile): Promise<void> {
    const filePath = sourceFile.getFilePath();
    const fileName = path.basename(filePath);
    const layer = this.identifyLayer(filePath);
    
    // Analisar complexidade de funções e métodos
    await this.analyzeComplexity(sourceFile, filePath, fileName, layer);
    
    // Analisar acoplamento de classes
    await this.analyzeCoupling(sourceFile, filePath, fileName, layer);
    
    // Analisar coesão de classes
    await this.analyzeCohesion(sourceFile, filePath, fileName, layer);
  }

    // Análise de complexidade
  private async analyzeComplexity(sourceFile: SourceFile, filePath: string, fileName: string, layer: string): Promise<void> {
    // Analisar métodos de classes
    sourceFile.getClasses().forEach(classDecl => {
      const className = classDecl.getName() || 'AnonymousClass';
      
      classDecl.getMethods().forEach(method => {
        const metrics = this.calculateMethodComplexity(method, filePath, fileName, layer, className);
        this.complexityMetrics.push(metrics);
      });
      
      // Analisar construtores
      classDecl.getConstructors().forEach(constructor => {
        const metrics = this.calculateMethodComplexity(constructor, filePath, fileName, layer, className, 'constructor');
        this.complexityMetrics.push(metrics);
      });
    });

    // Analisar funções independentes
    sourceFile.getFunctions().forEach(func => {
      const metrics = this.calculateFunctionComplexity(func, filePath, fileName, layer);
      this.complexityMetrics.push(metrics);
    });

    // Analisar arrow functions exportadas
    sourceFile.getVariableStatements().forEach(varStmt => {
      varStmt.getDeclarations().forEach(decl => {
        const initializer = decl.getInitializer();
        if (initializer && (initializer.getKind() === ts.SyntaxKind.ArrowFunction || 
                           initializer.getKind() === ts.SyntaxKind.FunctionExpression)) {
          const functionName = decl.getName();
          const metrics = this.calculateArrowFunctionComplexity(initializer, filePath, fileName, layer, functionName);
          this.complexityMetrics.push(metrics);
        }
      });
    });
  }

  // Cálculo de complexidade de método
  private calculateMethodComplexity(method: any, filePath: string, fileName: string, layer: string, className: string, methodType: string = 'method'): ComplexityMetric {
    const methodName = methodType === 'constructor' ? 'constructor' : method.getName() || 'anonymous';
    const componentType = this.identifyComponentType(filePath);
    
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(method);
    const cognitiveComplexity = this.calculateCognitiveComplexity(method);
    const linesOfCode = this.countLinesOfCode(method);
    const parameters = methodType === 'constructor' ? method.getParameters().length : method.getParameters().length;
    const nestingDepth = this.calculateNestingDepth(method);
    const maintainabilityIndex = this.calculateMaintainabilityIndex(cyclomaticComplexity, linesOfCode, parameters);
    
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
      risk: this.assessComplexityRisk(cyclomaticComplexity, cognitiveComplexity, layer, componentType)
    };
  }

  // Cálculo de complexidade de função
  private calculateFunctionComplexity(func: FunctionDeclaration, filePath: string, fileName: string, layer: string): ComplexityMetric {
    const functionName = func.getName() || 'anonymous';
    const componentType = this.identifyComponentType(filePath);
    
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(func);
    const cognitiveComplexity = this.calculateCognitiveComplexity(func);
    const linesOfCode = this.countLinesOfCode(func);
    const parameters = func.getParameters().length;
    const nestingDepth = this.calculateNestingDepth(func);
    const maintainabilityIndex = this.calculateMaintainabilityIndex(cyclomaticComplexity, linesOfCode, parameters);
    
    return {
      fileName,
      filePath,
      layer,
      methodName: functionName,
      type: componentType,
      cyclomaticComplexity,
      cognitiveComplexity,
      linesOfCode,
      parameters,
      nestingDepth,
      maintainabilityIndex,
      risk: this.assessComplexityRisk(cyclomaticComplexity, cognitiveComplexity, layer, componentType)
    };
  }

  // Cálculo de complexidade de arrow function
  private calculateArrowFunctionComplexity(arrowFunc: any, filePath: string, fileName: string, layer: string, functionName: string): ComplexityMetric {
    const componentType = this.identifyComponentType(filePath);
    
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(arrowFunc);
    const cognitiveComplexity = this.calculateCognitiveComplexity(arrowFunc);
    const linesOfCode = this.countLinesOfCode(arrowFunc);
    const parameters = arrowFunc.getParameters ? arrowFunc.getParameters().length : 0;
    const nestingDepth = this.calculateNestingDepth(arrowFunc);
    const maintainabilityIndex = this.calculateMaintainabilityIndex(cyclomaticComplexity, linesOfCode, parameters);
    
    return {
      fileName,
      filePath,
      layer,
      methodName: functionName,
      type: componentType,
      cyclomaticComplexity,
      cognitiveComplexity,
      linesOfCode,
      parameters,
      nestingDepth,
      maintainabilityIndex,
      risk: this.assessComplexityRisk(cyclomaticComplexity, cognitiveComplexity, layer, componentType)
    };
  }

  // Complexidade ciclomática (McCabe)
  private calculateCyclomaticComplexity(node: any): number {
    let complexity = 1; // Complexidade base
    
    // Estruturas de controle que aumentam complexidade
    const complexityNodes = [
      ts.SyntaxKind.IfStatement,
      ts.SyntaxKind.WhileStatement,
      ts.SyntaxKind.DoStatement,
      ts.SyntaxKind.ForStatement,
      ts.SyntaxKind.ForInStatement,
      ts.SyntaxKind.ForOfStatement,
      ts.SyntaxKind.CaseClause,
      ts.SyntaxKind.ConditionalExpression,
      ts.SyntaxKind.CatchClause,
    ];

    const traverse = (currentNode: any) => {
      if (complexityNodes.includes(currentNode.getKind())) {
        complexity++;
      }

      // Operadores lógicos
      if (currentNode.getKind() === ts.SyntaxKind.BinaryExpression) {
        const operator = currentNode.getOperatorToken().getKind();
        if (operator === ts.SyntaxKind.AmpersandAmpersandToken || 
            operator === ts.SyntaxKind.BarBarToken ||
            operator === ts.SyntaxKind.QuestionQuestionToken) {
          complexity++;
        }
      }

      currentNode.getChildren().forEach((child: any) => traverse(child));
    };

    traverse(node);
    return complexity;
  }

  // Complexidade cognitiva (considera nesting e estruturas)
  private calculateCognitiveComplexity(node: any): number {
    let complexity = 0;
    
    const traverse = (currentNode: any, nestingLevel: number = 0) => {
      const kind = currentNode.getKind();
      
      switch (kind) {
        case ts.SyntaxKind.IfStatement:
          complexity += 1 + nestingLevel;
          nestingLevel++;
          break;
        case ts.SyntaxKind.SwitchStatement:
          complexity += 1 + nestingLevel;
          nestingLevel++;
          break;
        case ts.SyntaxKind.ForStatement:
        case ts.SyntaxKind.ForInStatement:
        case ts.SyntaxKind.ForOfStatement:
        case ts.SyntaxKind.WhileStatement:
        case ts.SyntaxKind.DoStatement:
          complexity += 1 + nestingLevel;
          nestingLevel++;
          break;
        case ts.SyntaxKind.CatchClause:
          complexity += 1 + nestingLevel;
          break;
        case ts.SyntaxKind.ConditionalExpression:
          complexity += 1 + nestingLevel;
          break;
        case ts.SyntaxKind.BinaryExpression:
          const operator = currentNode.getOperatorToken().getKind();
          if (operator === ts.SyntaxKind.AmpersandAmpersandToken || 
              operator === ts.SyntaxKind.BarBarToken) {
            complexity += 1;
          }
          break;
        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.ArrowFunction:
          if (currentNode !== node) { // Não contar a função atual
            complexity += 1 + nestingLevel;
            nestingLevel++;
          }
          break;
      }

      currentNode.getChildren().forEach((child: any) => 
        traverse(child, nestingLevel)
      );
    };

    traverse(node, 0);
    return complexity;
  }

  // Profundidade de aninhamento
  private calculateNestingDepth(node: any): number {
    let maxDepth = 0;
    
    const traverse = (currentNode: any, currentDepth: number = 0) => {
      maxDepth = Math.max(maxDepth, currentDepth);
      
      const nestingNodes = [
        ts.SyntaxKind.IfStatement,
        ts.SyntaxKind.WhileStatement,
        ts.SyntaxKind.DoStatement,
        ts.SyntaxKind.ForStatement,
        ts.SyntaxKind.ForInStatement,
        ts.SyntaxKind.ForOfStatement,
        ts.SyntaxKind.SwitchStatement,
        ts.SyntaxKind.TryStatement,
        ts.SyntaxKind.CatchClause,
        ts.SyntaxKind.Block
      ];

      if (nestingNodes.includes(currentNode.getKind())) {
        currentDepth++;
      }

      currentNode.getChildren().forEach((child: any) => 
        traverse(child, currentDepth)
      );
    };

    traverse(node, 0);
    return maxDepth;
  }

  // Linhas de código (sem comentários e linhas vazias)
  private countLinesOfCode(node: any): number {
    const text = node.getFullText();
    const lines = text.split('\n').filter((line: string) => {
      const trimmed = line.trim();
      return trimmed !== '' && 
             !trimmed.startsWith('//') && 
             !trimmed.startsWith('/*') && 
             !trimmed.startsWith('*') &&
             trimmed !== '*/';
    });
    return lines.length;
  }

  // Índice de manutenibilidade (Microsoft)
  private calculateMaintainabilityIndex(cyclomaticComplexity: number, linesOfCode: number, parameters: number): number {
    const halsteadVolume = Math.max(1, Math.log2(parameters + 4)); // Simplificado
    const mi = Math.max(0, 
      (171 - 5.2 * Math.log(halsteadVolume) - 0.23 * cyclomaticComplexity - 16.2 * Math.log(linesOfCode)) * 100 / 171
    );
    return Math.round(mi * 100) / 100;
  }

  // Avaliação de risco de complexidade
  private assessComplexityRisk(cyclomaticComplexity: number, cognitiveComplexity: number, layer: string, componentType: string): string {
    // Limites baseados no tipo de componente e camada
    let cyclomaticThresholds: { low: number, medium: number, high: number };
    let cognitiveThresholds: { low: number, medium: number, high: number };

    switch (componentType) {
      case 'ENTITY':
      case 'VALUE_OBJECT':
        cyclomaticThresholds = { low: 3, medium: 6, high: 10 };
        cognitiveThresholds = { low: 2, medium: 5, high: 8 };
        break;
      case 'USE_CASE':
      case 'DOMAIN_SERVICE':
        cyclomaticThresholds = { low: 5, medium: 10, high: 15 };
        cognitiveThresholds = { low: 4, medium: 8, high: 12 };
        break;
      case 'CONTROLLER':
        cyclomaticThresholds = { low: 3, medium: 6, high: 10 };
        cognitiveThresholds = { low: 2, medium: 4, high: 8 };
        break;
      default:
        cyclomaticThresholds = { low: 4, medium: 8, high: 12 };
        cognitiveThresholds = { low: 3, medium: 6, high: 10 };
    }

    if (cyclomaticComplexity > cyclomaticThresholds.high || cognitiveComplexity > cognitiveThresholds.high) {
      return '🔴 CRÍTICO - Refatoração urgente necessária';
    }
    if (cyclomaticComplexity > cyclomaticThresholds.medium || cognitiveComplexity > cognitiveThresholds.medium) {
      return '🟡 ATENÇÃO - Considerar refatoração';
    }
    if (cyclomaticComplexity > cyclomaticThresholds.low || cognitiveComplexity > cognitiveThresholds.low) {
      return '🟨 MODERADO - Monitorar crescimento';
    }
    
    return '🟢 OK - Complexidade adequada';
  }

  // Análise de acoplamento
  private async analyzeCoupling(sourceFile: SourceFile, filePath: string, fileName: string, layer: string): Promise<void> {
    sourceFile.getClasses().forEach(classDecl => {
      const className = classDecl.getName() || 'AnonymousClass';
      
      // Acoplamento eferente (saindo) - dependências
      const efferentCoupling = this.dependencyMap.get(filePath)?.length || 0;
      
      // Acoplamento aferente (entrando) - dependentes
      const afferentCoupling = this.reverseDepMap.get(filePath)?.length || 0;
      
      // Instabilidade (I = Ce / (Ca + Ce))
      const instability = (afferentCoupling + efferentCoupling) === 0 ? 0 : 
        efferentCoupling / (afferentCoupling + efferentCoupling);
      
      // Abstração (baseado em classes abstratas, interfaces)
      const abstractness = this.calculateAbstractness(classDecl);
      
      // Distância da sequência principal (D = |A + I - 1|)
      const distance = Math.abs(abstractness + instability - 1);
      
      const couplingMetric: CouplingMetric = {
        fileName,
        filePath,
        layer,
        className,
        afferentCoupling,
        efferentCoupling,
        instability: Math.round(instability * 1000) / 1000,
        abstractness: Math.round(abstractness * 1000) / 1000,
        distance: Math.round(distance * 1000) / 1000,
        imports: this.getImports(sourceFile),
        exports: this.getExports(sourceFile),
        dependencies: this.dependencyMap.get(filePath) || [],
        dependents: this.reverseDepMap.get(filePath) || [],
        risk: this.assessCouplingRisk(afferentCoupling, efferentCoupling, instability, layer)
      };
      
      this.couplingMetrics.push(couplingMetric);
    });
  }

  private calculateAbstractness(classDecl: ClassDeclaration): number {
    let abstractScore = 0;

    // Classe abstrata
    if (classDecl.isAbstract()) {
      abstractScore += 0.5;
    }

    // Implementa interfaces
    const implementsClauses = classDecl.getImplements();
    if (implementsClauses.length > 0) {
      abstractScore += 0.3;
    }

    // Métodos abstratos
    const abstractMethods = classDecl.getMethods().filter(m => m.isAbstract());
    if (abstractMethods.length > 0) {
      abstractScore += 0.2;
    }

    return Math.min(1, abstractScore);
  }

  private getImports(sourceFile: SourceFile): string[] {
    return sourceFile.getImportDeclarations().map(imp => 
      imp.getModuleSpecifierValue()
    );
  }

  private getExports(sourceFile: SourceFile): string[] {
    const exports: string[] = [];
    
    sourceFile.getExportDeclarations().forEach(exp => {
      const moduleSpecifier = exp.getModuleSpecifierValue();
      if (moduleSpecifier) {
        exports.push(moduleSpecifier);
      }
    });

    sourceFile.getClasses().forEach(cls => {
      if (cls.isExported()) {
        exports.push(cls.getName() || 'AnonymousClass');
      }
    });

    sourceFile.getFunctions().forEach(func => {
      if (func.isExported()) {
        exports.push(func.getName() || 'anonymous');
      }
    });

    return exports;
  }

  private assessCouplingRisk(afferentCoupling: number, efferentCoupling: number, instability: number, layer: string): string {
    // Limites baseados na camada da Clean Architecture
    let afferentThreshold: number, efferentThreshold: number;

    switch (layer) {
      case 'core':
        afferentThreshold = 8; // Core pode ser muito dependido
        efferentThreshold = 2; // Mas não deve depender de muito
        break;
      case 'domain':
        afferentThreshold = 6;
        efferentThreshold = 3;
        break;
      case 'infrastructure':
        afferentThreshold = 3; // Infraestrutura não deve ser muito dependida
        efferentThreshold = 8; // Mas pode depender de muitos externos
        break;
      case 'presentation':
        afferentThreshold = 2;
        efferentThreshold = 5;
        break;
      default:
        afferentThreshold = 4;
        efferentThreshold = 4;
    }

    if (afferentCoupling > afferentThreshold && efferentCoupling > efferentThreshold) {
      return '🔴 CRÍTICO - Alto acoplamento bidirecional';
    }
    if (instability > 0.8 && layer === 'core') {
      return '🔴 CRÍTICO - Core muito instável';
    }
    if (afferentCoupling > afferentThreshold) {
      return '🟡 ATENÇÃO - Muitas dependências entrantes';
    }
    if (efferentCoupling > efferentThreshold) {
      return '🟡 ATENÇÃO - Muitas dependências saindo';
    }
    if (instability > 0.7) {
      return '🟨 MODERADO - Classe instável';
    }
    
    return '🟢 OK - Acoplamento adequado';
  }

  // Análise de coesão
  private async analyzeCohesion(sourceFile: SourceFile, filePath: string, fileName: string, layer: string): Promise<void> {
    sourceFile.getClasses().forEach(classDecl => {
      const className = classDecl.getName() || 'AnonymousClass';
      const methods = classDecl.getMethods();
      const properties = classDecl.getProperties();
      
      // LCOM4 - Lack of Cohesion of Methods
      const lcom4 = this.calculateLCOM4(methods, properties);
      
      // LCOM5 - Versão melhorada do LCOM4
      const lcom5 = this.calculateLCOM5(methods, properties, classDecl);
      
      // Tight Class Cohesion (TCC)
      const tightClassCohesion = this.calculateTCC(methods, properties);
      
      // Loose Class Cohesion (LCC)
      const looseClassCohesion = this.calculateLCC(methods, properties);
      
      // Score de coesão geral (0-1, onde 1 é máxima coesão)
      const cohesionScore = this.calculateOverallCohesionScore(lcom4, tightClassCohesion, methods.length);
      
      const cohesionMetric: CohesionMetric = {
        fileName,
        filePath,
        layer,
        className,
        lcom4,
        lcom5,
        methodCount: methods.length,
        fieldCount: properties.length,
        cohesionScore: Math.round(cohesionScore * 1000) / 1000,
        tightClassCohesion: Math.round(tightClassCohesion * 1000) / 1000,
        looseClassCohesion: Math.round(looseClassCohesion * 1000) / 1000,
        risk: this.assessCohesionRisk(cohesionScore, lcom4, methods.length, layer)
      };
      
      this.cohesionMetrics.push(cohesionMetric);
    });
  }

  // LCOM4 - Lack of Cohesion of Methods
  private calculateLCOM4(methods: MethodDeclaration[], properties: PropertyDeclaration[]): number {
    if (methods.length <= 1) return 0;

    const methodFieldUsage: Map<string, Set<string>> = new Map();
    
    // Mapear quais campos cada método usa
    methods.forEach(method => {
      const methodName = method.getName();
      const usedFields = new Set<string>();
      
      // Analisar o corpo do método para identificar uso de campos
      const methodBody = method.getBodyText() || '';
      properties.forEach(property => {
        const fieldName = property.getName();
        if (methodBody.includes(`this.${fieldName}`)) {
          usedFields.add(fieldName);
        }
      });
      
      methodFieldUsage.set(methodName, usedFields);
    });

    // Calcular componentes conectados
    const visited = new Set<string>();
    let components = 0;

    for (const methodName of methodFieldUsage.keys()) {
      if (!visited.has(methodName)) {
        this.dfsLCOM4(methodName, methodFieldUsage, visited);
        components++;
      }
    }

    return Math.max(0, components - 1);
  }

  private dfsLCOM4(methodName: string, methodFieldUsage: Map<string, Set<string>>, visited: Set<string>): void {
    visited.add(methodName);
    const currentFields = methodFieldUsage.get(methodName) || new Set();

    for (const [otherMethod, otherFields] of methodFieldUsage) {
      if (!visited.has(otherMethod)) {
        // Se compartilham pelo menos um campo, são conectados
        const hasSharedField = [...currentFields].some(field => otherFields.has(field));
        if (hasSharedField) {
          this.dfsLCOM4(otherMethod, methodFieldUsage, visited);
        }
      }
    }
  }

  // LCOM5 - Versão melhorada
  private calculateLCOM5(methods: MethodDeclaration[], properties: PropertyDeclaration[], classDecl: ClassDeclaration): number {
    if (methods.length <= 1) return 0;

    const methodCount = methods.length;
    const fieldCount = properties.length;
    
    if (fieldCount === 0) return 0;

    let totalFieldUsage = 0;
    
    methods.forEach(method => {
      const methodBody = method.getBodyText() || '';
      properties.forEach(property => {
        const fieldName = property.getName();
        if (methodBody.includes(`this.${fieldName}`)) {
          totalFieldUsage++;
        }
      });
    });

    const avgFieldUsage = totalFieldUsage / methodCount;
    const lcom5 = (avgFieldUsage - fieldCount) / (1 - fieldCount);
    
    return Math.max(0, Math.min(1, lcom5));
  }

  // Tight Class Cohesion
  private calculateTCC(methods: MethodDeclaration[], properties: PropertyDeclaration[]): number {
    if (methods.length <= 1) return 1;

    const methodNames = methods.map(m => m.getName());
    let directConnections = 0;
    const totalPossibleConnections = (methodNames.length * (methodNames.length - 1)) / 2;

    for (let i = 0; i < methods.length; i++) {
      for (let j = i + 1; j < methods.length; j++) {
        const method1Body = methods[i].getBodyText() || '';
        const method2Body = methods[j].getBodyText() || '';
        
        // Verificar se compartilham campos
        const shareFields = properties.some(property => {
          const fieldName = property.getName();
          return method1Body.includes(`this.${fieldName}`) && 
                 method2Body.includes(`this.${fieldName}`);
        });

        if (shareFields) {
          directConnections++;
        }
      }
    }

    return totalPossibleConnections === 0 ? 1 : directConnections / totalPossibleConnections;
  }

  // Loose Class Cohesion
  private calculateLCC(methods: MethodDeclaration[], properties: PropertyDeclaration[]): number {
    const tcc = this.calculateTCC(methods, properties);
    
    // Para simplicidade, assumimos que LCC >= TCC
    // Em uma implementação completa, calcularíamos conexões indiretas
    return Math.min(1, tcc * 1.2);
  }

  // Score geral de coesão
  private calculateOverallCohesionScore(lcom4: number, tcc: number, methodCount: number): number {
    if (methodCount <= 1) return 1;

    // Normalizar LCOM4 (quanto menor, melhor)
    const normalizedLCOM4 = Math.max(0, 1 - (lcom4 / methodCount));
    
    // Combinar métricas (TCC tem peso maior)
    return (normalizedLCOM4 * 0.3) + (tcc * 0.7);
  }

  // Avaliação de risco de coesão
  private assessCohesionRisk(cohesionScore: number, lcom4: number, methodCount: number, layer: string): string {
    if (methodCount <= 1) {
      return '🟢 OK - Classe simples';
    }

    if (cohesionScore < 0.3 || lcom4 > methodCount * 0.7) {
      return '🔴 CRÍTICO - Baixa coesão, considerar divisão';
    }
    if (cohesionScore < 0.5 || lcom4 > methodCount * 0.5) {
      return '🟡 ATENÇÃO - Coesão pode ser melhorada';
    }
    if (cohesionScore < 0.7) {
      return '🟨 MODERADO - Coesão aceitável';
    }
    
    return '🟢 OK - Boa coesão';
  }

  // Geração do relatório completo
  private generateReport(): ArchitectureReport {
    const timestamp = new Date().toISOString();
    
    // Análise por camadas
    const layerAnalysis = this.analyzeLayers();
    
    // Cálculos de resumo
    const totalFiles = [...new Set([
      ...this.complexityMetrics.map(m => m.filePath),
      ...this.couplingMetrics.map(m => m.filePath),
      ...this.cohesionMetrics.map(m => m.filePath)
    ])].length;
    
    const totalClasses = [...new Set(this.couplingMetrics.map(m => m.className))].length;
    const totalMethods = this.complexityMetrics.length;
    const totalLoc = this.complexityMetrics.reduce((sum, m) => sum + m.linesOfCode, 0);
    
    const avgComplexity = this.complexityMetrics.length > 0 ? 
      this.complexityMetrics.reduce((sum, m) => sum + m.cyclomaticComplexity, 0) / this.complexityMetrics.length : 0;
    
    const avgCoupling = this.couplingMetrics.length > 0 ?
      this.couplingMetrics.reduce((sum, m) => sum + (m.afferentCoupling + m.efferentCoupling), 0) / this.couplingMetrics.length : 0;
    
    const avgCohesion = this.cohesionMetrics.length > 0 ?
      this.cohesionMetrics.reduce((sum, m) => sum + m.cohesionScore, 0) / this.cohesionMetrics.length : 0;
    
    // Contar violações (itens com risco crítico ou atenção)
    const violations = [
      ...this.complexityMetrics.filter(m => m.risk.includes('CRÍTICO') || m.risk.includes('ATENÇÃO')),
      ...this.couplingMetrics.filter(m => m.risk.includes('CRÍTICO') || m.risk.includes('ATENÇÃO')),
      ...this.cohesionMetrics.filter(m => m.risk.includes('CRÍTICO') || m.risk.includes('ATENÇÃO'))
    ].length;

    // Gerar recomendações
    const recommendations = this.generateRecommendations();

    return {
      timestamp,
      architecture: 'Clean Architecture',
      framework: 'TypeScript/Node.js',
      summary: {
        totalFiles,
        totalClasses,
        totalMethods,
        totalLoc,
        avgComplexity: Math.round(avgComplexity * 100) / 100,
        avgCoupling: Math.round(avgCoupling * 100) / 100,
        avgCohesion: Math.round(avgCohesion * 100) / 100,
        violations
      },
      layers: layerAnalysis,
      complexityMetrics: this.complexityMetrics,
      couplingMetrics: this.couplingMetrics,
      cohesionMetrics: this.cohesionMetrics,
      recommendations,
      trends: this.analyzeTrends()
    };
  }

  // Análise por camadas
  private analyzeLayers(): { [key: string]: LayerAnalysis } {
    const layers: { [key: string]: LayerAnalysis } = {};
    
    // Agrupar por camada
    const layerGroups = this.groupByLayer();
    
    for (const [layerName, metrics] of Object.entries(layerGroups)) {
      const complexityMetrics = metrics.complexity;
      const couplingMetrics = metrics.coupling;
      const cohesionMetrics = metrics.cohesion;
      
      const files = [...new Set(complexityMetrics.map(m => m.filePath))].length;
      
      const avgComplexity = complexityMetrics.length > 0 ?
        complexityMetrics.reduce((sum, m) => sum + m.cyclomaticComplexity, 0) / complexityMetrics.length : 0;
      
      const maxComplexity = complexityMetrics.length > 0 ?
        Math.max(...complexityMetrics.map(m => m.cyclomaticComplexity)) : 0;
      
      const avgCoupling = couplingMetrics.length > 0 ?
        couplingMetrics.reduce((sum, m) => sum + (m.afferentCoupling + m.efferentCoupling), 0) / couplingMetrics.length : 0;
      
      const avgCohesion = cohesionMetrics.length > 0 ?
        cohesionMetrics.reduce((sum, m) => sum + m.cohesionScore, 0) / cohesionMetrics.length : 0;
      
      const violations = [
        ...complexityMetrics.filter(m => m.risk.includes('CRÍTICO') || m.risk.includes('ATENÇÃO')),
        ...couplingMetrics.filter(m => m.risk.includes('CRÍTICO') || m.risk.includes('ATENÇÃO')),
        ...cohesionMetrics.filter(m => m.risk.includes('CRÍTICO') || m.risk.includes('ATENÇÃO'))
      ].length;
      
      const totalLoc = complexityMetrics.reduce((sum, m) => sum + m.linesOfCode, 0);
      
      layers[layerName] = {
        name: layerName,
        files,
        avgComplexity: Math.round(avgComplexity * 100) / 100,
        maxComplexity,
        avgCoupling: Math.round(avgCoupling * 100) / 100,
        avgCohesion: Math.round(avgCohesion * 100) / 100,
        violations,
        totalLoc
      };
    }
    
    return layers;
  }

  // Agrupar métricas por camada
  private groupByLayer() {
    const groups: { [key: string]: { complexity: ComplexityMetric[], coupling: CouplingMetric[], cohesion: CohesionMetric[] } } = {};
    
    // Inicializar grupos
    const allLayers = [...new Set([
      ...this.complexityMetrics.map(m => m.layer),
      ...this.couplingMetrics.map(m => m.layer),
      ...this.cohesionMetrics.map(m => m.layer)
    ])];
    
    allLayers.forEach(layer => {
      groups[layer] = {
        complexity: this.complexityMetrics.filter(m => m.layer === layer),
        coupling: this.couplingMetrics.filter(m => m.layer === layer),
        cohesion: this.cohesionMetrics.filter(m => m.layer === layer)
      };
    });
    
    return groups;
  }

  // Gerar recomendações
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Análise de complexidade
    const criticalComplexity = this.complexityMetrics.filter(m => m.risk.includes('CRÍTICO'));
    if (criticalComplexity.length > 0) {
      recommendations.push(`🔴 URGENTE: ${criticalComplexity.length} métodos/funções com complexidade crítica precisam de refatoração imediata`);
      
      // Top 3 mais críticos
      const topCritical = criticalComplexity
        .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)
        .slice(0, 3);
      
      topCritical.forEach(metric => {
        recommendations.push(`   - ${metric.className || 'Global'}.${metric.methodName} (CC: ${metric.cyclomaticComplexity}, Cog: ${metric.cognitiveComplexity})`);
      });
    }
    
    // Análise de acoplamento
    const criticalCoupling = this.couplingMetrics.filter(m => m.risk.includes('CRÍTICO'));
    if (criticalCoupling.length > 0) {
      recommendations.push(`🔴 URGENTE: ${criticalCoupling.length} classes com acoplamento crítico`);
    }
    
    // Análise de coesão
    const criticalCohesion = this.cohesionMetrics.filter(m => m.risk.includes('CRÍTICO'));
    if (criticalCohesion.length > 0) {
      recommendations.push(`🔴 URGENTE: ${criticalCohesion.length} classes com baixa coesão - considerar divisão`);
    }
    
    // Análise por camadas
    const layerAnalysis = this.analyzeLayers();
    
    // Verificar violações de Clean Architecture
    if (layerAnalysis.core && layerAnalysis.core.avgCoupling > 3) {
      recommendations.push('🟡 ATENÇÃO: Camada Core com acoplamento alto - revisar dependências');
    }
    
    if (layerAnalysis.infrastructure && layerAnalysis.infrastructure.violations > layerAnalysis.infrastructure.files * 0.3) {
      recommendations.push('🟡 ATENÇÃO: Muitas violações na camada de Infraestrutura');
    }
    
    // Recomendações gerais
    const avgComplexity = this.complexityMetrics.reduce((sum, m) => sum + m.cyclomaticComplexity, 0) / this.complexityMetrics.length;
    if (avgComplexity > 8) {
      recommendations.push('🟨 MODERADO: Complexidade geral elevada - implementar práticas de refatoração contínua');
    }
    
    // Se tudo estiver bem
    if (recommendations.length === 0) {
      recommendations.push('🟢 EXCELENTE: Arquitetura está dentro dos padrões recomendados!');
    }
    
    return recommendations;
  }

  // Análise de tendências (simplificada)
  private analyzeTrends(): any {
    return {
      complexityTrend: 'stable', // Poderia comparar com análises anteriores
      couplingTrend: 'stable',
      cohesionTrend: 'stable',
      violationsTrend: 'stable'
    };
  }

    // Salvar relatórios
  private saveReports(report: ArchitectureReport): void {
    const reportsDir = './reports';
    
    // Criar diretório se não existir
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Relatório principal (JSON)
    const jsonReport = path.join(reportsDir, `architecture-analysis-${timestamp}.json`);
    fs.writeFileSync(jsonReport, JSON.stringify(report, null, 2));
    console.log(`📊 Relatório JSON salvo: ${jsonReport}`);
    
    // Relatório CSV - Complexidade
    const complexityCsv = this.generateComplexityCSV(report.complexityMetrics);
    const complexityCsvPath = path.join(reportsDir, `complexity-metrics-${timestamp}.csv`);
    fs.writeFileSync(complexityCsvPath, complexityCsv);
    console.log(`📈 Métricas de complexidade CSV: ${complexityCsvPath}`);
    
    // Relatório CSV - Acoplamento
    const couplingCsv = this.generateCouplingCSV(report.couplingMetrics);
    const couplingCsvPath = path.join(reportsDir, `coupling-metrics-${timestamp}.csv`);
    fs.writeFileSync(couplingCsvPath, couplingCsv);
    console.log(`🔗 Métricas de acoplamento CSV: ${couplingCsvPath}`);
    
    // Relatório CSV - Coesão
    const cohesionCsv = this.generateCohesionCSV(report.cohesionMetrics);
    const cohesionCsvPath = path.join(reportsDir, `cohesion-metrics-${timestamp}.csv`);
    fs.writeFileSync(cohesionCsvPath, cohesionCsv);
    console.log(`🎯 Métricas de coesão CSV: ${cohesionCsvPath}`);
    
    // Relatório HTML resumido
    const htmlReport = this.generateHTMLSummary(report);
    const htmlPath = path.join(reportsDir, `architecture-summary-${timestamp}.html`);
    fs.writeFileSync(htmlPath, htmlReport);
    console.log(`🌐 Resumo HTML: ${htmlPath}`);
  }

  // Gerar CSV de complexidade
  private generateComplexityCSV(metrics: ComplexityMetric[]): string {
    const headers = [
      'File Name', 'File Path', 'Layer', 'Class Name', 'Method Name', 'Component Type',
      'Cyclomatic Complexity', 'Cognitive Complexity', 'Lines of Code', 'Parameters',
      'Nesting Depth', 'Maintainability Index', 'Risk Assessment'
    ];
    
    const rows = metrics.map(metric => [
      metric.fileName,
      metric.filePath,
      metric.layer,
      metric.className || '',
      metric.methodName,
      metric.type,
      metric.cyclomaticComplexity.toString(),
      metric.cognitiveComplexity.toString(),
      metric.linesOfCode.toString(),
      metric.parameters.toString(),
      metric.nestingDepth.toString(),
      metric.maintainabilityIndex.toString(),
      metric.risk
    ]);
    
    return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
  }

  // Gerar CSV de acoplamento
  private generateCouplingCSV(metrics: CouplingMetric[]): string {
    const headers = [
      'File Name', 'File Path', 'Layer', 'Class Name',
      'Afferent Coupling', 'Efferent Coupling', 'Instability', 'Abstractness',
      'Distance', 'Risk Assessment'
    ];
    
    const rows = metrics.map(metric => [
      metric.fileName,
      metric.filePath,
      metric.layer,
      metric.className,
      metric.afferentCoupling.toString(),
      metric.efferentCoupling.toString(),
      metric.instability.toString(),
      metric.abstractness.toString(),
      metric.distance.toString(),
      metric.risk
    ]);
    
    return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
  }

  // Gerar CSV de coesão
  private generateCohesionCSV(metrics: CohesionMetric[]): string {
    const headers = [
      'File Name', 'File Path', 'Layer', 'Class Name',
      'LCOM4', 'LCOM5', 'Method Count', 'Field Count',
      'Cohesion Score', 'Tight Class Cohesion', 'Loose Class Cohesion', 'Risk Assessment'
    ];
    
    const rows = metrics.map(metric => [
      metric.fileName,
      metric.filePath,
      metric.layer,
      metric.className,
      metric.lcom4.toString(),
      metric.lcom5.toString(),
      metric.methodCount.toString(),
      metric.fieldCount.toString(),
      metric.cohesionScore.toString(),
      metric.tightClassCohesion.toString(),
      metric.looseClassCohesion.toString(),
      metric.risk
    ]);
    
    return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
  }

  // Gerar relatório HTML resumido
  private generateHTMLSummary(report: ArchitectureReport): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Análise de Arquitetura - ${report.timestamp}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 3px solid #007acc; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007acc; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007acc; }
        .metric-label { color: #666; margin-top: 5px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
        .layers-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .layer-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: #fff; }
        .layer-title { font-weight: bold; color: #007acc; font-size: 1.2em; margin-bottom: 10px; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; }
        .recommendations ul { margin: 0; padding-left: 20px; }
        .recommendations li { margin-bottom: 8px; }
        .risk-critical { color: #dc3545; }
        .risk-attention { color: #ffc107; }
        .risk-moderate { color: #17a2b8; }
        .risk-ok { color: #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Análise de Arquitetura</h1>
            <p><strong>Timestamp:</strong> ${report.timestamp}</p>
            <p><strong>Arquitetura:</strong> ${report.architecture} | <strong>Framework:</strong> ${report.framework}</p>
        </div>
        
        <div class="summary">
            <div class="metric-card">
                <div class="metric-value">${report.summary.totalFiles}</div>
                <div class="metric-label">Arquivos Total</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.summary.totalClasses}</div>
                <div class="metric-label">Classes Total</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.summary.totalMethods}</div>
                <div class="metric-label">Métodos Total</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.summary.totalLoc}</div>
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

        <div class="section">
            <h2>🏗️ Análise por Camadas</h2>
            <div class="layers-grid">
                ${Object.values(report.layers).map(layer => `
                    <div class="layer-card">
                        <div class="layer-title">${layer.name.toUpperCase()}</div>
                        <p><strong>Arquivos:</strong> ${layer.files}</p>
                        <p><strong>Complexidade Média:</strong> ${layer.avgComplexity}</p>
                        <p><strong>Complexidade Máxima:</strong> ${layer.maxComplexity}</p>
                        <p><strong>Acoplamento Médio:</strong> ${layer.avgCoupling}</p>
                        <p><strong>Coesão Média:</strong> ${layer.avgCohesion}</p>
                        <p><strong>Violações:</strong> ${layer.violations}</p>
                        <p><strong>LOC Total:</strong> ${layer.totalLoc}</p>
                    </div>
                `).join('')}
            </div>
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
            <h2>🎯 Top 10 Métodos Mais Complexos</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Classe.Método</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">CC</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Cog</th>
                        <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">LOC</th>
                        <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Risco</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.complexityMetrics
                      .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)
                      .slice(0, 10)
                      .map(metric => `
                        <tr>
                            <td style="padding: 8px; border: 1px solid #dee2e6;">${metric.className || 'Global'}.${metric.methodName}</td>
                            <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">${metric.cyclomaticComplexity}</td>
                            <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">${metric.cognitiveComplexity}</td>
                            <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">${metric.linesOfCode}</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;" class="${this.getRiskClass(metric.risk)}">${metric.risk}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;
  }

  // Método auxiliar para classes CSS de risco
  private getRiskClass(risk: string): string {
    if (risk.includes('CRÍTICO')) return 'risk-critical';
    if (risk.includes('ATENÇÃO')) return 'risk-attention';
    if (risk.includes('MODERADO')) return 'risk-moderate';
    return 'risk-ok';
  }

  // Exibir resumo no console
  private displaySummary(report: ArchitectureReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO DA ANÁLISE DE ARQUITETURA');
    console.log('='.repeat(80));
    
    console.log(`\n🗂️  ESTATÍSTICAS GERAIS:`);
    console.log(`   📁 Arquivos analisados: ${report.summary.totalFiles}`);
    console.log(`   🏛️  Classes encontradas: ${report.summary.totalClasses}`);
    console.log(`   ⚙️  Métodos analisados: ${report.summary.totalMethods}`);
    console.log(`   📝 Linhas de código: ${report.summary.totalLoc.toLocaleString()}`);
    console.log(`   🔢 Complexidade média: ${report.summary.avgComplexity}`);
    console.log(`   ⚠️  Violações encontradas: ${report.summary.violations}`);
    
    console.log(`\n🏗️  ANÁLISE POR CAMADAS:`);
    Object.values(report.layers).forEach(layer => {
      const statusIcon = layer.violations === 0 ? '🟢' : layer.violations > layer.files * 0.5 ? '🔴' : '🟡';
      console.log(`   ${statusIcon} ${layer.name.toUpperCase()}: ${layer.files} arquivos, ${layer.violations} violações`);
    });
    
    console.log(`\n🎯 TOP 5 MAIORES COMPLEXIDADES:`);
    report.complexityMetrics
      .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)
      .slice(0, 5)
      .forEach((metric, index) => {
        const icon = metric.risk.includes('CRÍTICO') ? '🔴' : metric.risk.includes('ATENÇÃO') ? '🟡' : '🟨';
        console.log(`   ${index + 1}. ${icon} ${metric.className || 'Global'}.${metric.methodName} (CC: ${metric.cyclomaticComplexity}, Cog: ${metric.cognitiveComplexity})`);
      });
    
    console.log(`\n💡 PRINCIPAIS RECOMENDAÇÕES:`);
    report.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Análise concluída! Verifique os arquivos de relatório gerados.');
    console.log('='.repeat(80) + '\n');
  }
}

// Função principal para executar a análise
export async function runArchitectureAnalysis(tsConfigPath?: string): Promise<ArchitectureReport> {
  const analyzer = new ArchitectureAnalyzer(tsConfigPath);
  return await analyzer.analyzeAll();
}

// Executar se chamado diretamente
if (require.main === module) {
  runArchitectureAnalysis()
    .then(() => {
      console.log('🎉 Análise de arquitetura executada com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro durante a análise:', error);
      process.exit(1);
    });
}

