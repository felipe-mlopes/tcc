import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métricas customizadas
const errorRate = new Rate('errors');

// Configuração do teste
export const options = {
  stages: [
    { duration: '1m', target: 10 }, // Ramp-up para 10 usuários
    { duration: '3m', target: 10 }, // Mantém 10 usuários por 3 minutos
    { duration: '1m', target: 0 },  // Ramp-down para 0 usuários
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% das requests devem ser < 2s
    errors: ['rate<0.1'], // Taxa de erro deve ser < 10%
  },
};

// URL base da API
const BASE_URL = 'http://localhost:3000/api';

// Cabeçalhos padrão
const headers = {
  'Content-Type': 'application/json',
};

export default function () {
  // Dados únicos para cada iteração
  const timestamp = Date.now();
  const userId = `user_${__VU}_${timestamp}`;
  
  console.log(`🚀 Iniciando teste para VU: ${__VU}, Iteração: ${__ITER}`);

  // BLOCO 1: Registrar um ativo
  console.log('📊 Bloco 1: Criando ativo...');
  const assetData = {
    symbol: `TEST${timestamp}`,
    name: `Test Asset ${timestamp}`,
    assetType: 'Stock',
    sector: 'Technology',
    exchange: 'NASDAQ',
    currency: 'USD'
  };

  const createAssetResponse = http.post(
    `${BASE_URL}/asset`,
    JSON.stringify(assetData),
    { headers }
  );

  const assetSuccess = check(createAssetResponse, {
    'Asset created successfully': (r) => r.status === 201,
    'Asset response has success field': (r) => JSON.parse(r.body).success === true,
  });

  if (!assetSuccess) {
    console.error(`❌ Falha ao criar ativo: ${createAssetResponse.status} - ${createAssetResponse.body}`);
    errorRate.add(1);
    return;
  }

  // Extrai o ID do ativo do header Location
  const assetLocation = createAssetResponse.headers['Location'];
  const assetId = assetLocation ? assetLocation.split('/').pop() : null;

  if (!assetId) {
    console.error('❌ Não foi possível extrair o ID do ativo');
    errorRate.add(1);
    return;
  }

  console.log(`✅ Ativo criado com sucesso. ID: ${assetId}`);
  sleep(0.5);

  // BLOCO 2: Registrar um investidor
  console.log('👤 Bloco 2: Criando investidor...');
  const investorData = {
    email: `${userId}@test.com`,
    name: `Test User ${userId}`,
    cpf: generateCPF(),
    dateOfBirth: '1990-01-01',
    password: 'TestPassword123!'
  };

  const registerResponse = http.post(
    `${BASE_URL}/investor`,
    JSON.stringify(investorData),
    { headers }
  );

  const registerSuccess = check(registerResponse, {
    'Investor registered successfully': (r) => r.status === 201,
    'Register response has success field': (r) => JSON.parse(r.body).success === true,
  });

  if (!registerSuccess) {
    console.error(`❌ Falha ao registrar investidor: ${registerResponse.status} - ${registerResponse.body}`);
    errorRate.add(1);
    return;
  }

  console.log('✅ Investidor criado com sucesso');
  sleep(0.5);

  // BLOCO 3: Autenticar o investidor
  console.log('🔐 Bloco 3: Autenticando investidor...');
  const authData = {
    email: investorData.email,
    password: investorData.password
  };

  const authResponse = http.post(
    `${BASE_URL}/investor/auth`,
    JSON.stringify(authData),
    { headers }
  );

  const authSuccess = check(authResponse, {
    'Authentication successful': (r) => r.status === 200,
    'Auth response has access token': (r) => {
      const body = JSON.parse(r.body);
      return body.success === true && body.accessToken;
    },
  });

  if (!authSuccess) {
    console.error(`❌ Falha na autenticação: ${authResponse.status} - ${authResponse.body}`);
    errorRate.add(1);
    return;
  }

  const authBody = JSON.parse(authResponse.body);
  const accessToken = authBody.accessToken;

  // Adiciona o token aos headers para as próximas requisições
  const authHeaders = {
    ...headers,
    'Authorization': `Bearer ${accessToken}`
  };

  console.log('✅ Autenticação realizada com sucesso');
  sleep(0.5);

  // BLOCO 4: Criar um portfólio
  console.log('📁 Bloco 4: Criando portfólio...');
  const portfolioData = {
    name: `Portfolio ${userId}`,
    description: `Portfolio de teste para ${userId}`
  };

  const portfolioResponse = http.post(
    `${BASE_URL}/portfolio`,
    JSON.stringify(portfolioData),
    { headers: authHeaders }
  );

  const portfolioSuccess = check(portfolioResponse, {
    'Portfolio created successfully': (r) => r.status === 201,
    'Portfolio response has success field': (r) => JSON.parse(r.body).success === true,
  });

  if (!portfolioSuccess) {
    console.error(`❌ Falha ao criar portfólio: ${portfolioResponse.status} - ${portfolioResponse.body}`);
    errorRate.add(1);
    return;
  }

  console.log('✅ Portfólio criado com sucesso');
  sleep(0.5);

  // BLOCO 5: Adicionar investimento ao portfólio
  console.log('💰 Bloco 5: Adicionando investimento...');
  const investmentData = {
    quantity: 100,
    currentPrice: 25.50
  };

  const investmentResponse = http.post(
    `${BASE_URL}/portfolio/investment/${assetId}`,
    JSON.stringify(investmentData),
    { headers: authHeaders }
  );

  const investmentSuccess = check(investmentResponse, {
    'Investment added successfully': (r) => r.status === 201,
    'Investment response has success field': (r) => JSON.parse(r.body).success === true,
  });

  if (!investmentSuccess) {
    console.error(`❌ Falha ao adicionar investimento: ${investmentResponse.status} - ${investmentResponse.body}`);
    errorRate.add(1);
    return;
  }

  console.log('✅ Investimento adicionado com sucesso');
  sleep(0.5);

  // BLOCO 6: Criar transação de compra
  console.log('💸 Bloco 6: Criando transação de compra...');
  const transactionData = {
    quantity: 50,
    price: 25.00,
    fees: 2.50,
    dateAt: new Date().toISOString()
  };

  const buyTransactionResponse = http.post(
    `${BASE_URL}/transactions/buy/${assetId}`,
    JSON.stringify(transactionData),
    { headers: authHeaders }
  );

  const buyTransactionSuccess = check(buyTransactionResponse, {
    'Buy transaction created successfully': (r) => r.status === 201,
    'Transaction response has success field': (r) => JSON.parse(r.body).success === true,
  });

  if (!buyTransactionSuccess) {
    console.error(`❌ Falha ao criar transação de compra: ${buyTransactionResponse.status} - ${buyTransactionResponse.body}`);
    errorRate.add(1);
    return;
  }

  // Extrai o ID da transação do header Location
  const transactionLocation = buyTransactionResponse.headers['Location'];
  const transactionId = transactionLocation ? transactionLocation.split('/').pop() : null;

  if (!transactionId) {
    console.error('❌ Não foi possível extrair o ID da transação');
    errorRate.add(1);
    return;
  }

  console.log(`✅ Transação de compra criada com sucesso. ID: ${transactionId}`);
  sleep(0.5);

  // BLOCO 7: Atualizar investimento após transação
  console.log('🔄 Bloco 7: Atualizando investimento após transação...');
  const updateInvestmentResponse = http.patch(
    `${BASE_URL}/portfolio/investment/${transactionId}/update`,
    '',
    { headers: authHeaders }
  );

  const updateInvestmentSuccess = check(updateInvestmentResponse, {
    'Investment updated successfully': (r) => r.status === 200,
    'Update response has success field': (r) => JSON.parse(r.body).success === true,
  });

  if (!updateInvestmentSuccess) {
    console.error(`❌ Falha ao atualizar investimento: ${updateInvestmentResponse.status} - ${updateInvestmentResponse.body}`);
    errorRate.add(1);
    return;
  }

  console.log('✅ Investimento atualizado com sucesso');
  sleep(0.5);

  // BLOCO 8: Listar investimentos do portfólio
  console.log('📋 Bloco 8: Listando investimentos...');
  const listInvestmentsResponse = http.get(
    `${BASE_URL}/portfolio/investments?page=1&limit=10`,
    { headers: authHeaders }
  );

  const listInvestmentsSuccess = check(listInvestmentsResponse, {
    'Investments listed successfully': (r) => r.status === 200,
    'List response has success field': (r) => JSON.parse(r.body).success === true,
    'List response has data': (r) => {
      const body = JSON.parse(r.body);
      return body.data && Array.isArray(body.data.investments);
    },
  });

  if (!listInvestmentsSuccess) {
    console.error(`❌ Falha ao listar investimentos: ${listInvestmentsResponse.status} - ${listInvestmentsResponse.body}`);
    errorRate.add(1);
    return;
  }

  const investmentsList = JSON.parse(listInvestmentsResponse.body);
  console.log(`✅ Investimentos listados com sucesso. Total: ${investmentsList.data.total}`);

  // Marca como sucesso se chegou até aqui
  errorRate.add(0);
  
  console.log(`🎉 Fluxo completo executado com sucesso para VU: ${__VU}`);
  
  // Pausa entre iterações
  sleep(1);
}

// Função para setup do teste (executada uma vez)
export function setup() {
  console.log('🏗️  Configurando ambiente de teste...');
  
  // Verifica se a API está respondendo
  const healthCheck = http.get(`${BASE_URL.replace('/api', '')}/health`);
  
  if (healthCheck.status !== 200) {
    throw new Error(`API não está respondendo. Status: ${healthCheck.status}`);
  }
  
  console.log('✅ API está funcionando, iniciando teste de performance...');
  
  return {
    baseUrl: BASE_URL,
    startTime: new Date().toISOString()
  };
}

// CPF generator for Brazilian tax ID
function generateCPF() {
  const digits = [];
  for (let i = 0; i < 9; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }

  // First verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  digits.push(sum % 11 < 2 ? 0 : 11 - (sum % 11));

  // Second verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * (11 - i);
  }
  digits.push(sum % 11 < 2 ? 0 : 11 - (sum % 11));

  return digits.join('').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Função para teardown do teste (executada uma vez no final)
export function teardown(data) {
  console.log('🧹 Finalizando teste...');
  console.log(`📊 Teste iniciado em: ${data.startTime}`);
  console.log(`📊 Teste finalizado em: ${new Date().toISOString()}`);
  console.log('✅ Teste de performance concluído!');
}