import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Patch,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LiquidacionesService } from './liquidaciones.service';
import { RollosService } from './rollos.service';
import { EspigasService } from './espigas.service';
import { FotosService } from './fotos.service';
import {
  CreateLiquidacionDto,
  UpdateLiquidacionDto,
  UpdateEstadoDto,
  CreateRolloDto,
  UpdateRolloDto,
  CreateEspigaDto,
  UpdateEspigaDto,
  UploadFotoDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class LiquidacionesController {
  constructor(
    private readonly liquidacionesService: LiquidacionesService,
    private readonly rollosService: RollosService,
    private readonly espigasService: EspigasService,
    private readonly fotosService: FotosService,
  ) {}

  // ==================== LIQUIDACIONES ====================

  @Post('liquidaciones')
  createLiquidacion(@Body() createLiquidacionDto: CreateLiquidacionDto) {
    return this.liquidacionesService.create(createLiquidacionDto);
  }

  @Get('liquidaciones')
  findAllLiquidaciones(@Query('eliminadas') eliminadas?: string) {
    return this.liquidacionesService.findAll(eliminadas === 'true');
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

  @Patch('liquidaciones/:id/restaurar')
  restaurarLiquidacion(@Param('id') id: string) {
    return this.liquidacionesService.restaurar(id);
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

  // ==================== FOTOS ====================

  @Post('liquidaciones/:liquidacionId/fotos')
  @UseInterceptors(
    FileInterceptor('foto', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    }),
  )
  uploadFoto(
    @Param('liquidacionId') liquidacionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFotoDto: UploadFotoDto,
  ) {
    return this.fotosService.upload(liquidacionId, file, uploadFotoDto);
  }

  @Delete('fotos/:fotoId')
  removeFoto(@Param('fotoId') fotoId: string) {
    return this.fotosService.remove(fotoId);
  }
}
