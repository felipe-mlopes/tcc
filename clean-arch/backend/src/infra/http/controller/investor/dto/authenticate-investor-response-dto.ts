import { ApiProperty } from "@nestjs/swagger";

export class AuthenticateInvestorResponseDto {
  @ApiProperty({
      description: 'Access Token',
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  })
  access_token: string;
}