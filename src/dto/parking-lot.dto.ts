import { IsNotEmpty, IsString } from 'class-validator';

export class ParkCarRequestDto {
  @IsString()
  @IsNotEmpty()
  entranceID!: string;

  @IsString()
  @IsNotEmpty()
  vehicleType!: string;

  @IsString()
  @IsNotEmpty()
  licensePlate!: string;

  @IsString()
  @IsNotEmpty()
  entryTime!: string;
}

export class UnparkCarRequestDto {
  @IsString()
  @IsNotEmpty()
  licensePlate!: string;
}
