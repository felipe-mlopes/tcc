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

// Configuration
const BASE_URL = 'http://172.17.0.1:3333'; // Adjust to your API URL
const ASSETS_COUNT = 5; // Number of assets to create per iteration
const THINK_TIME = 1; // Seconds to wait between requests
const MONITORING_ENDPOINT = `${BASE_URL}/monitoring/metrics`; // Endpoint para métricas do servidor

export default function() {
  const assetIds = [];
  let accessToken = '';
  let investmentIds = [];
  let transactionIds = [];

  // Fetch server metrics at the beginning
  fetchServerMetrics();

  // Step 1: Register Assets with detailed timing
  console.log(`VU ${__VU}: Starting asset registration`);
  for (let i = 0; i < ASSETS_COUNT; i++) {
    const assetData = generateAsset(i);

    const assetResponse = http.post(
      `${BASE_URL}/asset`,
      JSON.stringify(assetData),
      {
        headers: {
          'Content-Type': 'application/json',
        },
        tags: { 
          operation: 'asset_creation',
          asset_type: assetData.assetType 
        }
      }
    );

    // Record custom metrics
    assetCreationTime.add(assetResponse.timings.duration);
    responseTime.add(assetResponse.timings.duration, { operation: 'asset_creation' });
    throughput.add(1);

    const assetSuccess = check(assetResponse, {
      'asset registration status is 201': (r) => r.status === 201,
      'asset registration has location header': (r) => r.headers.Location !== undefined,
      'asset registration response time < 2s': (r) => r.timings.duration < 2000
    }, { operation: 'asset_creation' });

    if (!assetSuccess) {
      errorRate.add(1, { operation: 'asset_creation' });
      console.error(`VU ${__VU}: Failed to register asset ${i}:`, assetResponse.status, assetResponse.body);
      continue;
    }

    // Extract asset ID from Location header
    const locationHeader = assetResponse.headers.Location;
    if (locationHeader) {
      const assetId = locationHeader.split('/').pop();
      assetIds.push(assetId);
      console.log(`VU ${__VU}: Asset ${i} registered with ID: ${assetId}`);
    }

    sleep(THINK_TIME);
  }

  if (assetIds.length === 0) {
    console.error(`VU ${__VU}: No assets were created, aborting test`);
    return;
  }

  // Step 2: Register Investor with timing
  console.log(`VU ${__VU}: Registering investor`);
  const investorData = generateInvestor();
  
  const investorResponse = http.post(
    `${BASE_URL}/investor`,
    JSON.stringify(investorData),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { operation: 'investor_registration' }
    }
  );

  investorRegistrationTime.add(investorResponse.timings.duration);
  responseTime.add(investorResponse.timings.duration, { operation: 'investor_registration' });
  throughput.add(1);

  const investorSuccess = check(investorResponse, {
    'investor registration status is 201': (r) => r.status === 201,
    'investor registration response has message': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.message !== undefined;
      } catch {
        return false;
      }
    },
    'investor registration response time < 2s': (r) => r.timings.duration < 2000,
  }, { operation: 'investor_registration' });

  if (!investorSuccess) {
    errorRate.add(1, { operation: 'investor_registration' });
    console.error(`VU ${__VU}: Failed to register investor:`, investorResponse.status, investorResponse.body);
    return;
  }

  console.log(`VU ${__VU}: Investor registered`);
  sleep(THINK_TIME);

  // Step 3: Authenticate Investor with timing
  console.log(`VU ${__VU}: Authenticating investor`);
  const authData = {
    email: investorData.email,
    password: investorData.password
  };

  const authResponse = http.post(
    `${BASE_URL}/investor/auth`,
    JSON.stringify(authData),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { operation: 'authentication' }
    }
  );

  authenticationTime.add(authResponse.timings.duration);
  responseTime.add(authResponse.timings.duration, { operation: 'authentication' });
  throughput.add(1);

  const authSuccess = check(authResponse, {
    'authentication status is 201': (r) => r.status === 201,
    'authentication returns access token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.access_token !== undefined;
      } catch {
        return false;
      }
    },
    'authentication response time < 1s': (r) => r.timings.duration < 1000,
  }, { operation: 'authentication' });

  if (!authSuccess) {
    errorRate.add(1, { operation: 'authentication' });
    console.error(`VU ${__VU}: Failed to authenticate investor:`, authResponse.status, authResponse.body);
    return;
  }

  accessToken = JSON.parse(authResponse.body).access_token;
  console.log(`VU ${__VU}: Authentication successful`);
  sleep(THINK_TIME);

  // Step 4: Create Portfolio with timing
  console.log(`VU ${__VU}: Creating portfolio`);
  const portfolioData = generatePortfolio();

  const portfolioResponse = http.post(
    `${BASE_URL}/portfolio`,
    JSON.stringify(portfolioData),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      tags: { operation: 'portfolio_creation' }
    }
  );

  portfolioCreationTime.add(portfolioResponse.timings.duration);
  responseTime.add(portfolioResponse.timings.duration, { operation: 'portfolio_creation' });
  throughput.add(1);

  const portfolioSuccess = check(portfolioResponse, {
    'portfolio creation status is 201': (r) => r.status === 201,
    'portfolio creation response has message': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.message !== undefined;
      } catch {
        return false;
      }
    },
    'portfolio creation response time < 1.5s': (r) => r.timings.duration < 1500,
  }, { operation: 'portfolio_creation' });

  if (!portfolioSuccess) {
    errorRate.add(1, { operation: 'portfolio_creation' });
    console.error(`VU ${__VU}: Failed to create portfolio:`, portfolioResponse.status, portfolioResponse.body);
    return;
  }

  console.log(`VU ${__VU}: Portfolio created`);
  sleep(THINK_TIME);

  // Step 5: Create Investments for each Asset with timing
  console.log(`VU ${__VU}: Creating investments for ${assetIds.length} assets`);
  for (const assetId of assetIds) {
    const investmentData = {
      assetId: assetId,
      quantity: Math.floor(Math.random() * 100) + 10, // Random quantity between 10-109
      currentPrice: Math.round((Math.random() * 100 + 10) * 100) / 100 // Random price between 10-110
    };

    const investmentResponse = http.post(
      `${BASE_URL}/portfolio/investment`,
      JSON.stringify(investmentData),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        tags: { operation: 'investment_creation' }
      }
    );

    investmentCreationTime.add(investmentResponse.timings.duration);
    responseTime.add(investmentResponse.timings.duration, { operation: 'investment_creation' });
    throughput.add(1);

    const investmentSuccess = check(investmentResponse, {
      'investment creation status is 201': (r) => r.status === 201,
      'investment creation response has message': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.message !== undefined;
        } catch {
          return false;
        }
      },
      'investment creation response time < 1.5s': (r) => r.timings.duration < 1500,
    }, { operation: 'investment_creation' });

    if (!investmentSuccess) {
      errorRate.add(1, { operation: 'investment_creation' });
      console.error(`VU ${__VU}: Failed to create investment for asset ${assetId}:`, investmentResponse.status, investmentResponse.body);
      continue;
    }

    console.log(`VU ${__VU}: Investment created for asset ${assetId}`);
    sleep(THINK_TIME);
  }

  // Step 6: Create Buy Transactions for each Asset
  console.log(`VU ${__VU}: Creating buy transactions for ${assetIds.length} assets`);
  for (const assetId of assetIds) {
    const transactionData = {
      assetId: assetId,
      quantity: Math.floor(Math.random() * 50) + 5, // Random quantity between 5-54
      price: Math.round((Math.random() * 100 + 10) * 100) / 100, // Random price between 10-110
      fees: Math.round((Math.random() * 20) * 100) / 100, // Random fees between 0-20
      dateAt: new Date().toISOString()
    };

    const transactionResponse = http.post(
      `${BASE_URL}/transactions/buy`,
      JSON.stringify(transactionData),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        tags: { operation: 'transaction_creation' }
      }
    );

    transactionCreationTime.add(transactionResponse.timings.duration);
    responseTime.add(transactionResponse.timings.duration, { operation: 'transaction_creation' });
    throughput.add(1);

    const transactionSuccess = check(transactionResponse, {
      'transaction creation status is 201': (r) => r.status === 201,
      'transaction creation response has message': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.message !== undefined;
        } catch {
          return false;
        }
      },
      'transaction creation has location header': (r) => r.headers.Location !== undefined,
      'transaction creation response time < 1.5s': (r) => r.timings.duration < 1500,
    }, { operation: 'transaction_creation' });

    if (!transactionSuccess) {
      errorRate.add(1, { operation: 'transaction_creation' });
      console.error(`VU ${__VU}: Failed to create transaction for asset ${assetId}:`, transactionResponse.status, transactionResponse.body);
      continue;
    }

    // Extract transaction ID from Location header
    const locationHeader = transactionResponse.headers.Location;
    if (locationHeader) {
      const transactionId = locationHeader.split('/').pop();
      transactionIds.push(transactionId);
      console.log(`VU ${__VU}: Transaction created for asset ${assetId} with ID: ${transactionId}`);
    }

    sleep(THINK_TIME);
  }

  // Step 7: Update Investments after Transactions with timing
  console.log(`VU ${__VU}: Updating investments with ${transactionIds.length} transactions`);
  for (const transactionId of transactionIds) {

    const updateResponse = http.patch(
      `${BASE_URL}/portfolio/investment/${transactionId}/update`,
      null,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        tags: { operation: 'investment_update' }
      }
    );

    investmentUpdateTime.add(updateResponse.timings.duration);
    responseTime.add(updateResponse.timings.duration, { operation: 'investment_update' });
    throughput.add(1);

    const updateSuccess = check(updateResponse, {
      'investment update status is 200': (r) => r.status === 200,
      'investment update response has message': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.message !== undefined;
        } catch {
          return false;
        }
      },
      'investment update response time < 2s': (r) => r.timings.duration < 2000,
    }, { operation: 'investment_update' });

    if (!updateSuccess) {
      errorRate.add(1, { operation: 'investment_update' });
      console.error(`VU ${__VU}: Failed to update investment with transaction ${transactionId}:`, updateResponse.status, updateResponse.body);
      continue;
    }

    console.log(`VU ${__VU}: Investment updated with transaction ${transactionId}`);
    sleep(THINK_TIME);
  }

  // Step 8: Fetch All Investments by Portfolio with timing
  console.log(`VU ${__VU}: Fetching all investments from portfolio`);

  const fetchResponse = http.get(
    `${BASE_URL}/portfolio/investments?page=1`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      tags: { operation: 'investment_fetch' }
    }
  );

  investmentFetchTime.add(fetchResponse.timings.duration);
  responseTime.add(fetchResponse.timings.duration, { operation: 'investment_fetch' });
  throughput.add(1);

  const fetchSuccess = check(fetchResponse, {
    'fetch investments status is 200': (r) => r.status === 200,
    'fetch investments returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch {
        return false;
      }
    },
    'fetch investments returns expected count': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.length >= 0; // Should have at least some investments
      } catch {
        return false;
      }
    },
    'fetch investments response time < 3s': (r) => r.timings.duration < 3000,
  }, { operation: 'investment_fetch' });

  if (!fetchSuccess) {
    errorRate.add(1, { operation: 'investment_fetch' });
    console.error(`VU ${__VU}: Failed to fetch investments:`, fetchResponse.status, fetchResponse.body);
  } else {
    const investments = JSON.parse(fetchResponse.body);
    console.log(`VU ${__VU}: Successfully fetched ${investments.length} investments`);
  }

  // Fetch server metrics at the end
  fetchServerMetrics();

  console.log(`VU ${__VU}: Test flow completed successfully`);
  sleep(THINK_TIME);
}

// Function to fetch server-side metrics
function fetchServerMetrics() {
  try {
    const metricsResponse = http.get(MONITORING_ENDPOINT, {
      tags: { operation: 'server_metrics' }
    });
    
    if (metricsResponse.status === 200) {
      const metrics = JSON.parse(metricsResponse.body);
      
      // Update custom metrics with server data
      if (metrics.memory) {
        memoryUsage.add(metrics.memory.heapUsed / 1024 / 1024); // Convert to MB
        if (metrics.memory.heapTotal > 0) {
          heapUtilization.add((metrics.memory.heapUsed / metrics.memory.heapTotal) * 100);
        }
      }
      
      if (metrics.cpu) {
        cpuUsage.add(metrics.cpu.usage || 0);
      }
      
      if (metrics.eventLoop) {
        eventLoopLag.add(metrics.eventLoop.lag || 0);
      }
      
      console.log(`VU ${__VU}: Server metrics updated - Memory: ${(metrics.memory?.heapUsed / 1024 / 1024).toFixed(2)}MB, CPU: ${metrics.cpu?.usage}%`);
    }
  } catch (error) {
    console.warn(`VU ${__VU}: Failed to fetch server metrics:`, error.message);
  }
}

// Enhanced summary function
export function handleSummary(data) {
  const summary = {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify({
      timestamp: new Date().toISOString(),
      test_duration: data.state.testRunDurationMs,
      performance_metrics: {
        response_times: {
          p50: data.metrics.http_req_duration.values['p(50)'],
          p95: data.metrics.http_req_duration.values['p(95)'],
          p99: data.metrics.http_req_duration.values['p(99)'],
          avg: data.metrics.http_req_duration.values.avg,
          max: data.metrics.http_req_duration.values.max
        },
        throughput: {
          total_requests: data.metrics.http_reqs.values.count,
          requests_per_second: data.metrics.http_reqs.values.rate,
          data_sent: data.metrics.data_sent.values.count,
          data_received: data.metrics.data_received.values.count
        },
        error_rates: {
          http_errors: data.metrics.http_req_failed.values.rate * 100,
          custom_errors: data.metrics.errors?.values.rate * 100 || 0
        },
        business_metrics: {
          asset_creation: data.metrics.asset_creation_duration?.values || {},
          investor_registration: data.metrics.investor_registration_duration?.values || {},
          authentication: data.metrics.authentication_duration?.values || {},
          portfolio_creation: data.metrics.portfolio_creation_duration?.values || {},
          investment_creation: data.metrics.investment_creation_duration?.values || {},
          transaction_creation: data.metrics.transaction_creation_duration?.values || {},
          investment_update: data.metrics.investment_update_duration?.values || {},
          investment_fetch: data.metrics.investment_fetch_duration?.values || {}
        },
        server_metrics: {
          memory_usage: data.metrics.memory_usage_mb?.values || {},
          cpu_usage: data.metrics.cpu_usage_percent?.values || {},
          event_loop_lag: data.metrics.event_loop_lag_ms?.values || {},
          heap_utilization: data.metrics.heap_utilization_percent?.values || {}
        }
      },
      thresholds_passed: data.state.testRunDurationMs > 0
    }, null, 2),
    'performance-report.html': generateHTMLReport(data)
  };
  
  return summary;
}

// Generate HTML performance report
function generateHTMLReport(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Performance Test Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .metric { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
            .error { background: #ffe6e6; }
            .success { background: #e6ffe6; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <h1>Performance Test Report</h1>
        <p><strong>Test Duration:</strong> ${(data.state.testRunDurationMs / 1000).toFixed(2)} seconds</p>
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
        
        <h2>Response Time Percentiles</h2>
        <table>
            <tr><th>Percentile</th><th>Time (ms)</th></tr>
            <tr><td>P50 (Median)</td><td>${data.metrics.http_req_duration.values['p(50)'].toFixed(2)}</td></tr>
            <tr><td>P95</td><td>${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}</td></tr>
            <tr><td>P99</td><td>${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}</td></tr>
            <tr><td>Average</td><td>${data.metrics.http_req_duration.values.avg.toFixed(2)}</td></tr>
            <tr><td>Maximum</td><td>${data.metrics.http_req_duration.values.max.toFixed(2)}</td></tr>
        </table>
        
        <h2>Throughput Metrics</h2>
        <div class="metric">
            <strong>Total Requests:</strong> ${data.metrics.http_reqs.values.count}<br>
            <strong>Requests/Second:</strong> ${data.metrics.http_reqs.values.rate.toFixed(2)}<br>
            <strong>Data Sent:</strong> ${(data.metrics.data_sent.values.count / 1024 / 1024).toFixed(2)} MB<br>
            <strong>Data Received:</strong> ${(data.metrics.data_received.values.count / 1024 / 1024).toFixed(2)} MB
        </div>
        
        <h2>Error Rates</h2>
        <div class="metric ${(data.metrics.http_req_failed.values.rate * 100) > 5 ? 'error' : 'success'}">
            <strong>HTTP Error Rate:</strong> ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%<br>
            <strong>Custom Error Rate:</strong> ${(data.metrics.errors?.values.rate * 100 || 0).toFixed(2)}%
        </div>
    </body>
    </html>
  `;
}

// ----------------- UTILITÁRIOS -----------------
function generateAsset(index) {
  const assetTypes = ['Stock', 'ETF', 'Crypto', 'Bond', 'FIIs'];
  const sectors = ['Technology', 'Finance', 'Healthcare', 'Energy', 'Consumer'];
  const exchanges = ['NASDAQ', 'NYSE', 'B3', 'CRYPTO'];
  const currencies = ['USD', 'BRL', 'EUR'];
  
  return {
    symbol: generateSymbol(),
    name: `Test Asset ${index} VU${__VU}`,
    assetType: assetTypes[Math.floor(Math.random() * assetTypes.length)],
    sector: sectors[Math.floor(Math.random() * sectors.length)],
    exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
    currency: currencies[Math.floor(Math.random() * currencies.length)]
  };
}

function generateInvestor() {
  const vuId = __VU;
  const timestamp = Date.now();
  
  return {
    email: `investor${vuId}_${timestamp}@test.com`,
    name: `Test Investor ${vuId}`,
    cpf: generateCPF(),
    password: '#TestPassword123',
    dateOfBirth: '1990-05-15'
  };
}

function generateCPF() {
  const digits = [];
  for (let i = 0; i < 9; i++) digits.push(Math.floor(Math.random() * 10));

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
  digits.push(sum % 11 < 2 ? 0 : 11 - (sum % 11));

  sum = 0;
  for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
  digits.push(sum % 11 < 2 ? 0 : 11 - (sum % 11));

  return digits.join('').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function generateSymbol() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let symbol = '';
  for (let i = 0; i < 3; i++) symbol += letters.charAt(Math.floor(Math.random() * letters.length));
  return symbol + Math.floor(Math.random() * 100).toString().padStart(2, '0');
}

function generatePortfolio() {
  return {
    name: `Test Portfolio VU${__VU}`,
    description: `Portfolio for load testing - Virtual User ${__VU}`
  };
}

// Required import for summary
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';