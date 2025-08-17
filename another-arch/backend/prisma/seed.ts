import { PrismaClient, AssetType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Criar investidor exemplo
  const investor = await prisma.investor.upsert({
    where: { email: 'investor@example.com' },
    update: {},
    create: {
      name: 'João Investidor',
      email: 'investor@example.com',
      cpf: '12345678901',
      phone: '+55 11 99999-9999',
    },
  });

  // Criar ativos exemplo
  const asset1 = await prisma.asset.upsert({
    where: { symbol: 'PETR4' },
    update: {},
    create: {
      symbol: 'PETR4',
      name: 'Petrobras PN',
      type: AssetType.STOCK,
      sector: 'Energia',
      description: 'Ações preferenciais da Petrobras',
    },
  });

  const asset2 = await prisma.asset.upsert({
    where: { symbol: 'VALE3' },
    update: {},
    create: {
      symbol: 'VALE3',
      name: 'Vale ON',
      type: AssetType.STOCK,
      sector: 'Mineração',
      description: 'Ações ordinárias da Vale',
    },
  });

  // Criar portfolio
  const portfolio = await prisma.portfolio.upsert({
    where: { id: 'sample-portfolio' },
    update: {},
    create: {
      id: 'sample-portfolio',
      name: 'Meu Portfolio Principal',
      investorId: investor.id,
    },
  });

  console.log('✅ Seed executado com sucesso!');
  console.log({ investor, asset1, asset2, portfolio });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
