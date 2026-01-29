import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateClienteDto, UpdateClienteDto } from './dto';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async create(createClienteDto: CreateClienteDto) {
    const cliente = await this.prisma.cliente.create({
      data: {
        id: `cli_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        ...createClienteDto,
      },
    });

    return cliente;
  }

  async findAll(q?: string) {
    const clientes = await this.prisma.cliente.findMany({
      where: q
        ? {
            OR: [
              { nombre: { contains: q, mode: 'insensitive' } },
              { nit: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: {
        id: true,
        nombre: true,
        nit: true,
        telefono: true,
        createdAt: true,
        updatedAt: true,
        liquidaciones: {
          select: {
            id: true,
            rollos: {
              select: {
                espigas: {
                  select: {
                    largoTrazo: true,
                    numeroCapas: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return clientes.map((cliente) => {
      const liquidacionesCount = cliente.liquidaciones.length;

      const metrosProcesados = cliente.liquidaciones.reduce((totalLiq, liq) => {
        const consumoLiq = liq.rollos.reduce((totalRollo, rollo) => {
          const consumoRollo = rollo.espigas.reduce(
            (totalEspiga, espiga) =>
              totalEspiga + espiga.largoTrazo * espiga.numeroCapas,
            0,
          );
          return totalRollo + consumoRollo;
        }, 0);
        return totalLiq + consumoLiq;
      }, 0);

      // ✅ Usamos rest operator para excluir liquidaciones sin crear variable no usada
      return {
        id: cliente.id,
        nombre: cliente.nombre,
        nit: cliente.nit,
        telefono: cliente.telefono,
        createdAt: cliente.createdAt,
        updatedAt: cliente.updatedAt,
        _count: {
          liquidaciones: liquidacionesCount,
        },
        metrosProcesados: Math.round(metrosProcesados * 100) / 100,
      };
    });
  }

  async findOne(id: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        nit: true,
        telefono: true,
        email: true,
        direccion: true,
        createdAt: true,
        updatedAt: true,
        // ✅ Para detalle, traemos más info pero estructurada
        liquidaciones: {
          select: {
            id: true,
            numero: true,
            fecha: true,
            ordenProduccion: true,
            referencia: true,
            estado: true,
            createdAt: true,
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
            fecha: 'desc',
          },
        },
      },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // ✅ Enriquecer liquidaciones con totales calculados
    const liquidacionesConTotales = cliente.liquidaciones.map((liq) => {
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
        ordenProduccion: liq.ordenProduccion,
        referencia: liq.referencia,
        estado: liq.estado,
        createdAt: liq.createdAt,
        metrosIniciales: Math.round(metrosIniciales * 100) / 100,
        consumoTotal: Math.round(consumoTotal * 100) / 100,
        diferencia: Math.round(diferencia * 100) / 100,
      };
    });

    return {
      ...cliente,
      liquidaciones: liquidacionesConTotales,
    };
  }

  async update(id: string, updateClienteDto: UpdateClienteDto) {
    try {
      const cliente = await this.prisma.cliente.update({
        where: { id },
        data: updateClienteDto,
      });

      return cliente;
    } catch (error: unknown) {
      // ✅ Type guard para verificar si es un error de Prisma
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Cliente no encontrado');
      }
      throw error;
    }
  }

  async remove(id: string) {
    // ✅ OPTIMIZADO: Una sola query con count
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        _count: {
          select: { liquidaciones: true },
        },
      },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Bloquear si tiene liquidaciones
    if (cliente._count.liquidaciones > 0) {
      throw new ConflictException(
        `No se puede eliminar el cliente porque tiene ${cliente._count.liquidaciones} liquidación(es) asociada(s)`,
      );
    }

    await this.prisma.cliente.delete({
      where: { id },
    });

    return {
      message: 'Cliente eliminado exitosamente',
    };
  }
}
