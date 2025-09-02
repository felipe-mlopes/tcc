import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const traceExporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces', // Jaeger endpoint for OTLP
  headers: {}
});

const sdk = new NodeSDK({
    serviceName: 'test-api',
    traceExporter,
    instrumentations: [
        getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-fs': {
                enabled: false
            }
        })
    ]
})

sdk.start();
console.log('OpenTelemetry started successfully');