import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateMatchDto {
  @IsNotEmpty()
  @IsNumber()
  p1_id: number;

  @IsNotEmpty()
  @IsNumber()
  p2_id: number;

  @IsNotEmpty()
  @IsNumber()
  winner_id: number;

  @IsNotEmpty()
  @IsNumber()
  p1_score: number;

  @IsNotEmpty()
  @IsNumber()
  p2_score: number;

  @IsNotEmpty()
  @IsNumber()
  p1_class_id: number;

  @IsNotEmpty()
  @IsNumber()
  p2_class_id: number;
}
