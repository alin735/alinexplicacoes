import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} from 'discord.js';
import { config, MATH_TOPICS_BY_YEAR, SCHOOL_YEARS, IN_PERSON_PAYMENT_EMAILS, LESSON_PRICE_CENTS } from '../config';
import {
  getProfileByDiscordId,
  getAvailableDates,
  getAvailableSlots,
  createBooking,
  getSupabase,
} from '../database';
import {
  createNeedsAuthEmbed,
  createYearSelectionEmbed,
  createBookingConfirmEmbed,
  createBookingSuccessEmbed,
  createErrorEmbed,
  formatPrice,
} from '../embeds';
import { createCheckoutSession } from '../utils/stripe';

// Store booking state per user (in memory - consider Redis for production)
const bookingState = new Map<string, {
  year?: string;
  topic?: string;
  date?: string;
  timeSlot?: string;
  slotId?: string;
}>();

export async function handleStartBooking(interaction: ButtonInteraction) {
  const profile = await getProfileByDiscordId(interaction.user.id);

  if (!profile) {
    const { embed, row } = createNeedsAuthEmbed();
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    return;
  }

  // Clear any previous booking state
  bookingState.set(interaction.user.id, {});

  // Show year selection
  const { embed, row } = createYearSelectionEmbed();
  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

export async function handleYearSelection(interaction: ButtonInteraction) {
  const yearByCustomId: Record<string, string> = {
    year_79: '7º-9º',
    year_10: '10º',
    year_11: '11º',
  };
  const year = yearByCustomId[interaction.customId];

  if (!year) {
    await interaction.update({
      embeds: [createErrorEmbed('Ano inválido.')],
      components: [],
    });
    return;
  }
  
  // Update booking state
  const state = bookingState.get(interaction.user.id) || {};
  state.year = year;
  bookingState.set(interaction.user.id, state);

  // Show topic selection
  const topics = MATH_TOPICS_BY_YEAR[year];
  
  const select = new StringSelectMenuBuilder()
    .setCustomId('select_topic')
    .setPlaceholder('Seleciona o tema')
    .addOptions(
      topics.map((topic, index) => ({
        label: topic,
        value: topic,
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.update({
    embeds: [{
      color: 0xffffff,
      title: '📖 Marcar explicação',
      description: `**Ano:** ${year}\n\nSeleciona o tema da explicação.`,
      footer: { text: 'MatemáticaTop © 2026 | matematica.top' },
    }],
    components: [row],
  });
}

export async function handleTopicSelection(interaction: StringSelectMenuInteraction) {
  const topic = interaction.values[0];
  
  // Update booking state
  const state = bookingState.get(interaction.user.id) || {};
  state.topic = topic;
  bookingState.set(interaction.user.id, state);

  // Get available dates
  const dates = await getAvailableDates();

  if (dates.length === 0) {
    await interaction.update({
      embeds: [createErrorEmbed('Não há datas disponíveis de momento. Por favor, tenta mais tarde.')],
      components: [],
    });
    return;
  }

  // Format dates for dropdown
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  
  const dateOptions = dates.slice(0, 25).map(date => {
    const d = new Date(date);
    const weekday = weekdays[d.getDay()];
    const dayNum = d.getDate();
    const month = months[d.getMonth()];
    return {
      label: `${weekday}, ${dayNum} de ${month}`,
      value: date,
    };
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_date')
    .setPlaceholder('Seleciona o dia')
    .addOptions(dateOptions);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.update({
    embeds: [{
      color: 0xffffff,
      title: '📖 Marcar explicação',
      description: `**Ano:** ${state.year}\n**Tema:** ${topic}\n\nSeleciona o dia da explicação.`,
      footer: { text: 'MatemáticaTop © 2026 | matematica.top' },
    }],
    components: [row],
  });
}

export async function handleDateSelection(interaction: StringSelectMenuInteraction) {
  const date = interaction.values[0];
  
  // Update booking state
  const state = bookingState.get(interaction.user.id) || {};
  state.date = date;
  bookingState.set(interaction.user.id, state);

  // Get available slots for this date
  const slots = await getAvailableSlots(date);

  if (slots.length === 0) {
    await interaction.update({
      embeds: [createErrorEmbed('Não há horários disponíveis para esta data. Por favor, escolhe outra data.')],
      components: [],
    });
    return;
  }

  // Format slots for dropdown
  const slotOptions = slots.map(slot => {
    const start = slot.start_time.slice(0, 5);
    const end = slot.end_time.slice(0, 5);
    return {
      label: `${start} - ${end}`,
      value: `${slot.id}|${slot.start_time}-${slot.end_time}`,
    };
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_slot')
    .setPlaceholder('Seleciona o horário')
    .addOptions(slotOptions);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  // Format date for display
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const d = new Date(date);
  const formattedDate = `${d.getDate()} de ${months[d.getMonth()]}`;

  await interaction.update({
    embeds: [{
      color: 0xffffff,
      title: '📖 Marcar explicação',
      description: `**Ano:** ${state.year}\n**Tema:** ${state.topic}\n**Data:** ${formattedDate}\n\nSeleciona o horário.`,
      footer: { text: 'MatemáticaTop © 2026 | matematica.top' },
    }],
    components: [row],
  });
}

export async function handleSlotSelection(interaction: StringSelectMenuInteraction) {
  const [slotId, timeSlot] = interaction.values[0].split('|');
  
  // Update booking state
  const state = bookingState.get(interaction.user.id) || {};
  state.slotId = slotId;
  state.timeSlot = timeSlot;
  bookingState.set(interaction.user.id, state);

  // Get profile to check if can pay in person
  const profile = await getProfileByDiscordId(interaction.user.id);
  const canPayInPerson = profile?.email && IN_PERSON_PAYMENT_EMAILS.includes(profile.email.toLowerCase());

  // Show confirmation
  const { embed, row } = createBookingConfirmEmbed({
    year: state.year!,
    topic: state.topic!,
    date: state.date!,
    timeSlot: state.timeSlot!,
    canPayInPerson,
  });

  await interaction.update({ embeds: [embed], components: [row] });
}

export async function handlePayOnline(interaction: ButtonInteraction) {
  await interaction.deferUpdate();

  const state = bookingState.get(interaction.user.id);
  if (!state || !state.year || !state.topic || !state.date || !state.timeSlot || !state.slotId) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Sessão expirada. Por favor, começa de novo.')],
      components: [],
    });
    return;
  }

  const profile = await getProfileByDiscordId(interaction.user.id);
  if (!profile) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Não foi possível encontrar o teu perfil.')],
      components: [],
    });
    return;
  }

  try {
    // Create booking
    const booking = await createBooking({
      profileId: profile.id,
      subject: 'Matemática',
      date: state.date,
      timeSlot: state.timeSlot,
      slotId: state.slotId,
      observations: `year=${state.year};topic=${state.topic};source=discord`,
      paymentMethod: 'online',
      price: LESSON_PRICE_CENTS,
    });

    // Create Stripe checkout session
    const stripeUrl = await createCheckoutSession({
      bookingId: booking.id,
      profileId: profile.id,
      email: profile.email || '',
      year: state.year,
      topic: state.topic,
      date: state.date,
      timeSlot: state.timeSlot,
    });

    // Update booking with Stripe session ID
    const supabase = getSupabase();
    await supabase
      .from('bookings')
      .update({ stripe_session_id: stripeUrl })
      .eq('id', booking.id);

    // Show success with payment link
    const { embed, row } = createBookingSuccessEmbed({
      date: state.date,
      timeSlot: state.timeSlot,
      paymentMethod: 'online',
      stripeUrl,
    });

    await interaction.editReply({
      embeds: [embed],
      components: row ? [row] : [],
    });

    // Clear state
    bookingState.delete(interaction.user.id);
  } catch (error: any) {
    await interaction.editReply({
      embeds: [createErrorEmbed(error.message || 'Ocorreu um erro ao criar a marcação.')],
      components: [],
    });
  }
}

export async function handlePayInPerson(interaction: ButtonInteraction) {
  await interaction.deferUpdate();

  const state = bookingState.get(interaction.user.id);
  if (!state || !state.year || !state.topic || !state.date || !state.timeSlot || !state.slotId) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Sessão expirada. Por favor, começa de novo.')],
      components: [],
    });
    return;
  }

  const profile = await getProfileByDiscordId(interaction.user.id);
  if (!profile) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Não foi possível encontrar o teu perfil.')],
      components: [],
    });
    return;
  }

  // Double check if user can pay in person
  if (!profile.email || !IN_PERSON_PAYMENT_EMAILS.includes(profile.email.toLowerCase())) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Não tens permissão para pagar presencialmente.')],
      components: [],
    });
    return;
  }

  try {
    // Create booking
    await createBooking({
      profileId: profile.id,
      subject: 'Matemática',
      date: state.date,
      timeSlot: state.timeSlot,
      slotId: state.slotId,
      observations: `year=${state.year};topic=${state.topic};source=discord`,
      paymentMethod: 'in_person',
      price: LESSON_PRICE_CENTS,
    });

    // Show success
    const { embed } = createBookingSuccessEmbed({
      date: state.date,
      timeSlot: state.timeSlot,
      paymentMethod: 'in_person',
    });

    await interaction.editReply({
      embeds: [embed],
      components: [],
    });

    // Clear state
    bookingState.delete(interaction.user.id);
  } catch (error: any) {
    await interaction.editReply({
      embeds: [createErrorEmbed(error.message || 'Ocorreu um erro ao criar a marcação.')],
      components: [],
    });
  }
}

export async function handleCancelBooking(interaction: ButtonInteraction) {
  bookingState.delete(interaction.user.id);
  
  await interaction.update({
    embeds: [{
      color: 0xffffff,
      title: '❌ Marcação cancelada',
      description: 'A marcação foi cancelada. Podes começar de novo quando quiseres.',
      footer: { text: 'MatemáticaTop © 2026 | matematica.top' },
    }],
    components: [],
  });
}
