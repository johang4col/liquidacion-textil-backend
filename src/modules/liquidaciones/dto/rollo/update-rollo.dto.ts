import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateRolloDto {
  @IsOptional()
  @IsString()
  colorTela?: string;

  @IsOptional()
  @IsString()
  colorHex?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  metrosIniciales?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  retazos?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sesgos?: number;
}
