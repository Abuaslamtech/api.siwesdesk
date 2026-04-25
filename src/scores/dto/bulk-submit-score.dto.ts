import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class BulkScoreEntryDto {
  @IsUUID()
  studentId: string;

  @IsInt()
  @Min(0)
  @Max(40)
  supervisorScore: number;

  @IsInt()
  @Min(0)
  @Max(50)
  industryScore: number;
}

export class BulkSubmitScoreDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkScoreEntryDto)
  entries: BulkScoreEntryDto[];
}
