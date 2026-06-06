import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ItemRepository } from './item.repository';

@Module({
  providers: [CatalogService, ItemRepository],
  exports: [CatalogService],
})
export class CatalogModule {}
