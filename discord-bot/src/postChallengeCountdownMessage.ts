import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { config } from './config';
import { buildChallengeCountdownEmbed } from './challenge';

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

      const sent = await channel.send({ embeds: [buildChallengeCountdownEmbed()] });
      console.log(`Mensagem de contador publicada com sucesso: ${sent.id}`);
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Falha ao publicar a mensagem de contador.');
      process.exitCode = 1;
    } finally {
      await client.destroy();
    }
  });

  await client.login(config.discordToken);
}

void run();
