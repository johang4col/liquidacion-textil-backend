import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './database/prisma/prisma.service';
import { Public } from './modules/auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('test-db')
  async testDatabase() {
    try {
      const cliente = await this.prisma.cliente.create({
        data: {
          id: 'test-' + Date.now(),
          nombre: 'Cliente de Prueba',
          nit: '123456789',
          telefono: '3001234567',
          email: 'test@example.com',
        },
      });

      const count = await this.prisma.cliente.count();

      return {
        success: true,
        message: '✅ Conexión exitosa a Railway',
        clienteCreado: cliente.nombre,
        totalClientes: count,
      };
    } catch (error) {
      return {
        success: false,
        message: '❌ Error de conexión',
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }
}
