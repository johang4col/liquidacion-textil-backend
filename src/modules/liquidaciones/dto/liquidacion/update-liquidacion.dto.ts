import {
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsObject,
} from 'class-validator';
import { EstadoLiquidacion } from '@/generated/prisma/enums';

export class UpdateLiquidacionDto {
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  clienteId?: string;

  @IsOptional()
  @IsString()
  ordenProduccion?: string;

  @IsOptional()
  @IsString()
  referencia?: string;

  @IsOptional()
  @IsString()
  materialPrincipal?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsEnum(EstadoLiquidacion)
  estado?: EstadoLiquidacion;

  // Checkboxes
  @IsOptional()
  @IsBoolean()
  muestraFisica?: boolean;

  @IsOptional()
  @IsBoolean()
  retazosConfeccion?: boolean;

  @IsOptional()
  @IsNumber()
  retazosConfeccionMetros?: number;

  @IsOptional()
  @IsBoolean()
  plantillas?: boolean;

  // Procesos
  @IsOptional()
  @IsNumber()
  estampadoPiezas?: number;

  @IsOptional()
  @IsNumber()
  bordadoPiezas?: number;

  @IsOptional()
  @IsNumber()
  fusionadosPiezas?: number;

  // Registro tiqueteadas
  @IsOptional()
  @IsObject()
  registroTiqueteadas?: Record<string, unknown>;

  // Despacho
  @IsOptional()
  @IsNumber()
  despachoPaquetes?: number;

  @IsOptional()
  @IsNumber()
  despachoRollos?: number;
}
