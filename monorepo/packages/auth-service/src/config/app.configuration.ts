import { Configuration, Value } from '@itgorillaz/configify';
import { IsInt, Max, Min } from 'class-validator';

@Configuration()
export class AppConfiguration {
  @IsInt()
  @Min(1)
  @Max(65535)
  @Value('PORT', { parse: parseInt, default: 3001 })
  port: number;
}
