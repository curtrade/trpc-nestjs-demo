import { Module } from '@nestjs/common';
import { ConfigifyModule } from '@itgorillaz/configify';
import { CatalogModule } from './catalog/catalog.module';

@Module({
  imports: [ConfigifyModule.forRootAsync(), CatalogModule],
})
export class AppModule {}
