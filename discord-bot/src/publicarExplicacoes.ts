/**
 * Atualiza as duas mensagens do canal das explicações.
 *
 * Existe porque o comando /setup foi retirado e não havia mais nenhuma forma
 * de publicar estes embeds. Em vez de publicar de novo, procura as mensagens
 * que o bot já lá tem e EDITA-AS: assim o botão de marcar não muda de sítio,
 * não ficam duas versões no canal e quem tenha a mensagem afixada continua a
 * ver a mesma. Só publica de raiz se não encontrar nada.
 *
 *   npm run publicar:explicacoes
 */
import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { config } from './config';
import { createExplicacoesEmbed, createExplicacoesInfoEmbed } from './embeds';

async function main() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(config.discordToken);
  await new Promise<void>((resolve) => client.once('ready', () => resolve()));

  const canal = (await client.channels.fetch(config.explicacoesChannelId)) as TextChannel | null;
  if (!canal) throw new Error('Não encontrei o canal das explicações.');

  const historico = await canal.messages.fetch({ limit: 50 });
  const minhas = [...historico.values()]
    .filter((m) => m.author.id === client.user?.id && m.embeds.length > 0)
    .reverse();

  const info = createExplicacoesInfoEmbed();
  const { embed, row } = createExplicacoesEmbed();

  // A informativa é a que não tem botões; a da ação é a que tem.
  const antigaInfo = minhas.find((m) => m.components.length === 0);
  const antigaAcao = minhas.find((m) => m.components.length > 0);

  if (antigaInfo) {
    await antigaInfo.edit({ embeds: [info] });
    console.log(`Mensagem informativa atualizada (${antigaInfo.id}).`);
  } else {
    const nova = await canal.send({ embeds: [info] });
    console.log(`Mensagem informativa publicada de novo (${nova.id}).`);
  }

  if (antigaAcao) {
    await antigaAcao.edit({ embeds: [embed], components: [row] });
    console.log(`Mensagem do botão atualizada (${antigaAcao.id}).`);
  } else {
    const nova = await canal.send({ embeds: [embed], components: [row] });
    console.log(`Mensagem do botão publicada de novo (${nova.id}).`);
  }

  await client.destroy();
}

main().catch((erro) => {
  console.error('Falhou:', erro);
  process.exit(1);
});
