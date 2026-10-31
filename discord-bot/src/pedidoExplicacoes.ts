/**
 * O pedido de explicações, igual ao formulário do site.
 *
 * O botão do canal das explicações abre este formulário e o que a pessoa
 * escreve segue para o mesmo sítio para onde vai o do site: a rota
 * `/api/explicacoes-lead`, que trata de enviar o email.
 *
 * É de propósito que o bot não envia o email por si. Se o fizesse, passavam a
 * existir dois textos de email a dizer o mesmo, e bastava mudar um deles para
 * ficarem diferentes. Assim há um só, e o que muda no site muda aqui também.
 */
import {
  ActionRowBuilder,
  ButtonInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} from 'discord.js';
import { config } from './config';

export const PEDIDO_MODAL_ID = 'pedido_explicacoes';

export function criarModalPedido() {
  const modal = new ModalBuilder()
    .setCustomId(PEDIDO_MODAL_ID)
    .setTitle('Pedir uma explicação');

  const campos = [
    new TextInputBuilder()
      .setCustomId('nome')
      .setLabel('Nome')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(80)
      .setRequired(true),
    new TextInputBuilder()
      .setCustomId('email')
      .setLabel('Email')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(120)
      .setRequired(true),
    new TextInputBuilder()
      .setCustomId('telemovel')
      .setLabel('Telemóvel')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(30)
      .setRequired(true),
    new TextInputBuilder()
      .setCustomId('mensagem')
      .setLabel('O que precisas')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Ano, matéria e objetivo. Ex.: 11.º ano, trigonometria, teste daqui a duas semanas.')
      .setMaxLength(900)
      .setRequired(true),
  ];

  modal.addComponents(
    ...campos.map((campo) => new ActionRowBuilder<TextInputBuilder>().addComponents(campo)),
  );
  return modal;
}

export async function abrirPedidoExplicacoes(interaction: ButtonInteraction) {
  await interaction.showModal(criarModalPedido());
}

export async function tratarPedidoExplicacoes(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const nome = interaction.fields.getTextInputValue('nome').trim();
  const email = interaction.fields.getTextInputValue('email').trim();
  const telemovel = interaction.fields.getTextInputValue('telemovel').trim();
  const mensagem = interaction.fields.getTextInputValue('mensagem').trim();

  // Email mal escrito apanha-se aqui, senão o pedido perde-se sem ninguém dar
  // por isso: a pessoa pensa que enviou e nunca recebe resposta.
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
    await interaction.editReply(
      'Esse email não parece estar bem escrito. Carrega outra vez no botão e confirma-o.',
    );
    return;
  }

  try {
    const resposta = await fetch(`${config.siteUrl}/api/explicacoes-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: nome,
        email,
        phone: telemovel,
        message: mensagem,
        // Para distinguir na caixa de entrada de onde veio o pedido.
        source: `Discord, por @${interaction.user.username}`,
      }),
    });

    if (!resposta.ok) {
      const corpo = (await resposta.json().catch(() => null)) as { error?: string } | null;
      throw new Error(corpo?.error || `o servidor respondeu ${resposta.status}`);
    }

    await interaction.editReply(
      `Pedido enviado, ${nome}. ✅\n\n` +
        'Assim que vir o teu pedido, respondo-te e esclareço o preço, os horários e qual o explicador ' +
        'certo para ti. Não ficas comprometido com nada.',
    );
  } catch (erro) {
    console.error('Falha ao enviar o pedido de explicações:', erro);
    await interaction.editReply(
      'Não consegui enviar o teu pedido. Tenta outra vez daqui a pouco, ' +
        'ou fala comigo em https://matematica.top/explicacoes',
    );
  }
}
