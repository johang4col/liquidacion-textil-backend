import { IsEnum } from 'class-validator';
import { EstadoLiquidacion } from '@/generated/prisma/enums';

export class UpdateEstadoDto {
  @IsEnum(EstadoLiquidacion)
  estado: EstadoLiquidacion;
}
