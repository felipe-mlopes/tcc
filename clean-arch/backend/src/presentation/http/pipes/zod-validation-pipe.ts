import { BadRequestException, PipeTransform } from "@nestjs/common";
import { ZodType, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export class ZodValidationPipe implements PipeTransform {
    constructor(readonly schema: ZodType) {}

    transform(value: unknown) {
        try {
            const parsed = this.schema.safeParse(value);
            return parsed
        } catch (error) {
            if (error instanceof ZodError) {
                throw new BadRequestException({
                    message: 'Validation failed',
                    statusCode: 400,
                    errors: fromZodError(error)
                });
            }
            
            throw new BadRequestException('Validation failed');
        }

    }
}