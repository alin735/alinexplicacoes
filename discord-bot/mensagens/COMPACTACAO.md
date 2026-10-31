Manter obrigatoriamente no resumo:

## 1. Onde está tudo

- Projeto: `~/Desktop/Projects/explicacoes-alin copy 2` (site Next.js + `discord-bot/`).
  O quadro branco é projeto à parte, em `~/Desktop/Projects/quadro`.
- O bot corre com **PM2**, nome `matematicatop-bot`, a partir de
  `~/Desktop/Projects/explicacoes-alin copy 2/discord-bot`.
  Ciclo: `npm run build` → `pm2 restart matematicatop-bot` → `pm2 logs matematicatop-bot --lines 20 --nostream`.
- Credenciais em `discord-bot/.env`. **Nunca imprimir valores.** Ler a API do Discord
  com o bot token é seguro e barato; usar isso em vez de adivinhar.
- Servidor: MatemáticaTop, `DISCORD_GUILD_ID` no `.env`. Bot: AlinBot#4368.

## 2. Estado do servidor (medido em 3 out 2026)

- 2396 membros (pico 2540). Fórum de dúvidas principal: `#🔟-secundário` (1487542864811393136),
  mais `#7️⃣-básico` (1543355125144354826) e `#🎓-universidade` (1543352467603853312).
- Ritmo do `#geral`: fev 2 · mar 1 · abr 74 · mai 49 · **jun 327** · jul 48 · ago 113 · **set 9** msg/dia.
  Dúvidas: 77 em junho, 0 em setembro. **O servidor não morreu, está fora de época.**
  O chão subiu 6x face ao outono anterior.
- Concentração: nos últimos 30 dias, 675 mensagens de 42 pessoas, mas **5 pessoas fazem 79%**.
  Lê-se como conversa privada entre amigos, e é isso que afasta quem entra.
- Níveis: 204 registos. **131 nunca passaram do nível 1.** Só 1 pessoa acima do nível 10.
  Aumentar o XP por nível é o contrário do que faz falta; o travão está em baixo.
- XP: 30 por colocar dúvida, 10 por responder. 40 XP dá o primeiro cargo
  (2 dúvidas ou 4 respostas). Duas vias: Estudante e Ajudante, 5 cargos cada.

## 3. Feito nesta sessão

- **Bot estava offline** por correr de uma pasta apagada (ficou órfão na mudança para
  `Projects/`), em ciclo de reconexão há 21 dias. Recriado no PM2 no caminho certo, com `pm2 save`.
- **XP passou a contar nos três fóruns.** Era um só id; agora `config.doubtsChannelIds` é lista.
  Idem na contagem do membro mais ativo.
- **Comandos: de 15 para 5.** Ficaram `/nivel` `/xp` `/ranking` `/ativo_mes` `/ativo_mes_atualizar`.
  Saíram `/setup` e os nove `/desafio_*`. **O código do Desafio está intacto**, só não arranca:
  a chamada a `bootstrapChallengeSystem` está comentada, com instruções para a repor em abril.
- **Botão do `#👨🏻‍🎓-explicaçoes`**: era marcação com pagamento a 13€ (o site anuncia 17€).
  Passou a abrir um formulário (`src/pedidoExplicacoes.ts`) com Nome, Email, Telemóvel e
  "O que precisas", que faz POST a `/api/explicacoes-lead`, **o mesmo endpoint do site**,
  para não haver dois textos de email a divergir. **Sem login.**
- **As duas mensagens das explicações foram editadas** (não republicadas) por
  `npm run publicar:explicacoes`, que edita as existentes e só publica se não as encontrar.

## 4. Pendente

- **Alin testar o botão**: preencher e confirmar que o email chega. Não consigo validar sozinho.
- **Deploy do site** para o campo `source` fazer efeito (assunto "Pedido de explicações (Discord, por @x)").
- Preçário: 17 · 14 · 11 · 9 · **5€**, igual no site, no repositório e na mensagem do
  Discord (verificado a 4 out). Fonte no código: `getPricePerStudentCents`
  em `src/lib/booking-utils.ts`. **Mudar um preço obriga a editar também a mensagem do
  Discord**, que tem os valores escritos à mão em `discord-bot/src/embeds/index.ts`.
- **Por publicar**, prontos em `discord-bot/mensagens/`:
  `2026-10-regresso.md` (anúncio @everyone) e `descricoes-e-afixados.md`
  (12 descrições de canais, novas diretrizes dos 3 fóruns, 3 mensagens a afixar).
- **Diretrizes dos fóruns ainda são as regras do servidor**, a acabar em "banimentos permanentes".
  Num fórum, é o que se lê ao escrever a dúvida. Trocar pelos textos preparados.
- **Portão de login volta em abril**: `cronograma.ts` e `examTopics.ts` ainda chamam
  `createNeedsAuthEmbed()`. Os canais estão apagados, por isso hoje ninguém lá chega.
- Cargos `Nível 1` a `Nível 5` **são a nota escolar**, não um sistema de XP concorrente.
  (Enganei-me duas vezes nisto.) Ponderar escondê-los da lista de membros: quem tem nível 2
  é quem mais precisa de ajuda e quem menos gosta de a ter escrita ao lado do nome.

## 5. Regras de trabalho

- **Medir antes de opinar.** Ler a API do Discord e o Supabase dá números reais em minutos.
- **Verificar os bits das permissões do Discord** antes de reportar: 1<<34 é *gerir* threads,
  1<<35 é *criar*. Enganei-me nisto e quase reportei um problema inexistente.
- Nunca escrever na BD de produção sem autorização; ler é livre.
- Nunca `next build` com o `next dev` a correr.
- Sem travessões ("—") no texto visível das apps.
- Textos para o Discord em **segunda pessoa do singular**.
- Mensagens novas vão para `discord-bot/mensagens/*.md`, para o Alin copiar; o scratchpad é efémero.

## 6. Scripts úteis

- `npm run publicar:explicacoes` (bot) atualiza as duas mensagens do canal das explicações.
- `discord-bot/scripts/top10-last-month.mjs` dá o ranking do mês anterior, só leitura.
- O cargo "Mais ativo do mês passado" segue sempre o **mês anterior**, nunca o corrente.
