import { IsNumber, Min, IsOptional, IsObject } from 'class-validator';

export class CreateEspigaDto {
  @IsNumber()
  @Min(0)
  largoTrazo: number;

  @IsNumber()
  @Min(0)
  numeroCapas: number;

  @IsOptional()
  @IsObject()
  distribucionTallas?: Record<string, number>;
}
