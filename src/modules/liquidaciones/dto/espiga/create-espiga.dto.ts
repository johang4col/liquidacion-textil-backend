import { IsNumber, Min } from 'class-validator';

export class CreateEspigaDto {
  @IsNumber()
  @Min(0)
  largoTrazo: number;

  @IsNumber()
  @Min(0)
  numeroCapas: number;
}
