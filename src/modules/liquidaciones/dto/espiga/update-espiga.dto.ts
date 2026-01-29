import { IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateEspigaDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  largoTrazo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  numeroCapas?: number;
}
