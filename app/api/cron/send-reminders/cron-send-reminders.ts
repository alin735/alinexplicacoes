import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function GET(request: Request) {
  // Verificar se a requisição vem do Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    console.log('[Cron] Executando verificação de lembretes:', now.toISOString());

    // Busca todas as marcações futuras
    const bookings = await prisma.booking.findMany({
      where: {
        date: { gte: now }
      }
    });

    console.log(`[Cron] Encontradas ${bookings.length} marcações futuras`);

    let emailsSent = 0;

    for (const booking of bookings) {
      const timeDiff = booking.date.getTime() - now.getTime();
      const hoursUntil = timeDiff / (1000 * 60 * 60);
      const minutesUntil = timeDiff / (1000 * 60);

      // Email 24h antes
      if (hoursUntil <= 24 && hoursUntil > 23.75 && !booking.email24hSent) {
        await sendReminder(booking, '24 horas');
        await prisma.booking.update({
          where: { id: booking.id },
          data: { email24hSent: true }
        });
        emailsSent++;
      }

      // Email 1h antes
      if (hoursUntil <= 1 && hoursUntil > 0.75 && !booking.email1hSent) {
        await sendReminder(booking, '1 hora');
        await prisma.booking.update({
          where: { id: booking.id },
          data: { email1hSent: true }
        });
        emailsSent++;
      }

      // Email 15min antes
      if (minutesUntil <= 15 && minutesUntil > 0 && !booking.email15mSent) {
        await sendReminder(booking, '15 minutos');
        await prisma.booking.update({
          where: { id: booking.id },
          data: { email15mSent: true }
        });
        emailsSent++;
      }
    }

    console.log(`[Cron] ${emailsSent} lembretes enviados`);

    return NextResponse.json({ 
      success: true, 
      bookingsChecked: bookings.length,
      emailsSent 
    });

  } catch (error) {
    console.error('[Cron] Erro:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function sendReminder(booking: any, timeframe: string) {
  if (!resend || !process.env.RESEND_API_KEY) {
    console.warn('[Cron] Resend não configurado');
    return;
  }

  try {
    // Email para o ALUNO
    await resend.emails.send({
      from: 'Explicações Alin <onboarding@resend.dev>',
      to: booking.email,
      subject: `Lembrete: Explicação em ${timeframe}`,
      html: `
        <h2>Olá ${booking.name}!</h2>
        <p>A tua explicação é daqui a <strong>${timeframe}</strong>.</p>
        <p><strong>Data:</strong> ${booking.date.toLocaleString('pt-PT')}</p>
        <p><strong>Ano escolar:</strong> ${booking.schoolYear}</p>
        <br>
        <p>Prepara-te! Até já! 📚</p>
      `
    });

    // Email para VOCÊ (Professor)
    if (process.env.ADMIN_EMAIL) {
      await resend.emails.send({
        from: 'Sistema Explicações <onboarding@resend.dev>',
        to: process.env.ADMIN_EMAIL,
        subject: `Lembrete: Aula com ${booking.name} em ${timeframe}`,
        html: `
          <h2>Lembrete de Aula 🔔</h2>
          <p>Tens uma explicação daqui a <strong>${timeframe}</strong>.</p>
          <p><strong>Aluno:</strong> ${booking.name}</p>
          <p><strong>Email:</strong> ${booking.email}</p>
          <p><strong>Ano escolar:</strong> ${booking.schoolYear}</p>
          <p><strong>Horário:</strong> ${booking.date.toLocaleString('pt-PT')}</p>
        `
      });
    }

    console.log(`[Cron] Lembrete de ${timeframe} enviado para ${booking.name}`);
  } catch (error) {
    console.error('[Cron] Erro ao enviar lembrete:', error);
  }
}
