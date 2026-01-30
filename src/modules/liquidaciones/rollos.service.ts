import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateRolloDto, UpdateRolloDto } from './dto';

@Injectable()
export class RollosService {
  constructor(private prisma: PrismaService) {}

  // Método privado para verificar liquidación
  private async verificarLiquidacion(liquidacionId: string) {
    const liquidacion = await this.prisma.liquidacion.findUnique({
      where: { id: liquidacionId },
      select: { id: true, estado: true },
    });

    if (!liquidacion) {
      throw new NotFoundException('Liquidación no encontrada');
    }

    if (liquidacion.estado === 'finalizada') {
      throw new ConflictException(
        'No se puede modificar una liquidación finalizada',
      );
    }

    return liquidacion;
  }

  async create(liquidacionId: string, createRolloDto: CreateRolloDto) {
    const liquidacion = await this.verificarLiquidacion(liquidacionId);

    // Obtener el siguiente número de rollo
    const ultimoRollo = await this.prisma.rollo.findFirst({
      where: { liquidacionId },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });

    const numero = ultimoRollo ? ultimoRollo.numero + 1 : 1;

    const rollo = await this.prisma.rollo.create({
      data: {
        id: `rol_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        liquidacionId,
        numero,
        ...createRolloDto,
      },
      include: {
        espigas: true,
      },
    });

    // Si es el primer rollo, cambiar estado a en_proceso
    if (numero === 1 && liquidacion.estado === 'borrador') {
      await this.prisma.liquidacion.update({
        where: { id: liquidacionId },
        data: { estado: 'en_proceso' },
      });
    }

    return rollo;
  }

  async update(
    liquidacionId: string,
    rolloId: string,
    updateRolloDto: UpdateRolloDto,
  ) {
    await this.verificarLiquidacion(liquidacionId);

    // Verificar que el rollo pertenece a la liquidación
    const rollo = await this.prisma.rollo.findFirst({
      where: {
        id: rolloId,
        liquidacionId,
      },
    });

    if (!rollo) {
      throw new NotFoundException('Rollo no encontrado');
    }

    const rolloActualizado = await this.prisma.rollo.update({
      where: { id: rolloId },
      data: updateRolloDto,
      include: {
        espigas: true,
      },
    });

    return rolloActualizado;
  }

  async remove(liquidacionId: string, rolloId: string) {
    await this.verificarLiquidacion(liquidacionId);

    // Verificar que el rollo pertenece a la liquidación
    const rollo = await this.prisma.rollo.findFirst({
      where: {
        id: rolloId,
        liquidacionId,
      },
      select: { numero: true },
    });

    if (!rollo) {
      throw new NotFoundException('Rollo no encontrado');
    }

    // Eliminar rollo (espigas se eliminan en cascada)
    await this.prisma.rollo.delete({
      where: { id: rolloId },
    });

    // Renumerar rollos posteriores
    await this.prisma.rollo.updateMany({
      where: {
        liquidacionId,
        numero: { gt: rollo.numero },
      },
      data: {
        numero: { decrement: 1 },
      },
    });

    return {
      message: 'Rollo eliminado exitosamente',
    };
  }

  async duplicar(liquidacionId: string, rolloId: string) {
    await this.verificarLiquidacion(liquidacionId);

    // Obtener el rollo original con sus espigas
    const rolloOriginal = await this.prisma.rollo.findFirst({
      where: {
        id: rolloId,
        liquidacionId,
      },
      include: {
        espigas: {
          orderBy: { numero: 'asc' },
        },
      },
    });

    if (!rolloOriginal) {
      throw new NotFoundException('Rollo no encontrado');
    }

    // Obtener el siguiente número de rollo
    const ultimoRollo = await this.prisma.rollo.findFirst({
      where: { liquidacionId },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });

    const nuevoNumero = ultimoRollo ? ultimoRollo.numero + 1 : 1;

    // Crear el nuevo rollo con sus espigas en una transacción
    const nuevoRollo = await this.prisma.$transaction(async (tx) => {
      // Crear rollo duplicado
      const rollo = await tx.rollo.create({
        data: {
          id: `rol_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          liquidacionId,
          numero: nuevoNumero,
          colorTela: rolloOriginal.colorTela,
          colorHex: rolloOriginal.colorHex,
          metrosIniciales: rolloOriginal.metrosIniciales,
          retazos: rolloOriginal.retazos,
          sesgos: rolloOriginal.sesgos,
        },
      });

      // Duplicar espigas si existen
      if (rolloOriginal.espigas.length > 0) {
        await tx.espiga.createMany({
          data: rolloOriginal.espigas.map((espiga, index) => ({
            id: `esp_${Date.now()}_${index}_${Math.random().toString(36).substring(7)}`,
            rolloId: rollo.id,
            numero: espiga.numero,
            largoTrazo: espiga.largoTrazo,
            numeroCapas: espiga.numeroCapas,
          })),
        });
      }

      // Retornar rollo con espigas
      return tx.rollo.findUnique({
        where: { id: rollo.id },
        include: {
          espigas: {
            orderBy: { numero: 'asc' },
          },
        },
      });
    });

    return nuevoRollo;
  }
}
