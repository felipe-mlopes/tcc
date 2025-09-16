#!/usr/bin/env node
const fs = require('fs');

class DependencyCruiserCouplingAnalyzer {
  constructor() {
    this.modules = new Map();
    this.layers = {
      core: { files: [], totalCa: 0, avgCa: 0 },
      domain: { files: [], totalCa: 0, avgCa: 0 },
      infra: { files: [], totalCa: 0, avgCa: 0 },
      presentation: { files: [], totalCa: 0, avgCa: 0 }
    };
  }

  // Identifica a camada baseada no path
  identifyLayer(filePath) {
    const normalizedPath = filePath.toLowerCase();
    
    if (normalizedPath.includes('/core/')) return 'core';
    if (normalizedPath.includes('/domain/')) return 'domain';
    if (normalizedPath.includes('/infra/')) return 'infra';
    if (normalizedPath.includes('/controller') || 
        normalizedPath.includes('/presenter')) return 'presentation';
    
    return 'other';
  }

  // Identifica o tipo do arquivo
  identifyFileType(filePath) {
    const fileName = filePath.toLowerCase();
    
    if (fileName.includes('entity')) return 'ENTITY';
    if (fileName.includes('repository')) return 'REPOSITORY';
    if (fileName.includes('service') && fileName.includes('/core/')) return 'USE_CASE';
    if (fileName.includes('controller')) return 'CONTROLLER';
    if (fileName.includes('module')) return 'MODULE';
    if (fileName.includes('guard')) return 'GUARD';
    if (fileName.includes('interceptor')) return 'INTERCEPTOR';
    if (fileName.includes('dto')) return 'DTO';
    if (fileName.includes('types')) return 'TYPES';
    if (fileName.includes('service') && fileName.includes('/domain/')) return 'DOMAIN_SERVICE';
    if (fileName.includes('service') && fileName.includes('/infra/')) return 'INFRA_SERVICE';
    if (fileName.includes('database')) return 'DATABASE';
    if (fileName.includes('http')) return 'HTTP_CLIENT';
    if (fileName.includes('auth')) return 'AUTH';
    if (fileName.includes('cryptography')) return 'CRYPTO';
    
    return 'OTHER';
  }

  // Calcula acoplamento aferente baseado na saída do dependency-cruiser
  calculateAfferentCoupling(cruiserData) {
    const dependencyMap = new Map();
    const afferentCoupling = new Map();

    // Inicializa o mapa de dependências
    cruiserData.modules.forEach(module => {
      const modulePath = module.source;
      dependencyMap.set(modulePath, module.dependencies || []);
      afferentCoupling.set(modulePath, 0);
    });

    // Calcula acoplamento aferente
    cruiserData.modules.forEach(module => {
      const modulePath = module.source;
      const dependencies = module.dependencies || [];
      
      dependencies.forEach(dep => {
        const depPath = dep.resolved;
        if (afferentCoupling.has(depPath)) {
          const currentCount = afferentCoupling.get(depPath);
          afferentCoupling.set(depPath, currentCount + 1);
        }
      });
    });

    return afferentCoupling;
  }

  // Processa os dados do dependency-cruiser
  processData(cruiserData) {
    const afferentCoupling = this.calculateAfferentCoupling(cruiserData);
    const results = [];

    cruiserData.modules.forEach(module => {
      const modulePath = module.source;
      const ca = afferentCoupling.get(modulePath) || 0;
      const ce = (module.dependencies || []).length;
      const instability = (ca + ce) === 0 ? 0 : ce / (ca + ce);
      
      const layer = this.identifyLayer(modulePath);
      const fileType = this.identifyFileType(modulePath);
      
      const moduleData = {
        path: modulePath,
        layer,
        type: fileType,
        afferentCoupling: ca,
        efferentCoupling: ce,
        instability: Math.round(instability * 100) / 100,
        violations: module.violations || [],
        dependencies: (module.dependencies || []).map(dep => dep.resolved),
        risk: this.assessRisk(layer, fileType, ca, ce)
      };

      results.push(moduleData);
      
      // Adiciona às camadas
      if (this.layers[layer]) {
        this.layers[layer].files.push(moduleData);
        this.layers[layer].totalCa += ca;
      }
    });

    // Calcula médias por camada
    Object.keys(this.layers).forEach(layerName => {
      const layer = this.layers[layerName];
      if (layer.files.length > 0) {
        layer.avgCa = Math.round((layer.totalCa / layer.files.length) * 10) / 10;
      }
    });

    return results.sort((a, b) => b.afferentCoupling - a.afferentCoupling);
  }

  // Avalia o risco baseado na camada e tipo
  assessRisk(layer, fileType, ca, ce) {
    switch (layer) {
      case 'core':
        if (fileType === 'ENTITY' && ca > 8) return '🔴 CRÍTICO - Entity muito acoplada';
        if (fileType === 'USE_CASE' && ca > 5) return '🟡 ATENÇÃO - Use Case muito usado';
        if (fileType === 'REPOSITORY' && ca > 3) return '🟡 ATENÇÃO - Interface Repository muito acoplada';
        return '🟢 OK - Core bem isolado';
        
      case 'domain':
        if (ca > 6) return '🟡 ATENÇÃO - Domain Service muito usado';
        return '🟢 OK - Domain adequado';
        
      case 'infra':
        if (fileType === 'CONTROLLER' && ca > 2) return '🟡 ATENÇÃO - Controller com dependências internas';
        if (fileType === 'DATABASE' && ca > 10) return '🔴 CRÍTICO - Database service muito acoplado';
        if (fileType === 'MODULE' && ca > 8) return '🟡 ATENÇÃO - Módulo NestJS central';
        return '🟢 OK - Infrastructure normal';
        
      case 'presentation':
        if (ca > 2) return '🟡 ATENÇÃO - Presentation com acoplamento alto';
        return '🟢 OK - Presentation adequada';
        
      default:
        if (ca > 5) return '🟡 ATENÇÃO - Componente muito acoplado';
        return '🟢 OK - Acoplamento adequado';
    }
  }

  // Gera relatório detalhado
  generateReport(results) {
    console.log('\n🏗️  ANÁLISE DE ACOPLAMENTO AFERENTE - CLEAN ARCHITECTURE + NESTJS');
    console.log(''.padEnd(80, '═'));
    
    console.log('\n📊 RESUMO POR CAMADAS:');
    console.log(''.padEnd(60, '─'));
    
    Object.entries(this.layers).forEach(([layerName, layer]) => {
      if (layer.files.length > 0) {
        const maxCa = Math.max(...layer.files.map(f => f.afferentCoupling));
        const highCouplingCount = layer.files.filter(f => f.afferentCoupling > 5).length;
        const violationsCount = layer.files.reduce((sum, f) => sum + f.violations.length, 0);
        
        console.log(`\n🏛️  ${layerName.toUpperCase()}:`);
        console.log(`   Arquivos: ${layer.files.length}`);
        console.log(`   Ca médio: ${layer.avgCa} | Ca máximo: ${maxCa}`);
        console.log(`   Alto acoplamento (Ca > 5): ${highCouplingCount}`);
        console.log(`   Violações de regra: ${violationsCount}`);
      }
    });

    console.log('\n🔝 TOP 15 - MAIOR ACOPLAMENTO AFERENTE:');
    console.log(''.padEnd(80, '─'));
    
    results.slice(0, 15).forEach((result, index) => {
      const fileName = result.path.split('/').pop();
      const layerEmoji = this.getLayerEmoji(result.layer);
      
      console.log(`${index + 1}. ${layerEmoji} ${fileName} (${result.type})`);
      console.log(`   📁 ${result.path}`);
      console.log(`   📈 Ca: ${result.afferentCoupling} | Ce: ${result.efferentCoupling} | I: ${result.instability}`);
      console.log(`   ${result.risk}`);
      
      if (result.violations.length > 0) {
        console.log(`   ⚠️  Violações: ${result.violations.length}`);
        result.violations.slice(0, 2).forEach(violation => {
          console.log(`      - ${violation.rule.name}: ${violation.rule.comment}`);
        });
      }
      console.log('');
    });

    // Análise de violações de Clean Architecture
    this.analyzeCleanArchViolations(results);
  }

  getLayerEmoji(layer) {
    const emojis = {
      core: '🟢',
      domain: '🟡', 
      infra: '🔴',
      presentation: '🔵'
    };
    return emojis[layer] || '⚪';
  }

  analyzeCleanArchViolations(results) {
    console.log('\n🚨 VIOLAÇÕES DE CLEAN ARCHITECTURE:');
    console.log(''.padEnd(60, '─'));
    
    const violations = results.filter(r => r.violations.length > 0);
    
    if (violations.length === 0) {
      console.log('✅ Nenhuma violação encontrada!');
      return;
    }

    const violationsByType = {};
    violations.forEach(module => {
      module.violations.forEach(violation => {
        const ruleName = violation.rule.name;
        if (!violationsByType[ruleName]) {
          violationsByType[ruleName] = [];
        }
        violationsByType[ruleName].push({
          module: module.path,
          to: violation.to
        });
      });
    });

    Object.entries(violationsByType).forEach(([ruleName, ruleViolations]) => {
      console.log(`\n❌ ${ruleName} (${ruleViolations.length} violações):`);
      ruleViolations.slice(0, 5).forEach(violation => {
        console.log(`   ${violation.module} → ${violation.to}`);
      });
      if (ruleViolations.length > 5) {
        console.log(`   ... e mais ${ruleViolations.length - 5} violações`);
      }
    });
  }

  // Exporta resultados para JSON
  exportResults(results, filename = 'coupling-analysis-results.json') {
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: results.length,
        layers: Object.entries(this.layers).reduce((acc, [name, layer]) => {
          acc[name] = {
            fileCount: layer.files.length,
            avgAfferentCoupling: layer.avgCa,
            maxAfferentCoupling: layer.files.length > 0 ? Math.max(...layer.files.map(f => f.afferentCoupling)) : 0
          };
          return acc;
        }, {}),
        totalViolations: results.reduce((sum, r) => sum + r.violations.length, 0)
      },
      results: results
    };

    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Resultados exportados para: ${filename}`);
  }
}

// Execução principal
function main() {
  let inputData = '';
  
  // Se executado via pipe (npm run analyze:metrics)
  if (!process.stdin.isTTY) {
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (chunk) => {
      inputData += chunk;
    });
    
    process.stdin.on('end', () => {
      try {
        const cruiserData = JSON.parse(inputData);
        const analyzer = new DependencyCruiserCouplingAnalyzer();
        const results = analyzer.processData(cruiserData);
        analyzer.generateReport(results);
        analyzer.exportResults(results);
      } catch (error) {
        console.error('❌ Erro ao processar dados:', error.message);
        process.exit(1);
      }
    });
  } 
  // Se executado com arquivo como argumento
  else if (process.argv[2]) {
    const inputFile = process.argv[2];
    try {
      const data = fs.readFileSync(inputFile, 'utf8');
      const cruiserData = JSON.parse(data);
      const analyzer = new DependencyCruiserCouplingAnalyzer();
      const results = analyzer.processData(cruiserData);
      analyzer.generateReport(results);
      analyzer.exportResults(results);
    } catch (error) {
      console.error(`❌ Erro ao ler arquivo ${inputFile}:`, error.message);
      process.exit(1);
    }
  }
  // Instruções de uso
  else {
    console.log('📖 USO:');
    console.log('   Via pipe: npm run analyze:metrics');
    console.log('   Via arquivo: node analyze-coupling.js dependency-analysis.json');
  }
}

if (require.main === module) {
  main();
}

module.exports = DependencyCruiserCouplingAnalyzer;