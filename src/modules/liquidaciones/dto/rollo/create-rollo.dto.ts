import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateRolloDto {
  @IsString()
  colorTela: string;

  @IsString()
  colorHex: string;

  @IsNumber()
  @Min(0)
  metrosIniciales: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  retazos?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sesgos?: number;
}
