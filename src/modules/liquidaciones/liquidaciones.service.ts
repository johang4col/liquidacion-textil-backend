import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  CreateLiquidacionDto,
  UpdateLiquidacionDto,
  UpdateEstadoDto,
} from './dto';
import { EstadoLiquidacion } from '@/generated/prisma/enums';

@Injectable()
export class LiquidacionesService {
  constructor(private prisma: PrismaService) {}

  async create(createLiquidacionDto: CreateLiquidacionDto) {
    // Verificar que el cliente existe
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: createLiquidacionDto.clienteId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Obtener siguiente número
    const config = await this.prisma.configuracion.findFirst();
    const siguienteNumero = config?.siguienteNumero || 1;
    const numero = String(siguienteNumero).padStart(6, '0');

    // Crear liquidación y actualizar contador en transacción
    const liquidacion = await this.prisma.$transaction(async (tx) => {
      const nuevaLiquidacion = await tx.liquidacion.create({
        data: {
          id: `liq_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          numero,
          fecha: new Date(createLiquidacionDto.fecha),
          clienteId: createLiquidacionDto.clienteId,
          ordenProduccion: createLiquidacionDto.ordenProduccion,
          referencia: createLiquidacionDto.referencia,
          observaciones: createLiquidacionDto.observaciones,
          estado: createLiquidacionDto.estado || 'borrador',
        },
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              nit: true,
              telefono: true,
            },
          },
        },
      });

      // Actualizar contador
      if (config) {
        await tx.configuracion.update({
          where: { id: config.id },
          data: { siguienteNumero: siguienteNumero + 1 },
        });
      } else {
        await tx.configuracion.create({
          data: {
            id: `cfg_${Date.now()}`,
            siguienteNumero: siguienteNumero + 1,
          },
        });
      }

      return nuevaLiquidacion;
    });

    return liquidacion;
  }

  async findAll() {
    const liquidaciones = await this.prisma.liquidacion.findMany({
      select: {
        id: true,
        numero: true,
        fecha: true,
        estado: true,
        ordenProduccion: true,
        referencia: true,
        createdAt: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
          },
        },
        rollos: {
          select: {
            metrosIniciales: true,
            espigas: {
              select: {
                largoTrazo: true,
                numeroCapas: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calcular totales en memoria
    return liquidaciones.map((liq) => {
      const metrosIniciales = liq.rollos.reduce(
        (acc, rollo) => acc + rollo.metrosIniciales,
        0,
      );

      const consumoTotal = liq.rollos.reduce((accRollo, rollo) => {
        const consumoRollo = rollo.espigas.reduce(
          (accEspiga, espiga) =>
            accEspiga + espiga.largoTrazo * espiga.numeroCapas,
          0,
        );
        return accRollo + consumoRollo;
      }, 0);

      const diferencia = metrosIniciales - consumoTotal;

      return {
        id: liq.id,
        numero: liq.numero,
        fecha: liq.fecha,
        estado: liq.estado,
        ordenProduccion: liq.ordenProduccion,
        referencia: liq.referencia,
        createdAt: liq.createdAt,
        cliente: liq.cliente,
        metrosIniciales: Math.round(metrosIniciales * 100) / 100,
        consumoTotal: Math.round(consumoTotal * 100) / 100,
        diferencia: Math.round(diferencia * 100) / 100,
      };
    });
  }

  async findOne(id: string) {
    const liquidacion = await this.prisma.liquidacion.findUnique({
      where: { id },
      include: {
        cliente: true,
        rollos: {
          include: {
            espigas: {
              orderBy: {
                numero: 'asc',
              },
            },
          },
          orderBy: {
            numero: 'asc',
          },
        },
      },
    });

    if (!liquidacion) {
      throw new NotFoundException('Liquidación no encontrada');
    }

    return liquidacion;
  }

  async update(id: string, updateLiquidacionDto: UpdateLiquidacionDto) {
    try {
      // Construir objeto de actualización de forma segura
      const dataToUpdate: {
        fecha?: Date;
        clienteId?: string;
        ordenProduccion?: string | null;
        referencia?: string | null;
        observaciones?: string | null;
        estado?: EstadoLiquidacion;
      } = {};

      if (updateLiquidacionDto.fecha) {
        dataToUpdate.fecha = new Date(updateLiquidacionDto.fecha);
      }

      if (updateLiquidacionDto.clienteId) {
        dataToUpdate.clienteId = updateLiquidacionDto.clienteId;
      }

      if (updateLiquidacionDto.ordenProduccion !== undefined) {
        dataToUpdate.ordenProduccion = updateLiquidacionDto.ordenProduccion;
      }

      if (updateLiquidacionDto.referencia !== undefined) {
        dataToUpdate.referencia = updateLiquidacionDto.referencia;
      }

      if (updateLiquidacionDto.observaciones !== undefined) {
        dataToUpdate.observaciones = updateLiquidacionDto.observaciones;
      }

      if (updateLiquidacionDto.estado) {
        dataToUpdate.estado = updateLiquidacionDto.estado;
      }

      const liquidacion = await this.prisma.liquidacion.update({
        where: { id },
        data: dataToUpdate,
        include: {
          cliente: true,
        },
      });

      return liquidacion;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Liquidación no encontrada');
      }
      throw error;
    }
  }

  async updateEstado(id: string, updateEstadoDto: UpdateEstadoDto) {
    try {
      const liquidacion = await this.prisma.liquidacion.update({
        where: { id },
        data: {
          estado: updateEstadoDto.estado,
        },
      });

      return liquidacion;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Liquidación no encontrada');
      }
      throw error;
    }
  }

  async remove(id: string) {
    // Verificar estado
    const liquidacion = await this.prisma.liquidacion.findUnique({
      where: { id },
      select: { estado: true },
    });

    if (!liquidacion) {
      throw new NotFoundException('Liquidación no encontrada');
    }

    if (liquidacion.estado === 'finalizada') {
      throw new ConflictException(
        'No se puede eliminar una liquidación finalizada',
      );
    }

    await this.prisma.liquidacion.delete({
      where: { id },
    });

    return {
      message: 'Liquidación eliminada exitosamente',
    };
  }
}
