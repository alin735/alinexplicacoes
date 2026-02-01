import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    const accessCode = await prisma.accessCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!accessCode) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Código inválido' 
      }, { status: 400 });
    }

    if (accessCode.isUsed) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Este código já foi utilizado' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      valid: true, 
      codeId: accessCode.id 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao validar código' }, { status: 500 });
  }
}