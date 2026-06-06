import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

/** Body of POST /cart/items. The session token travels in the x-session-token header. */
export class AddItemDto {
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsInt()
  @Min(1)
  qty: number;
}
