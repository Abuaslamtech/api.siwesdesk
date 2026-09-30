import { IsInt, Max, Min } from 'class-validator';

export class SubmitScoreDto {
  @IsInt()
  @Min(0)
  @Max(40)
  supervisorScore: number;

  @IsInt()
  @Min(0)
  @Max(60)
  industryScore: number;
}
