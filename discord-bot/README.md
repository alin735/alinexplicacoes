# MatemáticaTop - Discord Bot

Bot Discord para marcação de explicações e acesso a cronogramas.

## Funcionalidades

- 📖 **Marcar Explicação** - Marcação de aulas individuais com o Alin
- 📋 **Cronogramas** - Acesso a planos de estudo personalizados

## Instalação

### 1. Instalar dependências

```bash
cd discord-bot
npm install
```

### 2. Configurar ambiente

Copia `.env.example` para `.env` e preenche as credenciais:

```bash
cp .env.example .env
```

### 3. Configurar base de dados

Executa o SQL em `schema.sql` no Supabase SQL Editor para criar as tabelas necessárias:
- `discord_sessions` - Sessões de utilizadores
- `discord_magic_links` - Tokens de login

### 4. Compilar e executar

```bash
npm run build
npm start
```

Ou em modo desenvolvimento:

```bash
npm run dev
```

## Comandos

### Admin

- `/setup` - Configura as mensagens fixas nos canais #explicacoes e #cronogramas

## Estrutura

```
discord-bot/
├── src/
│   ├── index.ts          # Entrada principal
│   ├── config.ts         # Configurações
│   ├── database.ts       # Integração Supabase
│   ├── embeds/           # Embeds Discord
│   ├── handlers/         # Handlers de interações
│   │   ├── auth.ts       # Registo e login
│   │   ├── booking.ts    # Marcação de explicações
│   │   └── cronograma.ts # Cronogramas
│   ├── modals/           # Modais de formulário
│   └── utils/            # Utilitários (Stripe, email)
├── schema.sql            # SQL para criar tabelas
├── package.json
└── tsconfig.json
```

## Manter online

### Com PM2 (recomendado)

```bash
npm install -g pm2
pm2 start dist/index.js --name matematicatop-bot
pm2 save
pm2 startup
```

### Com systemd (Linux)

```bash
sudo nano /etc/systemd/system/matematicatop-bot.service
```

```ini
[Unit]
Description=MatemáticaTop Discord Bot
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/path/to/discord-bot
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable matematicatop-bot
sudo systemctl start matematicatop-bot
```

## Notas

- O bot usa autenticação por magic link (email) para login
- Apenas os emails específicos podem pagar presencialmente
- Os cronogramas são enviados como ficheiros PDF anexados
