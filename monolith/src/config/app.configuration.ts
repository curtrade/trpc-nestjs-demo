import { Configuration, Value } from '@itgorillaz/configify';
import { IsInt, Max, Min } from 'class-validator';

/**
 * Typed application config, populated by configify from `.env` / env vars at boot
 * and validated by class-validator before the app accepts traffic.
 */
@Configuration()
export class AppConfiguration {
  @IsInt()
  @Min(1)
  @Max(65535)
  @Value('PORT', { parse: parseInt, default: 3000 })
  port: number;
}
