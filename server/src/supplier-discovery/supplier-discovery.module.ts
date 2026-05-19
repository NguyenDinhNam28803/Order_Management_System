import { Module } from '@nestjs/common';
import { SupplierDiscoveryController } from './supplier-discovery.controller';
import { SupplierDiscoveryService } from './supplier-discovery.service';
import { WebSearchService } from './web-search.service';
import { WebScraperService } from './web-scraper.service';

@Module({
  controllers: [SupplierDiscoveryController],
  providers: [SupplierDiscoveryService, WebSearchService, WebScraperService],
  exports: [SupplierDiscoveryService],
})
export class SupplierDiscoveryModule {}
