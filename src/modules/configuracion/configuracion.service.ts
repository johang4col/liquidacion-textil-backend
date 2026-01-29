import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { UpdateConfiguracionDto } from './dto';

@Injectable()
export class ConfiguracionService {
  constructor(private prisma: PrismaService) {}

  async get() {
    // Buscar configuración existente
    let config = await this.prisma.configuracion.findFirst();

    // Si no existe, crear con valores por defecto
    if (!config) {
      config = await this.prisma.configuracion.create({
        data: {
          id: `cfg_${Date.now()}`,
          nombreEmpresa: 'RED W & GOLD S.A.S',
          telefono: '320 694 81 38',
          siguienteNumero: 1,
          prefijoLiquidacion: '',
        },
      });
    }

    return config;
  }

  async update(updateConfiguracionDto: UpdateConfiguracionDto) {
    // Obtener configuración actual (o crear si no existe)
    const configActual = await this.get();

    const config = await this.prisma.configuracion.update({
      where: { id: configActual.id },
      data: updateConfiguracionDto,
    });

    return config;
  }

  async getSiguienteNumero() {
    const config = await this.get();
    const numero = String(config.siguienteNumero).padStart(6, '0');
    const prefijo = config.prefijoLiquidacion || '';

    return {
      siguienteNumero: config.siguienteNumero,
      numeroFormateado: `${prefijo}${numero}`,
    };
  }
}
