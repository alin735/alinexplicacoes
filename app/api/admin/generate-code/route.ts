export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Cria uma instância global do Prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function POST(request: Request) {
  try {
    const { adminKey } = await request.json();

    console.log('Admin key recebida:', adminKey ? 'Presente' : 'Ausente');
    console.log('Admin key esperada:', process.env.ADMIN_SECRET_KEY ? 'Configurada' : 'Não configurada');

    if (!process.env.ADMIN_SECRET_KEY) {
      console.error('ADMIN_SECRET_KEY não está configurada no .env');
      return NextResponse.json({ error: 'Configuração do servidor incorreta' }, { status: 500 });
    }

    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      console.error('Chave admin incorreta');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const code = crypto.randomBytes(4).toString('hex').toUpperCase();

    console.log('Tentando criar código:', code);

    const accessCode = await prisma.accessCode.create({
      data: { code }
    });

    console.log('Código criado com sucesso:', accessCode);

    return NextResponse.json({
      success: true,
      code: accessCode.code
    });
  } catch (error) {
    console.error('Erro detalhado:', error);
    return NextResponse.json({
      error: 'Erro ao gerar código',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
