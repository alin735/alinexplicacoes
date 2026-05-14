import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config';
import { publishChallengeDayManually } from './challenge';

const day = Number.parseInt(process.argv[2] || '', 10);

if (!Number.isFinite(day) || day < 1) {
  console.error('Uso: npm run publish:challenge-day -- <dia>');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
  ],
});

client.once('ready', async () => {
  try {
    await publishChallengeDayManually(client, day);
    console.log(`Perguntas do dia ${day} publicadas/verificadas.`);
    await client.destroy();
    process.exit(0);
  } catch (error) {
    console.error(error);
    await client.destroy();
    process.exit(1);
  }
});

client.login(config.discordToken);
