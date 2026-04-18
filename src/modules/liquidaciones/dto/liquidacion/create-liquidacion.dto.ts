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
  @IsString()
  estampadoPiezas?: string;

  @IsOptional()
  @IsString()
  bordadoPiezas?: string;

  @IsOptional()
  @IsString()
  fusionadosPiezas?: string;

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
