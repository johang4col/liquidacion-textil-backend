import { IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { EstadoLiquidacion } from '@/generated/prisma/enums';

export class CreateLiquidacionDto {
  @IsDateString()
  fecha: string;

  @IsString()
  clienteId: string;

  @IsOptional()
  @IsString()
  ordenProduccion?: string;

  @IsOptional()
  @IsString()
  referencia?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsEnum(EstadoLiquidacion)
  estado?: EstadoLiquidacion;
}
