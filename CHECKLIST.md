# ✅ CHECKLIST RÁPIDA - Setup do Site

Usa esta checklist para confirmar que fizeste todos os passos:

## 📋 Pré-requisitos
- [ ] Conta criada em https://supabase.com
- [ ] Node.js instalado no computador
- [ ] Projeto descarregado/clonado para `/Users/alinc/explicacoes-alin`

---

## 🔧 Configuração (30-45 minutos)

### Supabase (15 min)
- [ ] **Passo 1.1**: Criei conta no Supabase
- [ ] **Passo 1.2**: Criei novo projeto (nome: `explicacoes-alin`)
- [ ] **Passo 1.2**: Aguardei 2-3 min até estar pronto
- [ ] **Passo 2.1**: Fui a Settings > API
- [ ] **Passo 2.1**: Copiei a **Project URL**
- [ ] **Passo 2.1**: Copiei a **anon public key**

### Ficheiros a Editar (5 min)
- [ ] **Passo 2.2**: Editei `/Users/alinc/explicacoes-alin/.env.local`
- [ ] **Passo 2.2**: Colei a URL real do Supabase
- [ ] **Passo 2.2**: Colei a key real do Supabase
- [ ] **Passo 2.2**: Guardei o ficheiro (Cmd+S)

### Base de Dados (5 min)
- [ ] **Passo 3.1**: Abri SQL Editor no Supabase
- [ ] **Passo 3.2**: Copiei TODO o conteúdo de `supabase/schema.sql`
- [ ] **Passo 3.2**: Colei no SQL Editor
- [ ] **Passo 3.2**: Cliquei em RUN
- [ ] **Passo 3.3**: Vi "Success. No rows returned"
- [ ] **Passo 3.3**: Verifiquei que criou as 5 tabelas (Table Editor)

### Autenticação (2 min)
- [ ] **Passo 4.1**: Verifiquei que Email está ativo em Authentication > Providers
- [ ] **Passo 4.2**: (Opcional) Configurei Phone authentication

### Primeira Conta (5 min)
- [ ] **Passo 5.1**: Corri `npm install` no terminal
- [ ] **Passo 5.1**: Corri `npm run dev` no terminal
- [ ] **Passo 5.1**: Abri http://localhost:3000 no browser
- [ ] **Passo 5.1**: Criei conta com o meu email
- [ ] **Passo 5.1**: Confirmei email (link no inbox)

### Tornar Admin (3 min)
- [ ] **Passo 5.2**: Fui a Authentication > Users no Supabase
- [ ] **Passo 5.2**: Copiei o meu User ID (UUID longo)
- [ ] **Passo 5.3**: Abri SQL Editor > New query
- [ ] **Passo 5.3**: Colei: `UPDATE profiles SET is_admin = true WHERE id = 'MEU_ID';`
- [ ] **Passo 5.3**: Cliquei RUN
- [ ] **Passo 5.4**: Fiz refresh no site e vi "Administração" no menu

### Adicionar Horários (5 min)
- [ ] **Passo 6.1**: Entrei em Administração
- [ ] **Passo 6.2**: Fui ao tab "🕐 Horários"
- [ ] **Passo 6.2**: Adicionei pelo menos 3-4 horários disponíveis

---

## 🧪 Testes (10 min)

### Como Aluno
- [ ] **Passo 7.1**: Criei segunda conta (janela anónima)
- [ ] **Passo 7.2**: Marquei uma explicação com sucesso
- [ ] **Passo 7.2**: Vi mensagem de confirmação

### Como Admin
- [ ] **Passo 7.3**: Voltei à conta admin
- [ ] **Passo 7.3**: Criei uma aula para o aluno de teste
- [ ] **Passo 7.3**: Adicionei título, observações
- [ ] **Passo 7.3**: (Opcional) Anexei um ficheiro PDF

### Verificação Final
- [ ] **Passo 7.4**: Com conta aluno, vi a aula em "Minhas aulas"
- [ ] **Passo 7.4**: Expandi a aula e vi observações
- [ ] **Passo 7.4**: Consegui descarregar anexos (se adicionei)

---

## 🌐 Deploy (OPCIONAL - 15 min)

- [ ] **Passo 8.1**: Criei repositório no GitHub
- [ ] **Passo 8.1**: Fiz push do código
- [ ] **Passo 8.2**: Fui a vercel.com
- [ ] **Passo 8.2**: Importei o repositório
- [ ] **Passo 8.2**: Adicionei variáveis de ambiente
- [ ] **Passo 8.2**: Deploy feito!
- [ ] **Passo 8.3**: Configurei redirect URLs no Supabase

---

## ✅ Site Pronto!

Se marcaste todas as caixas acima, o teu site está 100% funcional! 🎉

### Funcionalidades que funcionam:
✅ Login com email  
✅ Marcar explicações  
✅ Ver aulas passadas  
✅ Criar aulas (admin)  
✅ Gerir horários (admin)  
✅ Editar perfil  
✅ Contactos  

### Próximos passos:
1. Partilha o link com os teus alunos
2. Adiciona mais horários disponíveis
3. Começa a receber marcações!

---

## 🆘 Problemas?

Se ficaste preso em algum passo:
- Lê o **SETUP.md** completo (tem mais detalhes)
- Verifica se seguiste TODOS os passos pela ordem
- Vê a secção "Resolução de Problemas" no SETUP.md

**Ficheiros importantes:**
- `SETUP.md` ← Guia completo passo-a-passo
- `README.md` ← Visão geral do projeto
- `.env.local` ← Credenciais (NUNCA partilhar!)
- `supabase/schema.sql` ← Código da base de dados
