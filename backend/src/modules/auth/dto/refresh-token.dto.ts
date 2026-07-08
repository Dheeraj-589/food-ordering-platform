import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: 'some-refresh-token-jwt' })
  @IsNotEmpty()
  @IsString()
  refreshToken!: string;
}
