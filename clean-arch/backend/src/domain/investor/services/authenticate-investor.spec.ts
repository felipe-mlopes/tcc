import { InMemoryInvestorRepository } from "test/repositories/in-memory-investor-repository"
import { AuthenticateInvestorService } from "./authenticate-investor"
import { makeInvestor } from "test/factories/make-investor"
import { FakeHasher } from "test/cryptography/fake-hasher"
import { FakeEncrypter } from "test/cryptography/fake-encrypter"
import { WrongCredentialsError } from "@/core/errors/wrong-credentials-error"

let inMemoryInvestorRepository: InMemoryInvestorRepository
let fakeHasher: FakeHasher
let fakeEncrypter: FakeEncrypter
let sut: AuthenticateInvestorService

describe("Authenticate Investor", () => {
  beforeEach(() => {
    inMemoryInvestorRepository = new InMemoryInvestorRepository()
    fakeHasher = new FakeHasher()
    fakeEncrypter = new FakeEncrypter()
    sut = new AuthenticateInvestorService(
      inMemoryInvestorRepository,
      fakeHasher,
      fakeEncrypter,
    )
  })

  it("should be able to authenticate an investor with valid credentials", async () => {
    // Arrange
    const investor = makeInvestor({
      password: await fakeHasher.hash("valid_password"),
    })
    await inMemoryInvestorRepository.create(investor)

    // Act
    const result = await sut.execute({
      email: investor.email,
      password: "valid_password",
    })

    // Assert
    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
        expect(result.value.accessToken).toBe("fake-token")
    }
  })

  it("should be not able to authenticate with wrong email", async () => {
    // Arrange
    const investor = makeInvestor({
      password: await fakeHasher.hash("any_password"),
    })
    await inMemoryInvestorRepository.create(investor)

    // Act
    const result = await sut.execute({
      email: "notfound@example.com",
      password: "any_password",
    })

    // Assert
    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WrongCredentialsError)
    }
  })

  it("should be not able to authenticate with wrong password", async () => {
    // Arrange
    const investor = makeInvestor({
      password: await fakeHasher.hash("correct_password"),
    })
    await inMemoryInvestorRepository.create(investor)

    // Act
    const result = await sut.execute({
      email: investor.email,
      password: "wrong_password",
    })

    // Assert
    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WrongCredentialsError)
    }
  })

  it("should be able to call encrypter with investor id", async () => {
    // Arrange
    const investor = makeInvestor({
      password: await fakeHasher.hash("valid_password"),
    })
    await inMemoryInvestorRepository.create(investor)

    const spyEncrypt = vi.spyOn(fakeEncrypter, "encrypt")

    // Act
    await sut.execute({
      email: investor.email,
      password: "valid_password",
    })

    // Assert
    expect(spyEncrypt).toHaveBeenCalledWith({ sub: investor.id.toString() })
  })
})
