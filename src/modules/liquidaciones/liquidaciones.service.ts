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

    // Obtener siguiente número y buscar uno disponible
    const config = await this.prisma.configuracion.findFirst();
    let siguienteNumero = config?.siguienteNumero || 1;

    // Verificar si el número ya existe (por liquidaciones restauradas)
    // y buscar el siguiente disponible
    let numero = String(siguienteNumero).padStart(6, '0');
    let existe = await this.prisma.liquidacion.findUnique({
      where: { numero },
      select: { id: true },
    });

    while (existe) {
      siguienteNumero++;
      numero = String(siguienteNumero).padStart(6, '0');
      existe = await this.prisma.liquidacion.findUnique({
        where: { numero },
        select: { id: true },
      });
    }

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
          materialPrincipal: createLiquidacionDto.materialPrincipal,
          observaciones: createLiquidacionDto.observaciones,
          estado: createLiquidacionDto.estado || 'borrador',
          muestraFisica: createLiquidacionDto.muestraFisica ?? false,
          retazosConfeccion: createLiquidacionDto.retazosConfeccion ?? false,
          retazosConfeccionMetros: createLiquidacionDto.retazosConfeccionMetros,
          plantillas: createLiquidacionDto.plantillas ?? false,
          estampadoPiezas: createLiquidacionDto.estampadoPiezas,
          bordadoPiezas: createLiquidacionDto.bordadoPiezas,
          fusionadosPiezas: createLiquidacionDto.fusionadosPiezas,
          registroTiqueteadas: (createLiquidacionDto.registroTiqueteadas || undefined) as any,
          despachoPaquetes: createLiquidacionDto.despachoPaquetes,
          despachoRollos: createLiquidacionDto.despachoRollos,
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

      // Actualizar contador al siguiente después del que se usó
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

  async findAll(incluirEliminadas = false) {
    const liquidaciones = await this.prisma.liquidacion.findMany({
      where: {
        eliminada: incluirEliminadas ? true : false,
      },
      select: {
        id: true,
        numero: true,
        fecha: true,
        estado: true,
        ordenProduccion: true,
        referencia: true,
        eliminada: true,
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
            retazos: true,
            sesgos: true,
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
        const consumoEspigas = rollo.espigas.reduce(
          (accEspiga, espiga) =>
            accEspiga + espiga.largoTrazo * espiga.numeroCapas,
          0,
        );
        const consumoRollo = consumoEspigas + rollo.retazos + rollo.sesgos;
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
        eliminada: liq.eliminada,
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
        fotos: {
          orderBy: {
            createdAt: 'asc',
          },
        },
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
      const dataToUpdate: Record<string, unknown> = {};

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

      if (updateLiquidacionDto.materialPrincipal !== undefined) {
        dataToUpdate.materialPrincipal = updateLiquidacionDto.materialPrincipal;
      }

      if (updateLiquidacionDto.observaciones !== undefined) {
        dataToUpdate.observaciones = updateLiquidacionDto.observaciones;
      }

      if (updateLiquidacionDto.estado) {
        dataToUpdate.estado = updateLiquidacionDto.estado;
      }

      // Checkboxes
      if (updateLiquidacionDto.muestraFisica !== undefined) {
        dataToUpdate.muestraFisica = updateLiquidacionDto.muestraFisica;
      }

      if (updateLiquidacionDto.retazosConfeccion !== undefined) {
        dataToUpdate.retazosConfeccion = updateLiquidacionDto.retazosConfeccion;
      }

      if (updateLiquidacionDto.retazosConfeccionMetros !== undefined) {
        dataToUpdate.retazosConfeccionMetros = updateLiquidacionDto.retazosConfeccionMetros;
      }

      if (updateLiquidacionDto.plantillas !== undefined) {
        dataToUpdate.plantillas = updateLiquidacionDto.plantillas;
      }

      // Procesos
      if (updateLiquidacionDto.estampadoPiezas !== undefined) {
        dataToUpdate.estampadoPiezas = updateLiquidacionDto.estampadoPiezas;
      }

      if (updateLiquidacionDto.bordadoPiezas !== undefined) {
        dataToUpdate.bordadoPiezas = updateLiquidacionDto.bordadoPiezas;
      }

      if (updateLiquidacionDto.fusionadosPiezas !== undefined) {
        dataToUpdate.fusionadosPiezas = updateLiquidacionDto.fusionadosPiezas;
      }

      // Registro tiqueteadas
      if (updateLiquidacionDto.registroTiqueteadas !== undefined) {
        dataToUpdate.registroTiqueteadas = updateLiquidacionDto.registroTiqueteadas;
      }

      // Despacho
      if (updateLiquidacionDto.despachoPaquetes !== undefined) {
        dataToUpdate.despachoPaquetes = updateLiquidacionDto.despachoPaquetes;
      }

      if (updateLiquidacionDto.despachoRollos !== undefined) {
        dataToUpdate.despachoRollos = updateLiquidacionDto.despachoRollos;
      }

      const liquidacion = await this.prisma.liquidacion.update({
        where: { id },
        data: dataToUpdate as any,
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

    // Soft delete: marcar como eliminada en vez de borrar
    await this.prisma.liquidacion.update({
      where: { id },
      data: { eliminada: true },
    });

    return {
      message: 'Liquidación eliminada exitosamente',
    };
  }

  async restaurar(id: string) {
    const liquidacion = await this.prisma.liquidacion.findUnique({
      where: { id },
      select: { eliminada: true },
    });

    if (!liquidacion) {
      throw new NotFoundException('Liquidación no encontrada');
    }

    if (!liquidacion.eliminada) {
      throw new ConflictException('La liquidación no está eliminada');
    }

    await this.prisma.liquidacion.update({
      where: { id },
      data: { eliminada: false },
    });

    return {
      message: 'Liquidación restaurada exitosamente',
    };
  }
}
