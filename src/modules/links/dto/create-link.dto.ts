import {
  IsString,
  IsUrl,
  IsOptional,
  IsDateString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLinkDto {
  @ApiProperty({ example: 'https://example.com/very/long/url' })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'Only http and https protocols are allowed' },
  )
  @MaxLength(2048)
  originalUrl: string;

  @ApiPropertyOptional({ example: 'my-link', description: 'Custom slug (6-50 alphanumeric chars)' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Slug must be alphanumeric (a-z, A-Z, 0-9, -, _)' })
  slug?: string;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
