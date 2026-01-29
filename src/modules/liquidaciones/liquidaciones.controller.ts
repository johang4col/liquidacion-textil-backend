import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { LiquidacionesService } from './liquidaciones.service';
import { RollosService } from './rollos.service';
import { EspigasService } from './espigas.service';
import {
  CreateLiquidacionDto,
  UpdateLiquidacionDto,
  UpdateEstadoDto,
  CreateRolloDto,
  UpdateRolloDto,
  CreateEspigaDto,
  UpdateEspigaDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class LiquidacionesController {
  constructor(
    private readonly liquidacionesService: LiquidacionesService,
    private readonly rollosService: RollosService,
    private readonly espigasService: EspigasService,
  ) {}

  // ==================== LIQUIDACIONES ====================

  @Post('liquidaciones')
  createLiquidacion(@Body() createLiquidacionDto: CreateLiquidacionDto) {
    return this.liquidacionesService.create(createLiquidacionDto);
  }

  @Get('liquidaciones')
  findAllLiquidaciones() {
    return this.liquidacionesService.findAll();
  }

  @Get('liquidaciones/:id')
  findOneLiquidacion(@Param('id') id: string) {
    return this.liquidacionesService.findOne(id);
  }

  @Put('liquidaciones/:id')
  updateLiquidacion(
    @Param('id') id: string,
    @Body() updateLiquidacionDto: UpdateLiquidacionDto,
  ) {
    return this.liquidacionesService.update(id, updateLiquidacionDto);
  }

  @Patch('liquidaciones/:id/estado')
  updateEstadoLiquidacion(
    @Param('id') id: string,
    @Body() updateEstadoDto: UpdateEstadoDto,
  ) {
    return this.liquidacionesService.updateEstado(id, updateEstadoDto);
  }

  @Delete('liquidaciones/:id')
  removeLiquidacion(@Param('id') id: string) {
    return this.liquidacionesService.remove(id);
  }

  // ==================== ROLLOS ====================

  @Post('liquidaciones/:liquidacionId/rollos')
  createRollo(
    @Param('liquidacionId') liquidacionId: string,
    @Body() createRolloDto: CreateRolloDto,
  ) {
    return this.rollosService.create(liquidacionId, createRolloDto);
  }

  @Post('liquidaciones/:liquidacionId/rollos/:rolloId/duplicar')
  duplicarRollo(
    @Param('liquidacionId') liquidacionId: string,
    @Param('rolloId') rolloId: string,
  ) {
    return this.rollosService.duplicar(liquidacionId, rolloId);
  }

  @Put('liquidaciones/:liquidacionId/rollos/:rolloId')
  updateRollo(
    @Param('liquidacionId') liquidacionId: string,
    @Param('rolloId') rolloId: string,
    @Body() updateRolloDto: UpdateRolloDto,
  ) {
    return this.rollosService.update(liquidacionId, rolloId, updateRolloDto);
  }

  @Delete('liquidaciones/:liquidacionId/rollos/:rolloId')
  removeRollo(
    @Param('liquidacionId') liquidacionId: string,
    @Param('rolloId') rolloId: string,
  ) {
    return this.rollosService.remove(liquidacionId, rolloId);
  }

  // ==================== ESPIGAS ====================

  @Post('rollos/:rolloId/espigas')
  createEspiga(
    @Param('rolloId') rolloId: string,
    @Body() createEspigaDto: CreateEspigaDto,
  ) {
    return this.espigasService.create(rolloId, createEspigaDto);
  }

  @Put('rollos/:rolloId/espigas/:espigaId')
  updateEspiga(
    @Param('rolloId') rolloId: string,
    @Param('espigaId') espigaId: string,
    @Body() updateEspigaDto: UpdateEspigaDto,
  ) {
    return this.espigasService.update(rolloId, espigaId, updateEspigaDto);
  }

  @Delete('rollos/:rolloId/espigas/:espigaId')
  removeEspiga(
    @Param('rolloId') rolloId: string,
    @Param('espigaId') espigaId: string,
  ) {
    return this.espigasService.remove(rolloId, espigaId);
  }
}
