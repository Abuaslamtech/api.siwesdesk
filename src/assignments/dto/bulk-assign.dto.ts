import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class BulkAssignDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  studentIds: string[];

  @IsUUID('4')
  supervisorId: string;
}
