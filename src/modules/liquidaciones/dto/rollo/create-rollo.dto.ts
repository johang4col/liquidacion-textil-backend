import { IsString, IsNumber, Min } from 'class-validator';

export class CreateRolloDto {
  @IsString()
  colorTela: string;

  @IsString()
  colorHex: string;

  @IsNumber()
  @Min(0)
  metrosIniciales: number;
}
