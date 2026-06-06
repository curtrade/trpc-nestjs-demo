import { Module } from '@nestjs/common';
import { ConfigifyModule } from '@itgorillaz/configify';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [ConfigifyModule.forRootAsync(), CartModule],
})
export class AppModule {}
