import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateConfiguracionDto {
  @IsOptional()
  @IsString()
  nombreEmpresa?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  nit?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  siguienteNumero?: number;

  @IsOptional()
  @IsString()
  prefijoLiquidacion?: string;
}
