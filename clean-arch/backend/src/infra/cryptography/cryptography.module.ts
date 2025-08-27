import { Encrypter } from "@/domain/investor/cryptography/encrypter";
import { Module } from "@nestjs/common";
import { JwtEncrypter } from "./jwt-encrypter";
import { HashGenerator } from "@/domain/investor/cryptography/hash-generator";
import { BcryptHasher } from "./bcrypt-hasher";
import { HashComparer } from "@/domain/investor/cryptography/hash-comparer";

@Module({
    providers: [
        {
        provide: Encrypter,
        useClass: JwtEncrypter,
        },
        {
        provide: HashGenerator,
        useClass: BcryptHasher,
        },
        {
        provide: HashComparer,
        useClass: BcryptHasher,
        },
    ],
    exports: [Encrypter, HashGenerator, HashComparer]
})
export class CryptographyModule {}