import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { config } from './config';
import { buildChallengeInfoEmbed } from './challenge';

const CHALLENGE_INFO_CHANNEL_ID = '1496924796464922887';

async function run() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  });

  client.once('ready', async () => {
    try {
      const channel = await client.channels.fetch(CHALLENGE_INFO_CHANNEL_ID);
      if (!channel || !(channel instanceof TextChannel)) {
        throw new Error('Canal do desafio não encontrado ou não é um canal de texto.');
      }

      const messages = await channel.messages.fetch({ limit: 50 });
      const targetMessage = messages.find(
        (message) =>
          message.author.id === client.user?.id &&
          message.embeds.some((embed) => (embed.title || '').includes('Desafio Exame Nacional')),
      );

      if (!targetMessage) {
        throw new Error('Não encontrei a mensagem do desafio para editar neste canal.');
      }

      await targetMessage.edit({ embeds: [buildChallengeInfoEmbed()], components: [] });
      console.log(`Mensagem atualizada com sucesso: ${targetMessage.id}`);
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Falha ao atualizar a mensagem.');
      process.exitCode = 1;
    } finally {
      await client.destroy();
    }
  });

  await client.login(config.discordToken);
}

void run();
