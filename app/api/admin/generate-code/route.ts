import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, schoolYear, hoursPerWeek, date, codeId } = body;

    console.log('[Booking] Received data:', { name, email, schoolYear, hoursPerWeek, date, codeId });

    if (!name || !email || !schoolYear || !hoursPerWeek || !date || !codeId) {
      return NextResponse.json({ 
        error: 'Dados incompletos. Por favor, preencha todos os campos.' 
      }, { status: 400 });
    }

    const accessCode = await prisma.accessCode.findUnique({
      where: { id: codeId }
    }).catch(err => {
      console.error('[Booking] Erro ao buscar código:', err);
      return null;
    });

    if (!accessCode) {
      return NextResponse.json({ 
        error: 'Código não encontrado' 
      }, { status: 400 });
    }

    if (accessCode.isUsed) {
      return NextResponse.json({ 
        error: 'Este código já foi utilizado' 
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
    }).catch(err => {
      console.error('[Booking] Erro ao criar marcação:', err);
      throw err;
    });

    console.log('[Booking] Marcação criada:', booking.id);

    // Marca o código como usado
    if (!accessCode.isUsed) {
      await prisma.accessCode.update({
        where: { id: codeId },
        data: { 
          isUsed: true,
          usedAt: new Date()
        }
      }).catch(err => {
        console.error('[Booking] Erro ao marcar código como usado:', err);
      });
    }

    // Envia emails
    if (resend && process.env.RESEND_API_KEY) {
      try {
        // Email para o ALUNO
        await resend.emails.send({
          from: 'Explicações Alin <onboarding@resend.dev>',
          to: email,
          subject: 'Marcação Confirmada ✓',
          html: `
            <h2>Olá ${name}!</h2>
            <p>A tua sessão de explicações foi marcada com sucesso.</p>
            <p><strong>Data:</strong> ${new Date(date).toLocaleString('pt-PT')}</p>
            <p><strong>Ano escolar:</strong> ${schoolYear}</p>
            <p><strong>Horas por semana:</strong> ${hoursPerWeek}</p>
            <br>
            <p>Receberás lembretes automáticos:</p>
            <ul>
              <li>24 horas antes</li>
              <li>1 hora antes</li>
              <li>15 minutos antes</li>
            </ul>
            <p>Até breve!</p>
          `
        });
        console.log('[Booking] Email enviado para aluno:', email);

        // Email para VOCÊ (Professor)
        if (process.env.ADMIN_EMAIL) {
          await resend.emails.send({
            from: 'Sistema Explicações <onboarding@resend.dev>',
            to: process.env.ADMIN_EMAIL,
            subject: `Nova Marcação: ${name}`,
            html: `
              <h2>Nova Explicação Marcada! 📚</h2>
              <p><strong>Aluno:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Ano escolar:</strong> ${schoolYear}</p>
              <p><strong>Horas por semana:</strong> ${hoursPerWeek}</p>
              <p><strong>Data da sessão:</strong> ${new Date(date).toLocaleString('pt-PT')}</p>
              <hr>
              <p style="color: #666; font-size: 12px;">
                Receberás lembretes automáticos 24h, 1h e 15min antes da aula.
              </p>
            `
          });
          console.log('[Booking] Email enviado para admin:', process.env.ADMIN_EMAIL);
        }

      } catch (emailError) {
        console.error('[Booking] Erro ao enviar email:', emailError);
      }
    } else {
      console.warn('[Booking] Resend não configurado. Email não enviado.');
    }

    return NextResponse.json({ 
      success: true, 
      bookingId: booking.id 
    });

  } catch (error) {
    console.error('[Booking] Erro geral:', error);
    
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json({ 
      error: 'Erro ao criar marcação',
      details: isDev ? String(error) : undefined
    }, { status: 500 });
  }
}
