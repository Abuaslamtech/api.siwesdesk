import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class MarkBulkDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  matricNos: string[];
}
