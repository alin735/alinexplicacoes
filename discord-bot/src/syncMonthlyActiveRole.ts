import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config';
import { syncMonthlyActivityNow, getMonthlyActivitySummary } from './monthlyActivity';

async function run() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers],
  });

  client.once('clientReady', async () => {
    try {
      const leader = await syncMonthlyActivityNow(client);
      const { leader: summary } = await getMonthlyActivitySummary(client);

      if (!leader?.leaderUserId) {
        console.log(`Sem líder mensal encontrado para ${summary.monthKey}.`);
      } else {
        console.log(
          `Cargo sincronizado para ${leader.leaderUserId} com ${leader.messageCount} mensagens em ${leader.monthKey}.`,
        );
      }
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Falha ao sincronizar o cargo mensal.');
      process.exitCode = 1;
    } finally {
      await client.destroy();
    }
  });

  await client.login(config.discordToken);
}

void run();
