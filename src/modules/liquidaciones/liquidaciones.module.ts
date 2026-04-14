import { Module } from '@nestjs/common';
import { LiquidacionesController } from './liquidaciones.controller';
import { LiquidacionesService } from './liquidaciones.service';
import { RollosService } from './rollos.service';
import { EspigasService } from './espigas.service';
import { FotosService } from './fotos.service';
import { PrismaModule } from '../../database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LiquidacionesController],
  providers: [LiquidacionesService, RollosService, EspigasService, FotosService],
  exports: [LiquidacionesService, RollosService, EspigasService, FotosService],
})
export class LiquidacionesModule {}
