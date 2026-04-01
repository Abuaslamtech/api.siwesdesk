import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { StudentUploadRowDto } from './student-upload-row.dto';

export class UploadStudentsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StudentUploadRowDto)
  students: StudentUploadRowDto[];
}
