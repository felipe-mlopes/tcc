#!/bin/bash

# Define o diretório para os resultados do Clinic
CLINIC_DEST="metrics/performance/clinic"

# Endereço do endpoint de métricas do servidor
MONITORING_ENDPOINT="http://172.17.0.1:3333/monitoring/metrics"

# Função para coletar e exibir métricas
function collect_metrics() {
    echo "--- Collecting Server Metrics ---"
    response=$(curl -s $MONITORING_ENDPOINT)
    if [ $? -eq 0 ]; then
        memory_mb=$(echo $response | jq '.memory.heapUsed / 1024 / 1024')
        cpu_usage=$(echo $response | jq '.cpu.usage')
        event_loop_lag=$(echo $response | jq '.eventLoop.lag')
        
        echo "Memory Usage: ${memory_mb} MB"
        echo "CPU Usage: ${cpu_usage}%"
        echo "Event Loop Lag: ${event_loop_lag} ms"
    else
        echo "Failed to fetch metrics from server endpoint."
    fi
    echo "-------------------------------"
}

# Limpa os resultados antigos do Clinic
echo "Cleaning old Clinic reports..."
npm run profile:clean

# Inicia o servidor Node.js com o Clinic Doctor em background.
# O & é para rodar em segundo plano, e 'disown' desvincula do processo pai.
echo "Starting application with Clinic Doctor..."
npx clinic doctor --dest $CLINIC_DEST -- node dist/src/infra/main.js &
CLINIC_PID=$!
echo "Clinic Doctor started with PID: $CLINIC_PID"

# Dá um tempo para o servidor iniciar completamente
echo "Waiting for the server to be ready..."
sleep 10

# Coleta as métricas iniciais do servidor
echo ""
echo "--- Initial Server Metrics ---"
collect_metrics

# Inicia o teste de carga com o k6
echo ""
echo "Starting k6 load test..."
docker run --rm -i grafana/k6 run - < metrics/performance/k6/load-test.js

# Coleta as métricas finais do servidor
echo ""
echo "--- Final Server Metrics ---"
collect_metrics

# Mata o processo do Clinic Doctor
echo ""
echo "K6 test finished. Killing Clinic Doctor process $CLINIC_PID..."
kill $CLINIC_PID

# Abre o relatório gerado pelo Clinic Doctor (opcional)
echo "Opening Clinic Doctor report..."
npx clinic doctor --dest $CLINIC_DEST --open

echo "All tasks completed."