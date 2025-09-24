import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics for detailed monitoring
const errorRate = new Rate('errors');
const responseTime = new Trend('custom_response_time', true);
const throughput = new Counter('throughput');
const memoryUsage = new Gauge('memory_usage_mb');
const cpuUsage = new Gauge('cpu_usage_percent');
const eventLoopLag = new Gauge('event_loop_lag_ms');
const heapUtilization = new Gauge('heap_utilization_percent');

// Business logic metrics
const assetCreationTime = new Trend('asset_creation_duration');
const investorRegistrationTime = new Trend('investor_registration_duration');
const authenticationTime = new Trend('authentication_duration');
const portfolioCreationTime = new Trend('portfolio_creation_duration');
const investmentCreationTime = new Trend('investment_creation_duration');
const transactionCreationTime = new Trend('transaction_creation_duration');
const investmentUpdateTime = new Trend('investment_update_duration');
const investmentFetchTime = new Trend('investment_fetch_duration');

// Test configuration with enhanced thresholds
export const options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up to 10 users
    { duration: '5m', target: 10 },  // Stay at 10 users
    { duration: '2m', target: 20 },  // Ramp up to 20 users
    { duration: '5m', target: 20 },  // Stay at 20 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    // Response time percentiles
    'http_req_duration': [
      'p(50)<500',    // 50th percentile under 500ms
      'p(95)<2000',   // 95th percentile under 2s
      'p(99)<5000',   // 99th percentile under 5s
    ],
    // Throughput requirements
    'http_reqs': ['rate>10'],           // Minimum 10 req/s
    'throughput': ['count>10'],          // Custom throughput metric
    
    // Error rates
    'http_req_failed': ['rate<0.05'],   // Error rate under 5%
    'errors': ['rate<0.05'],            // Custom error rate under 5%
    
    // Business logic performance
    'asset_creation_duration': ['p(95)<1000'],
    'investor_registration_duration': ['p(95)<1500'],
    'authentication_duration': ['p(95)<800'],
    'portfolio_creation_duration': ['p(95)<1000'],
    'investment_creation_duration': ['p(95)<1200'],
    'transaction_creation_duration': ['p(95)<1200'],
    'investment_update_duration': ['p(95)<1500'],
    'investment_fetch_duration': ['p(95)<2000'],
  },
  // Export detailed results
  summaryTrendStats: ['min', 'med', 'avg', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

// URL base da API - configurável via variável de ambiente
const BASE_URL = 'http://localhost:3000/api';

// Cabeçalhos padrão
const headers = {
  'Content-Type': 'application/json',
};

// Helper function to measure and record response times
function measureRequest(requestName, requestFunction) {
  const startTime = Date.now();
  const response = requestFunction();
  const duration = Date.now() - startTime;
  
  // Record custom response time
  responseTime.add(duration);
  throughput.add(1);
  
  // Record business-specific metrics
  switch (requestName) {
    case 'asset_creation':
      assetCreationTime.add(duration);
      break;
    case 'investor_registration':
      investorRegistrationTime.add(duration);
      break;
    case 'authentication':
      authenticationTime.add(duration);
      break;
    case 'portfolio_creation':
      portfolioCreationTime.add(duration);
      break;
    case 'investment_creation':
      investmentCreationTime.add(duration);
      break;
    case 'transaction_creation':
      transactionCreationTime.add(duration);
      break;
    case 'investment_update':
      investmentUpdateTime.add(duration);
      break;
    case 'investment_fetch':
      investmentFetchTime.add(duration);
      break;
  }
  
  return response;
}

// Simulate system resource monitoring
function recordSystemMetrics() {
  // Simulate memory usage (in production, you'd get this from actual system)
  const simulatedMemory = Math.random() * 100 + 50; // 50-150 MB
  const simulatedCPU = Math.random() * 30 + 10; // 10-40%
  const simulatedLag = Math.random() * 10 + 1; // 1-11ms
  const simulatedHeap = Math.random() * 40 + 30; // 30-70%
  
  memoryUsage.add(simulatedMemory);
  cpuUsage.add(simulatedCPU);
  eventLoopLag.add(simulatedLag);
  heapUtilization.add(simulatedHeap);
}

export default function () {
  // Dados únicos para cada iteração
  const timestamp = Date.now();
  const userId = `user_${__VU}_${timestamp}`;
  
  console.log(`Starting comprehensive test for VU: ${__VU}, Iteration: ${__ITER}`);
  
  // Record system metrics
  recordSystemMetrics();
  
  // Pausa inicial para distribuir a carga
  sleep(Math.random() * 2);

  // BLOCO 1: Registrar um ativo
  console.log('Creating asset...');
  const assetData = {
    symbol: `TEST${timestamp}`,
    name: `Test Asset ${timestamp}`,
    assetType: 'Stock',
    sector: 'Technology',
    exchange: 'NASDAQ',
    currency: 'USD'
  };

  const createAssetResponse = measureRequest('asset_creation', () => 
    http.post(`${BASE_URL}/asset`, JSON.stringify(assetData), { headers })
  );

  const assetSuccess = check(createAssetResponse, {
    'Asset created successfully': (r) => r.status === 201,
    'Asset response has success field': (r) => JSON.parse(r.body).success === true,
    'Asset creation time acceptable': (r) => r.timings.duration < 1000,
  });

  if (!assetSuccess) {
    console.error(`Asset creation failed: ${createAssetResponse.status} - ${createAssetResponse.body}`);
    errorRate.add(1);
    return;
  }

  // Extrai o ID do ativo do header Location
  const assetLocation = createAssetResponse.headers['Location'];
  const assetId = assetLocation ? assetLocation.split('/').pop() : null;

  if (!assetId) {
    console.error('Could not extract asset ID');
    errorRate.add(1);
    return;
  }

  console.log(`Asset created successfully. ID: ${assetId}`);
  sleep(0.3);

  // BLOCO 2: Registrar um investidor
  console.log('Creating investor...');
  const investorData = {
    email: `${userId}@test.com`,
    name: `Test User ${userId}`,
    cpf: generateCPF(),
    dateOfBirth: '1990-01-01',
    password: 'TestPassword123!'
  };

  const registerResponse = measureRequest('investor_registration', () =>
    http.post(`${BASE_URL}/investor`, JSON.stringify(investorData), { headers })
  );

  const registerSuccess = check(registerResponse, {
    'Investor registered successfully': (r) => r.status === 201,
    'Register response has success field': (r) => JSON.parse(r.body).success === true,
    'Registration time acceptable': (r) => r.timings.duration < 1500,
  });

  if (!registerSuccess) {
    console.error(`Investor registration failed: ${registerResponse.status} - ${registerResponse.body}`);
    errorRate.add(1);
    return;
  }

  console.log('Investor created successfully');
  sleep(0.3);

  // BLOCO 3: Autenticar o investidor
  console.log('Authenticating investor...');
  const authData = {
    email: investorData.email,
    password: investorData.password
  };

  const authResponse = measureRequest('authentication', () =>
    http.post(`${BASE_URL}/investor/auth`, JSON.stringify(authData), { headers })
  );

  const authSuccess = check(authResponse, {
    'Authentication successful': (r) => r.status === 200,
    'Auth response has access token': (r) => {
      const body = JSON.parse(r.body);
      return body.success === true && body.accessToken;
    },
    'Authentication time acceptable': (r) => r.timings.duration < 800,
  });

  if (!authSuccess) {
    console.error(`Authentication failed: ${authResponse.status} - ${authResponse.body}`);
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

  console.log('Authentication successful');
  sleep(0.3);

  // BLOCO 4: Criar um portfólio
  console.log('Creating portfolio...');
  const portfolioData = {
    name: `Portfolio ${userId}`,
    description: `Test portfolio for ${userId}`
  };

  const portfolioResponse = measureRequest('portfolio_creation', () =>
    http.post(`${BASE_URL}/portfolio`, JSON.stringify(portfolioData), { headers: authHeaders })
  );

  const portfolioSuccess = check(portfolioResponse, {
    'Portfolio created successfully': (r) => r.status === 201,
    'Portfolio response has success field': (r) => JSON.parse(r.body).success === true,
    'Portfolio creation time acceptable': (r) => r.timings.duration < 1000,
  });

  if (!portfolioSuccess) {
    console.error(`Portfolio creation failed: ${portfolioResponse.status} - ${portfolioResponse.body}`);
    errorRate.add(1);
    return;
  }

  console.log('Portfolio created successfully');
  sleep(0.3);

  // BLOCO 5: Adicionar investimento ao portfólio
  console.log('Adding investment...');
  const investmentData = {
    quantity: 100,
    currentPrice: 25.50
  };

  const investmentResponse = measureRequest('investment_creation', () =>
    http.post(`${BASE_URL}/portfolio/investment/${assetId}`, JSON.stringify(investmentData), { headers: authHeaders })
  );

  const investmentSuccess = check(investmentResponse, {
    'Investment added successfully': (r) => r.status === 201,
    'Investment response has success field': (r) => JSON.parse(r.body).success === true,
    'Investment creation time acceptable': (r) => r.timings.duration < 1200,
  });

  if (!investmentSuccess) {
    console.error(`Investment creation failed: ${investmentResponse.status} - ${investmentResponse.body}`);
    errorRate.add(1);
    return;
  }

  console.log('Investment added successfully');
  sleep(0.3);

  // BLOCO 6: Criar transação de compra
  console.log('Creating buy transaction...');
  const transactionData = {
    quantity: 50,
    price: 25.00,
    fees: 2.50,
    dateAt: new Date().toISOString()
  };

  const buyTransactionResponse = measureRequest('transaction_creation', () =>
    http.post(`${BASE_URL}/transactions/buy/${assetId}`, JSON.stringify(transactionData), { headers: authHeaders })
  );

  const buyTransactionSuccess = check(buyTransactionResponse, {
    'Buy transaction created successfully': (r) => r.status === 201,
    'Transaction response has success field': (r) => JSON.parse(r.body).success === true,
    'Transaction creation time acceptable': (r) => r.timings.duration < 1200,
  });

  if (!buyTransactionSuccess) {
    console.error(`Buy transaction failed: ${buyTransactionResponse.status} - ${buyTransactionResponse.body}`);
    errorRate.add(1);
    return;
  }

  // Extrai o ID da transação do header Location
  const transactionLocation = buyTransactionResponse.headers['Location'];
  const transactionId = transactionLocation ? transactionLocation.split('/').pop() : null;

  if (!transactionId) {
    console.error('Could not extract transaction ID');
    errorRate.add(1);
    return;
  }

  console.log(`Buy transaction created successfully. ID: ${transactionId}`);
  sleep(0.3);

  // BLOCO 7: Atualizar investimento após transação
  console.log('Updating investment after transaction...');
  const updateInvestmentResponse = measureRequest('investment_update', () =>
    http.patch(`${BASE_URL}/portfolio/investment/${transactionId}/update`, '', { headers: authHeaders })
  );

  const updateInvestmentSuccess = check(updateInvestmentResponse, {
    'Investment updated successfully': (r) => r.status === 200,
    'Update response has success field': (r) => JSON.parse(r.body).success === true,
    'Investment update time acceptable': (r) => r.timings.duration < 1500,
  });

  if (!updateInvestmentSuccess) {
    console.error(`Investment update failed: ${updateInvestmentResponse.status} - ${updateInvestmentResponse.body}`);
    errorRate.add(1);
    return;
  }

  console.log('Investment updated successfully');
  sleep(0.3);

  // BLOCO 8: Listar investimentos do portfólio
  console.log('Fetching investments...');
  const listInvestmentsResponse = measureRequest('investment_fetch', () =>
    http.get(`${BASE_URL}/portfolio/investments?page=1&limit=10`, { headers: authHeaders })
  );

  const listInvestmentsSuccess = check(listInvestmentsResponse, {
    'Investments listed successfully': (r) => r.status === 200,
    'List response has success field': (r) => JSON.parse(r.body).success === true,
    'List response has data': (r) => {
      const body = JSON.parse(r.body);
      return body.data && Array.isArray(body.data.investments);
    },
    'Investment fetch time acceptable': (r) => r.timings.duration < 2000,
  });

  if (!listInvestmentsSuccess) {
    console.error(`Investments listing failed: ${listInvestmentsResponse.status} - ${listInvestmentsResponse.body}`);
    errorRate.add(1);
    return;
  }

  const investmentsList = JSON.parse(listInvestmentsResponse.body);
  console.log(`Investments listed successfully. Total: ${investmentsList.data.total}`);

  // Mark as success if we reach here
  errorRate.add(0);
  
  // Record final system metrics
  recordSystemMetrics();
  
  console.log(`Complete flow executed successfully for VU: ${__VU}`);
  
  // Random pause between iterations to simulate realistic user behavior
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

// Setup function with enhanced health checking
export function setup() {
  console.log('Setting up comprehensive performance test environment...');
  console.log(`API URL: ${BASE_URL}`);
  
  // Enhanced health check with retries
  const healthCheckUrl = BASE_URL.replace('/api', '') + '/health';
  console.log(`Health check endpoint: ${healthCheckUrl}`);
  
  let retries = 3;
  while (retries > 0) {
    const healthCheck = http.get(healthCheckUrl);
    
    if (healthCheck.status === 200) {
      console.log('API is healthy and ready for testing');
      const healthData = JSON.parse(healthCheck.body);
      console.log(`Environment: ${healthData.environment || 'unknown'}`);
      
      return {
        baseUrl: BASE_URL,
        startTime: new Date().toISOString(),
        apiEnvironment: healthData.environment
      };
    }
    
    retries--;
    if (retries > 0) {
      console.log(`Health check failed (${healthCheck.status}), retrying... (${retries} attempts remaining)`);
      sleep(2);
    }
  }
  
  console.error(`API health check failed. Status: ${healthCheck.status}`);
  console.error(`URL: ${healthCheckUrl}`);
  throw new Error(`API is not responding after multiple attempts`);
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

// Enhanced teardown with detailed reporting
export function teardown(data) {
  console.log('='.repeat(60));
  console.log('PERFORMANCE TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Test started: ${data.startTime}`);
  console.log(`Test completed: ${new Date().toISOString()}`);
  console.log(`API Environment: ${data.apiEnvironment || 'unknown'}`);
  console.log(`Base URL: ${data.baseUrl}`);
  console.log('='.repeat(60));
  console.log('Detailed metrics available in K6 summary above');
  console.log('Business logic metrics tracked:');
  console.log('- Asset creation duration');
  console.log('- Investor registration duration'); 
  console.log('- Authentication duration');
  console.log('- Portfolio creation duration');
  console.log('- Investment creation duration');
  console.log('- Transaction creation duration');
  console.log('- Investment update duration');
  console.log('- Investment fetch duration');
  console.log('='.repeat(60));
}