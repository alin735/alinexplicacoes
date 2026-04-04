import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from 'discord.js';

// Registration modal
export function createRegisterModal() {
  const modal = new ModalBuilder()
    .setCustomId('register_modal')
    .setTitle('Criar conta - MatemáticaTop');

  const fullNameInput = new TextInputBuilder()
    .setCustomId('full_name')
    .setLabel('Nome completo')
    .setPlaceholder('O teu nome')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(2)
    .setMaxLength(100);

  const usernameInput = new TextInputBuilder()
    .setCustomId('username')
    .setLabel('Nome de utilizador')
    .setPlaceholder('ex: joao11')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(30);

  const emailInput = new TextInputBuilder()
    .setCustomId('email')
    .setLabel('Email')
    .setPlaceholder('o.teu@email.com')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const passwordInput = new TextInputBuilder()
    .setCustomId('password')
    .setLabel('Password')
    .setPlaceholder('Mínimo 6 caracteres')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(6)
    .setMaxLength(72);

  const newsletterInput = new TextInputBuilder()
    .setCustomId('newsletter')
    .setLabel('Quero receber novidades por email (s/n)')
    .setPlaceholder('s para sim, n para não')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(3);

  // Create action rows (one per input, max 5)
  const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(fullNameInput);
  const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(usernameInput);
  const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput);
  const row4 = new ActionRowBuilder<TextInputBuilder>().addComponents(passwordInput);
  const row5 = new ActionRowBuilder<TextInputBuilder>().addComponents(newsletterInput);

  modal.addComponents(row1, row2, row3, row4, row5);

  return modal;
}

// Login modal
export function createLoginModal() {
  const modal = new ModalBuilder()
    .setCustomId('login_modal')
    .setTitle('Login - MatemáticaTop');

  const emailInput = new TextInputBuilder()
    .setCustomId('email')
    .setLabel('Email')
    .setPlaceholder('o.teu@email.com')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput);

  modal.addComponents(row1);

  return modal;
}

// Observations modal for booking
export function createObservationsModal(bookingData: string) {
  const modal = new ModalBuilder()
    .setCustomId(`observations_modal_${bookingData}`)
    .setTitle('Observações (opcional)');

  const observationsInput = new TextInputBuilder()
    .setCustomId('observations')
    .setLabel('Observações para a explicação')
    .setPlaceholder('Algo que queiras mencionar sobre a aula...')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setMaxLength(500);

  const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(observationsInput);

  modal.addComponents(row1);

  return modal;
}
