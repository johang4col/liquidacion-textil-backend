import { IsString, IsOptional } from 'class-validator';

export class UploadFotoDto {
  @IsOptional()
  @IsString()
  categoria?: string;
}
