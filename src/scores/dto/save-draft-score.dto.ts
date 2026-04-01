import { Max, Min, ValidateIf, IsInt } from 'class-validator';

export class SaveDraftScoreDto {
  @ValidateIf((_obj, value) => value !== undefined && value !== null)
  @IsInt()
  @Min(0)
  @Max(40)
  supervisorScore?: number | null;

  @ValidateIf((_obj, value) => value !== undefined && value !== null)
  @IsInt()
  @Min(0)
  @Max(50)
  industryScore?: number | null;
}
