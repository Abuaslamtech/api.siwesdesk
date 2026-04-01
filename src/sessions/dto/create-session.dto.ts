import { IsInt, Max, Min } from 'class-validator';

export class CreateSessionDto {
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
}
