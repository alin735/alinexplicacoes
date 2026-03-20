# 🚀 Guia de Configuração Completo - Explicações com o Alin

Segue estes passos **exatamente pela ordem** para configurar o teu site.

---

## 📋 PASSO 1: Criar Projeto no Supabase

### 1.1 Criar conta
1. Abre o browser e vai a: **https://supabase.com**
2. Clica em **"Start your project"** (canto superior direito)
3. Escolhe **"Sign in with GitHub"** (recomendado) ou cria com email
4. Confirma o teu email se necessário

### 1.2 Criar novo projeto
1. Depois do login, clica em **"New Project"**
2. Escolhe a tua organização (ou cria uma nova se for a primeira vez)
3. Preenche os dados:
   - **Name**: `explicacoes-alin` (ou o nome que quiseres)
   - **Database Password**: Escolhe uma password **FORTE** e **GUARDA-A** (vais precisar mais tarde se quiseres aceder à base de dados diretamente)
   - **Region**: Escolhe **Europe (West)** (mais perto de Portugal)
   - **Pricing Plan**: Deixa em **Free** (é mais que suficiente)
4. Clica em **"Create new project"**
5. **AGUARDA 2-3 MINUTOS** enquanto o Supabase cria a tua base de dados ☕

---

## 🔑 PASSO 2: Copiar as Credenciais do Supabase

### 2.1 Encontrar as credenciais
Enquanto o projeto está a ser criado, assim que estiver pronto:

1. No dashboard do teu projeto, clica no ícone de **"Settings"** (⚙️) na barra lateral esquerda
2. Clica em **"API"** no menu de Settings
3. Vais ver duas informações importantes:

#### Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```
Copia este URL completo.

#### Project API keys → anon public
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzg5MjM0NTYsImV4cCI6MTk5NDQ5OTQ1Nn0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
Copia esta chave (é muito longa, tipo 200+ caracteres).

### 2.2 Guardar no projeto

**FICHEIRO A EDITAR: `/Users/alinc/explicacoes-alin/.env.local`**

1. Abre o ficheiro `.env.local` no teu projeto
2. Substitui as linhas existentes por:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzg5MjM0NTYsImV4cCI6MTk5NDQ5OTQ1Nn0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_MODEL=claude-sonnet-4-6
```

3. Substitui `https://xxxxxxxxxxxxx.supabase.co` pelo **teu URL** real
4. Substitui a key gigante pela **tua key** real
5. **GUARDA O FICHEIRO** (Cmd+S ou Ctrl+S)
6. Reinicia o servidor local (`npm run dev`) para aplicar as novas variáveis da Anthropic

⚠️ **IMPORTANTE**: Não partilhes este ficheiro publicamente (já está no .gitignore)

---

## 🗄️ PASSO 3: Criar as Tabelas na Base de Dados

### 3.1 Abrir o SQL Editor
1. No dashboard do Supabase, clica em **"SQL Editor"** na barra lateral esquerda (ícone `</>`)
2. Clica em **"New query"** (botão azul no topo)

### 3.2 Copiar e executar o SQL

**FICHEIRO A COPIAR: `/Users/alinc/explicacoes-alin/supabase/schema.sql`**

1. Abre o ficheiro `supabase/schema.sql` no teu projeto
2. **SELECIONA TODO O CONTEÚDO** (Cmd+A ou Ctrl+A)
3. **COPIA** (Cmd+C ou Ctrl+C)
4. Volta ao SQL Editor do Supabase
5. **COLA TODO O CÓDIGO** na janela de query
6. Clica em **"RUN"** (botão no canto inferior direito)

✅ Deves ver a mensagem **"Success. No rows returned"** 

### 3.3 Verificar que criou as tabelas
1. Clica em **"Table Editor"** na barra lateral esquerda
2. Deves ver estas tabelas criadas:
   - `profiles`
   - `bookings`
   - `lessons`
   - `lesson_attachments`
   - `available_slots`

Se vires todas estas tabelas, **está tudo bem!** ✅

---

## 📱 PASSO 4: Configurar Autenticação

### 4.1 Ativar Email Authentication (já está ativo por defeito)
1. Clica em **"Authentication"** na barra lateral
2. Clica em **"Providers"**
3. Verifica que **"Email"** está ativado (toggle verde)

### 4.2 (OPCIONAL) Ativar Phone Authentication

⚠️ **Nota**: Ativar login por telemóvel requer configurar um serviço de SMS pago (Twilio, MessageBird). 

**Para começar, podes deixar só o Email ativo.** Os utilizadores podem fazer login com email normalmente.

Se quiseres ativar mais tarde:
1. Em **Authentication > Providers**, clica em **"Phone"**
2. Segue as instruções para configurar Twilio ou MessageBird
3. (Isto requer criar conta e adicionar billing num desses serviços)

---

## 👨‍💼 PASSO 5: Tornar-te Administrador

### 5.1 Criar a tua conta no site
1. Abre o terminal na pasta do projeto
2. Corre: `npm run dev`
3. Abre o browser em: **http://localhost:3000**
4. Clica em **"Login"** (canto superior direito)
5. Clica em **"Criar conta"**
6. Preenche:
   - **Nome completo**: O teu nome
   - **Email**: O teu email
   - **Password**: Uma password (min. 6 caracteres)
7. Clica em **"Criar conta"**
8. Verifica o teu email e clica no link de confirmação

### 5.2 Encontrar o teu User ID
1. Volta ao dashboard do Supabase
2. Clica em **"Authentication"** na barra lateral
3. Clica em **"Users"**
4. Vais ver a tua conta listada
5. **COPIA o ID** (está na coluna "ID", é um UUID tipo `abc123def-4567-8901-2345-678901234567`)

### 5.3 Tornar-te admin
1. Volta ao **"SQL Editor"** do Supabase
2. Clica em **"New query"**
3. Cola este código (substituindo `SEU_USER_ID_AQUI`):

```sql
UPDATE profiles 
SET is_admin = true 
WHERE id = 'SEU_USER_ID_AQUI';
```

**Exemplo real:**
```sql
UPDATE profiles 
SET is_admin = true 
WHERE id = 'abc123def-4567-8901-2345-678901234567';
```

4. Clica em **"RUN"**
5. Deves ver: **"Success. 1 row affected"** ✅

### 5.4 Verificar
1. Volta ao site (http://localhost:3000)
2. Faz refresh da página (F5)
3. Clica na tua foto de perfil (canto superior direito)
4. Deves ver agora a opção **"Administração"** no menu! 🎉

---

## 🎯 PASSO 6: Adicionar Horários Disponíveis (Como Admin)

Agora que és admin, precisas de adicionar horários para os alunos poderem marcar explicações.

### 6.1 Aceder ao painel de admin
1. No site, clica na tua foto de perfil
2. Clica em **"Administração"**

### 6.2 Criar horários
1. Clica no tab **"🕐 Horários"**
2. Preenche:
   - **Data**: Escolhe uma data futura (ex: amanhã)
   - **Hora início**: Ex: 14:00
   - **Hora fim**: Ex: 15:00
3. Clica em **"Adicionar horário"**
4. **Repete** para todos os dias/horas em que estás disponível

💡 **Dica**: Adiciona vários horários de uma vez (diferentes dias e horas)

---

## ✅ PASSO 7: Testar o Site

### 7.1 Criar conta de teste (aluno)
1. Abre uma janela anónima/privada do browser
2. Vai a http://localhost:3000
3. Cria uma segunda conta (com outro email)
4. Esta será uma conta de "aluno" normal (não-admin)

### 7.2 Testar marcação
1. Com a conta de aluno, clica em **"Marcar explicação"**
2. Escolhe uma disciplina
3. Seleciona um dia que tenha horários
4. Escolhe um horário
5. Adiciona observações (opcional)
6. Clica em **"Marcar explicação"**
7. Deves ver a confirmação! ✅

### 7.3 Como admin: Criar aula
1. Volta à tua conta admin
2. Vai a **"Administração"**
3. No tab **"📚 Criar aula"**:
   - Seleciona o aluno (o email que criaste)
   - Escolhe disciplina (ex: Matemática)
   - Título: "Funções quadráticas"
   - Data: Hoje ou ontem
   - Observações: "Revimos as funções de 2º grau..."
   - (Opcional) Adiciona ficheiros PDF, imagens, etc.
4. Clica em **"Criar aula"**

### 7.4 Como aluno: Ver as aulas
1. Com a conta de aluno, vai a **"Minhas aulas"**
2. Deves ver a aula que criaste!
3. Clica na aula para expandir e ver observações e anexos ✅

---

## 🌐 PASSO 8 (OPCIONAL): Deploy no Vercel

### 8.1 Preparar o código
1. Cria um repositório no GitHub
2. Faz push do projeto:

```bash
cd /Users/alinc/explicacoes-alin
git init
git add .
git commit -m "Site de explicações pronto"
git branch -M main
git remote add origin https://github.com/TEU_USERNAME/explicacoes-alin.git
git push -u origin main
```

### 8.2 Deploy no Vercel
1. Vai a **https://vercel.com**
2. Faz login com GitHub
3. Clica em **"New Project"**
4. Importa o repositório `explicacoes-alin`
5. Em **"Environment Variables"**, adiciona:
   - `NEXT_PUBLIC_SUPABASE_URL`: (o teu URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (a tua key)
   - `ANTHROPIC_API_KEY`: (necessária para gerar o plano personalizado de notas)
   - `ANTHROPIC_MODEL`: (opcional, recomendado `claude-sonnet-4-6`)
   - `RESEND_API_KEY`: (obrigatória para envio de emails)
   - `RESEND_FROM_EMAIL`: (ex: `Matemática é Top <noreply@contacto.matematica.top>`)
   - `ADMIN_EMAIL`: (email que recebe notificações das marcações)
6. Clica em **"Deploy"**
7. Aguarda 2-3 minutos
8. **O teu site está ONLINE!** 🎉

### 8.3 Configurar URL de callback no Supabase
1. Volta ao dashboard do Supabase
2. **Authentication > URL Configuration**
3. Em **"Redirect URLs"**, adiciona:
   - `http://localhost:3000/api/auth/callback` (para dev)
   - `https://teu-site.vercel.app/api/auth/callback` (para produção)
4. Guarda

---

## 🎨 Personalização (OPCIONAL)

### Alterar cores
**FICHEIRO: `/Users/alinc/explicacoes-alin/tailwind.config.js`**

Encontra a secção `colors` e altera os valores:

```js
colors: {
  blue: {
    primary: '#1a5276',  // Azul principal
    light: '#2980b9',     // Azul claro
    accent: '#3498db',    // Azul destaque
    dark: '#0d2f4a',      // Azul escuro
    glow: '#5dade2',      // Azul brilhante
  },
},
```

### Alterar links sociais
**FICHEIRO: `/Users/alinc/explicacoes-alin/src/app/contacto/page.tsx`**

Procura o array `contacts` e atualiza os URLs.

### Alterar disciplinas
**FICHEIRO: `/Users/alinc/explicacoes-alin/src/lib/types.ts`**

Encontra:
```typescript
export const SUBJECTS = [
  'Matemática',
  'Físico-Química',
] as const;
```

Adiciona ou remove disciplinas conforme necessário.

---

## ❓ Resolução de Problemas

### "Invalid supabaseUrl" ao correr npm run dev
➜ Verifica se editaste o `.env.local` com as credenciais corretas do Supabase.

### Não consigo fazer login
➜ Verifica o email de confirmação. Se usaste localhost, podes desativar a confirmação de email em Supabase: **Authentication > Email Templates > Confirm signup**, muda para "Disabled".

### Não vejo a opção "Administração"
➜ Confirma que correste o SQL para te tornar admin e deste refresh na página.

### Erro ao marcar explicação
➜ Certifica-te que adicionaste horários disponíveis no painel de admin primeiro.

### Erro ao criar aula (admin)
➜ Verifica se configuraste o storage bucket. O SQL já o fez automaticamente, mas se houver erro, vai a **Storage** no Supabase e verifica se existe o bucket `lesson-files`.

---

## 📞 Suporte

Se tiveres problemas:
1. Verifica os passos novamente
2. Vê o console do browser (F12) para erros
3. Vê os logs do Supabase em **Logs** na barra lateral

---

## 🎉 Parabéns!

O teu site de explicações está pronto! Agora podes:
- ✅ Receber marcações de alunos
- ✅ Criar e partilhar aulas com materiais
- ✅ Gerir horários disponíveis
- ✅ Profissionalizar as tuas explicações

**Bom trabalho!** 🚀
