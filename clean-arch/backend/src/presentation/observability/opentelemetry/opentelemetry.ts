import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { CompressionAlgorithm } from "@opentelemetry/otlp-exporter-base";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { NestInstrumentation } from "@opentelemetry/instrumentation-nestjs-core";
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';

const traceExporter = new OTLPTraceExporter({
  url: 'http://localhost:4317', // Jaeger endpoint for OTLP
  compression: CompressionAlgorithm.GZIP
});

const sdk = new NodeSDK({
    serviceName: 'invest-api',
    traceExporter,
    instrumentations: [
        new HttpInstrumentation(),
        new NestInstrumentation(),
        new ExpressInstrumentation()
    ]
})

process.on('beforeExit', async () => {
    await sdk.shutdown()
})

sdk.start()