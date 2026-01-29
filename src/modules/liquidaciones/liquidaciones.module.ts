import { Module } from '@nestjs/common';
import { LiquidacionesController } from './liquidaciones.controller';
import { LiquidacionesService } from './liquidaciones.service';
import { RollosService } from './rollos.service';
import { EspigasService } from './espigas.service';
import { PrismaModule } from '../../database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LiquidacionesController],
  providers: [LiquidacionesService, RollosService, EspigasService],
  exports: [LiquidacionesService, RollosService, EspigasService],
})
export class LiquidacionesModule {}
