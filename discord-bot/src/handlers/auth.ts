import {
  ButtonInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import {
  createUser,
  createMagicLink,
  verifyMagicLink,
  getProfileByDiscordId,
} from '../database';
import {
  createRegistrationSuccessEmbed,
  createLoginInstructionsEmbed,
  createErrorEmbed,
} from '../embeds';
import { createRegisterModal, createLoginModal } from '../modals';
import { sendMagicLinkEmail } from '../utils/email';

// Show registration modal
export async function handleShowRegister(interaction: ButtonInteraction) {
  const modal = createRegisterModal();
  await interaction.showModal(modal);
}

// Show login modal
export async function handleShowLogin(interaction: ButtonInteraction) {
  const modal = createLoginModal();
  await interaction.showModal(modal);
}

// Handle registration form submission
export async function handleRegisterSubmit(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const fullName = interaction.fields.getTextInputValue('full_name').trim();
  const username = interaction.fields.getTextInputValue('username').trim();
  const email = interaction.fields.getTextInputValue('email').trim().toLowerCase();
  const password = interaction.fields.getTextInputValue('password');
  const newsletterInput = interaction.fields.getTextInputValue('newsletter').trim().toLowerCase();
  
  const newsletterOptIn = newsletterInput === 's' || newsletterInput === 'sim' || newsletterInput === 'yes' || newsletterInput === 'y';

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Email inválido. Por favor, verifica o formato.')],
    });
    return;
  }

  // Validate password length
  if (password.length < 6) {
    await interaction.editReply({
      embeds: [createErrorEmbed('A password deve ter pelo menos 6 caracteres.')],
    });
    return;
  }

  try {
    await createUser({
      email,
      password,
      fullName,
      username,
      newsletterOptIn,
      discordUserId: interaction.user.id,
    });

    const embed = createRegistrationSuccessEmbed();
    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    let errorMessage = 'Ocorreu um erro ao criar a conta.';
    
    if (error.message.includes('already registered') || error.message.includes('already exists')) {
      errorMessage = 'Este email já está registado. Faz login em vez disso.';
    } else if (error.message.includes('Username')) {
      errorMessage = 'Este nome de utilizador já está em uso.';
    }

    await interaction.editReply({
      embeds: [createErrorEmbed(errorMessage)],
    });
  }
}

// Handle login form submission
export async function handleLoginSubmit(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const email = interaction.fields.getTextInputValue('email').trim().toLowerCase();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Email inválido. Por favor, verifica o formato.')],
    });
    return;
  }

  try {
    // Create magic link
    const token = await createMagicLink(email, interaction.user.id);
    
    if (!token) {
      await interaction.editReply({
        embeds: [createErrorEmbed('Email não encontrado. Verifica se usaste o email correto ou cria uma conta.')],
      });
      return;
    }

    // Send email with magic link
    const emailSent = await sendMagicLinkEmail(email, token);
    
    if (!emailSent) {
      await interaction.editReply({
        embeds: [createErrorEmbed('Não foi possível enviar o email. Por favor, tenta novamente.')],
      });
      return;
    }

    // Show instructions
    const { embed, row } = createLoginInstructionsEmbed(token);
    await interaction.editReply({ embeds: [embed], components: [row] });
  } catch (error: any) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Ocorreu um erro. Por favor, tenta novamente.')],
    });
  }
}

// Handle verify login button click
export async function handleVerifyLogin(interaction: ButtonInteraction, token: string) {
  await interaction.deferUpdate();

  try {
    const verified = await verifyMagicLink(token, interaction.user.id);
    
    if (!verified) {
      await interaction.editReply({
        embeds: [createErrorEmbed('O link expirou ou já foi utilizado. Por favor, faz login novamente.')],
        components: [],
      });
      return;
    }

    await interaction.editReply({
      embeds: [{
        color: 0x22c55e,
        title: '✅ Login efetuado!',
        description: 'Agora podes marcar explicações e aceder aos cronogramas.',
        footer: { text: 'MatemáticaTop © 2026 | matematica.top' },
      }],
      components: [],
    });
  } catch (error: any) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Ocorreu um erro. Por favor, tenta novamente.')],
      components: [],
    });
  }
}
