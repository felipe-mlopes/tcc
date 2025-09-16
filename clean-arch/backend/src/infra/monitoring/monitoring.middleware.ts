import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MonitoringService } from './monitoring.service';

@Injectable()
export class MonitoringMiddleware implements NestMiddleware {
  constructor(private readonly monitoringService: MonitoringService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Incrementar contador de requisições
    this.monitoringService.incrementRequestCount();
    
    // Adicionar timestamp da requisição
    req['startTime'] = Date.now();
    
    // Interceptar o final da resposta para métricas
    const originalSend = res.send;
    res.send = function(data) {
      const endTime = Date.now();
      const duration = endTime - req['startTime'];
      
      // Adicionar headers de performance
      res.set('X-Response-Time', `${duration}ms`);
      res.set('X-Server-Timestamp', new Date().toISOString());
      
      return originalSend.call(this, data);
    };
    
    next();
  }
}