import { Configuration, Value } from '@itgorillaz/configify';
import { IsInt, IsUrl, Max, Min } from 'class-validator';

@Configuration()
export class AppConfiguration {
  @IsInt()
  @Min(1)
  @Max(65535)
  @Value('PORT', { parse: parseInt, default: 3000 })
  port: number;

  @IsUrl({ require_tld: false })
  @Value('AUTH_URL', { default: 'http://localhost:3001/trpc' })
  authUrl: string;

  @IsUrl({ require_tld: false })
  @Value('CATALOG_URL', { default: 'http://localhost:3002/trpc' })
  catalogUrl: string;
}
