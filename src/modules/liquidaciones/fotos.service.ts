import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
import { v2 as cloudinary } from 'cloudinary';
import { UploadFotoDto } from './dto';

const MAX_FOTOS_POR_LIQUIDACION = 5;

@Injectable()
export class FotosService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(
    liquidacionId: string,
    file: Express.Multer.File,
    uploadFotoDto: UploadFotoDto,
  ) {
    // Verificar que la liquidación existe
    const liquidacion = await this.prisma.liquidacion.findUnique({
      where: { id: liquidacionId },
      select: { id: true, estado: true, _count: { select: { fotos: true } } },
    });

    if (!liquidacion) {
      throw new NotFoundException('Liquidación no encontrada');
    }

    // Verificar límite de fotos
    if (liquidacion._count.fotos >= MAX_FOTOS_POR_LIQUIDACION) {
      throw new BadRequestException(
        `Máximo ${MAX_FOTOS_POR_LIQUIDACION} fotos por liquidación`,
      );
    }

    // Subir a Cloudinary
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: `liquidaciones/${liquidacionId}`,
              resource_type: 'image',
              transformation: [
                { quality: 'auto', fetch_format: 'auto' },
              ],
            },
            (error, result) => {
              if (error || !result) {
                reject(error || new Error('Error al subir imagen'));
              } else {
                resolve({
                  secure_url: result.secure_url,
                  public_id: result.public_id,
                });
              }
            },
          )
          .end(file.buffer);
      },
    );

    // Guardar en BD
    const foto = await this.prisma.foto.create({
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        categoria: uploadFotoDto.categoria || null,
        liquidacionId,
      },
    });

    return foto;
  }

  async remove(fotoId: string) {
    const foto = await this.prisma.foto.findUnique({
      where: { id: fotoId },
    });

    if (!foto) {
      throw new NotFoundException('Foto no encontrada');
    }

    // Eliminar de Cloudinary
    try {
      await cloudinary.uploader.destroy(foto.publicId);
    } catch {
      // Si falla en Cloudinary, igual eliminamos de BD
    }

    // Eliminar de BD
    await this.prisma.foto.delete({
      where: { id: fotoId },
    });

    return { message: 'Foto eliminada exitosamente' };
  }
}
