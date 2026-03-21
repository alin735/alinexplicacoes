# MatemáticaTop — Explicações com o Alin

Site de marcação e gestão de explicações.

## Stack

- **Next.js 14** (App Router)
- **Supabase** (Auth, Database, Storage)
- **Tailwind CSS**

## Setup

### 1. Criar projeto Supabase

1. Vai a [supabase.com](https://supabase.com) e cria uma conta gratuita
2. Cria um novo projeto
3. Copia a **Project URL** e a **anon public key** (em Settings > API)

### 2. Configurar variáveis de ambiente

Edita o ficheiro `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=MatemáticaTop <noreply@contacto.matematica.top>
ADMIN_EMAIL=teu-email@dominio.com
```

### 3. Configurar base de dados

1. No Supabase, vai a **SQL Editor**
2. Cola e executa o conteúdo do ficheiro `supabase/schema.sql`

### 4. Configurar autenticação

1. No Supabase, vai a **Authentication > Providers**
2. Ativa **Email** (já está ativo por defeito)
3. Para login por **telemóvel**, ativa o provider Phone e configura um serviço de SMS (ex: Twilio)

### 5. Tornar-te admin

Após criares a tua conta no site, executa no SQL Editor do Supabase:

```sql
UPDATE profiles SET is_admin = true WHERE id = 'TEU_USER_ID';
```

Podes encontrar o teu user ID em Authentication > Users.

### 6. Instalar e correr

```bash
npm install
npm run dev
```

O site estará disponível em `http://localhost:3000`.

## Deploy no Vercel

1. Faz push do projeto para o GitHub
2. Vai a [vercel.com](https://vercel.com) e importa o repositório
3. Adiciona as variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, opcionalmente `ANTHROPIC_MODEL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` e `ADMIN_EMAIL`)
4. Deploy!

## Funcionalidades

- **Home** — Hero com botões "Marcar explicação" e "Minhas aulas"
- **Login** — Autenticação com email + registo com disciplinas e classificações iniciais
- **Marcar explicação** — Escolha de disciplina (Matemática ou Físico-Química) + calendário com horários
- **Minhas aulas** — Lista de aulas com sumários, observações e anexos
- **Notas** — Gestão de classificações, evolução temporal e plano personalizado por IA
- **Administração** — Criar aulas, gerir marcações e horários (só admin)
- **Minha conta** — Editar perfil
- **Contacto** — Links para redes sociais
