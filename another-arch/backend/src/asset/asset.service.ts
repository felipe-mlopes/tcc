import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AssetService {
  constructor(private prisma: PrismaService) {}

  async create(createAssetDto: CreateAssetDto) {
    try {
      return await this.prisma.asset.create({
        data: createAssetDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Símbolo já cadastrado');
        }
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.asset.findMany({
      include: {
        investments: true,
      },
    });
  }

  async findOne(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        investments: {
          include: {
            portfolio: {
              include: {
                investor: true,
              },
            },
          },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException(`Ativo com ID ${id} não encontrado`);
    }

    return asset;
  }
}
