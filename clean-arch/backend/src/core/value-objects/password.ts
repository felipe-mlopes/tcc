export class Password {
  private constructor(private readonly value: string) {}

  public static create(password: string): Password {
    if (!password || password.trim().length === 0) {
      throw new Error('Senha é obrigatória');
    }

    if (password.length < 6) {
      throw new Error('Senha deve ter no mínimo 6 caracteres');
    }

    if (!/[A-Z]/.test(password)) {
      throw new Error('Senha deve conter pelo menos uma letra maiúscula');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new Error('Senha deve conter pelo menos um símbolo');
    }

    return new Password(password);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: Password): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}