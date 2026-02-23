import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateRolloDto {
  @IsString()
  material: string;

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
