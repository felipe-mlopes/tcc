import { Encrypter } from "@/domain/investor/cryptography/encrypter";

export class FakeEncrypter implements Encrypter {
  async encrypt(_: Record<string, unknown>): Promise<string> {
    return 'fake-token'
  }
}