import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { EnvService } from './env/env.service';
import './observability/opentelemetry/opentelemetry';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('Documentação da API usando NestJS e Swagger')
    .setVersion('1.0')
    .addTag('auth', 'Autenticação e autorização')
    .addBearerAuth() // Para JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'API Docs',
    customfavIcon: '/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
  });

  const envService = app.get(EnvService)
  const port = envService.get('PORT')
  
  await app.listen(port);
}
bootstrap();