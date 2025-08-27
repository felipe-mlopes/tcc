import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { PassportModule } from "@nestjs/passport"
import { APP_GUARD } from "@nestjs/core"

import { EnvModule } from "../env/env.module"
import { EnvService } from "../env/env.service"
import { JwtStrategy } from "./jwt.strategy"
import { JwtAuthGuard } from "./jwt-auth.guard"

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [EnvModule],
      inject: [EnvService],
      global: true,
      useFactory(env: EnvService) {
        const secret = env.get('JWT_SECRET')

        return {
          secret: secret,
          signOptions: { 
            algorithm: 'HS256',
            expiresIn: '1d' // Token expira em 1 dia
          },
        }
      },
    }),
  ],
  providers: [
    JwtStrategy,
    EnvService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AuthModule {}