export class AuthenticateInvestorErrorDto {
  /**
   * Código do status HTTP
   * @example 401
   */
  statusCode: number;

  /**
   * Mensagem de erro
   * @example "Credenciais inválidas"
   */
  message: string;

  /**
   * Timestamp do erro
   * @example "2024-01-15T10:30:00Z"
   */
  timestamp: string;

  /**
   * Caminho da requisição
   * @example "/investor/auth"
   */
  path: string;
}