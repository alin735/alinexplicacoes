import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, email, schoolYear, hoursPerWeek, date, codeId } = await request.json();

    // Valida se o código ainda está disponível
    const accessCode = await prisma.accessCode.findUnique({
      where: { id: codeId }
    });

    if (!accessCode || accessCode.isUsed) {
      return NextResponse.json({ 
        error: 'Código inválido ou já utilizado' 
      }, { status: 400 });
    }

    // Cria a marcação
    const booking = await prisma.booking.create({
      data: {
        name,
        email,
        schoolYear,
        hoursPerWeek,
        date: new Date(date),
        codeId
      }
    });

    // Marca o código como usado
    await prisma.accessCode.update({
      where: { id: codeId },
      data: { 
        isUsed: true,
        usedAt: new Date()
      }
    });

    // Envia email de confirmação
    await resend.emails.send({
      from: 'Explicações <onboarding@resend.dev>',
      to: email,
      subject: 'Marcação Confirmada ✓',
      html: `
        <h2>Olá ${name}!</h2>
        <p>A sua sessão de explicações foi marcada com sucesso.</p>
        <p><strong>Data:</strong> ${new Date(date).toLocaleString('pt-PT')}</p>
        <p><strong>Ano escolar:</strong> ${schoolYear}</p>
        <p><strong>Horas por semana:</strong> ${hoursPerWeek}</p>
        <br>
        <p>Receberá lembretes automáticos:</p>
        <ul>
          <li>24 horas antes</li>
          <li>1 hora antes</li>
          <li>15 minutos antes</li>
        </ul>
      `
    });

    return NextResponse.json({ 
      success: true, 
      bookingId: booking.id 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao criar marcação' }, { status: 500 });
  }
}