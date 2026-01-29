import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { UpdateConfiguracionDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('configuracion')
@UseGuards(JwtAuthGuard)
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) {}

  @Get()
  get() {
    return this.configuracionService.get();
  }

  @Put()
  update(@Body() updateConfiguracionDto: UpdateConfiguracionDto) {
    return this.configuracionService.update(updateConfiguracionDto);
  }

  @Get('siguiente-numero')
  getSiguienteNumero() {
    return this.configuracionService.getSiguienteNumero();
  }
}
