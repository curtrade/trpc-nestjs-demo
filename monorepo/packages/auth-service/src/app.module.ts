import { Module } from '@nestjs/common';
import { ConfigifyModule } from '@itgorillaz/configify';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ConfigifyModule.forRootAsync(), AuthModule],
})
export class AppModule {}
