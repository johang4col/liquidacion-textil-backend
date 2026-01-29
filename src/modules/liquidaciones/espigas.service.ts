import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateEspigaDto, UpdateEspigaDto } from './dto';

@Injectable()
export class EspigasService {
  constructor(private prisma: PrismaService) {}

  // Método privado para verificar rollo y su liquidación
  private async verificarRolloYLiquidacion(rolloId: string) {
    const rollo = await this.prisma.rollo.findUnique({
      where: { id: rolloId },
      include: {
        liquidacion: {
          select: { estado: true },
        },
      },
    });

    if (!rollo) {
      throw new NotFoundException('Rollo no encontrado');
    }

    if (rollo.liquidacion.estado === 'finalizada') {
      throw new ConflictException(
        'No se puede modificar una liquidación finalizada',
      );
    }

    return rollo;
  }

  async create(rolloId: string, createEspigaDto: CreateEspigaDto) {
    await this.verificarRolloYLiquidacion(rolloId);

    // Obtener el siguiente número de espiga
    const ultimaEspiga = await this.prisma.espiga.findFirst({
      where: { rolloId },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });

    const numero = ultimaEspiga ? ultimaEspiga.numero + 1 : 1;

    const espiga = await this.prisma.espiga.create({
      data: {
        id: `esp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        rolloId,
        numero,
        ...createEspigaDto,
      },
    });

    return espiga;
  }

  async update(
    rolloId: string,
    espigaId: string,
    updateEspigaDto: UpdateEspigaDto,
  ) {
    await this.verificarRolloYLiquidacion(rolloId);

    // Verificar que la espiga pertenece al rollo
    const espiga = await this.prisma.espiga.findFirst({
      where: {
        id: espigaId,
        rolloId,
      },
    });

    if (!espiga) {
      throw new NotFoundException('Espiga no encontrada');
    }

    const espigaActualizada = await this.prisma.espiga.update({
      where: { id: espigaId },
      data: updateEspigaDto,
    });

    return espigaActualizada;
  }

  async remove(rolloId: string, espigaId: string) {
    await this.verificarRolloYLiquidacion(rolloId);

    // Verificar que la espiga pertenece al rollo
    const espiga = await this.prisma.espiga.findFirst({
      where: {
        id: espigaId,
        rolloId,
      },
      select: { numero: true },
    });

    if (!espiga) {
      throw new NotFoundException('Espiga no encontrada');
    }

    // Eliminar espiga
    await this.prisma.espiga.delete({
      where: { id: espigaId },
    });

    // Renumerar espigas posteriores
    await this.prisma.espiga.updateMany({
      where: {
        rolloId,
        numero: { gt: espiga.numero },
      },
      data: {
        numero: { decrement: 1 },
      },
    });

    return {
      message: 'Espiga eliminada exitosamente',
    };
  }
}
