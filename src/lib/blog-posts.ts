import { unstable_noStore as noStore } from 'next/cache';
import { getServiceSupabase } from '@/lib/server-bookings';

export type BlogCategory = 'Exame Nacional' | 'Métodos de estudo' | 'Matemática A';

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  seo_description: string;
  content: string;
  published_at: string | null;
  created_at: string;
  updated_at?: string | null;
  category: BlogCategory;
  cover_image_url: string;
  cover_image_alt: string;
  read_time: string;
  is_published: boolean;
};

const BLOG_POST_SEED: BlogPost[] = [
  {
    id: 'seed-folha-resposta-exame-matematica-a-2026',
    slug: 'folha',
    title: 'Folha de Resposta do Exame de Matemática A 2026: o que mudou e como preencher',
    excerpt:
      'A folha de resposta do Exame de Matemática A 2026 mudou. Vê o que mudou nas escolhas múltiplas, nas respostas extensas e na folha de continuação.',
    seo_description:
      'Descobre o novo formato da folha de resposta do Exame de Matemática A 2026, como preencher as escolhas múltiplas, como anular respostas e como usar a folha de continuação.',
    content: `A folha de resposta do Exame de Matemática A mudou. Como as provas vão ser digitalizadas para correção, há novas regras na forma de responder.

Se fores fazer exame este ano, vale a pena perceber isto antes da prova, para não cometer erros de preenchimento.

## O que muda nas escolhas múltiplas

A mudança mais importante está nas perguntas de escolha múltipla. Agora, em vez de assinalares a opção com um certo ou com um X, tens de pintar o círculo da resposta que queres escolher.

Isto acontece porque essas respostas vão ser lidas automaticamente por um computador.

## Como anular uma resposta

Se quiseres mudar a resposta, também há uma forma própria de corrigir:

- fazes um X no círculo que tinhas pintado;
- pintas o círculo da nova opção.

Se voltares a mudar de ideias:

- anulas a opção anterior;
- fazes um quadrado à volta da resposta final que queres escolher.

## Como funcionam as respostas extensas

Nas perguntas de desenvolvimento, cada resposta passa a ter a sua própria página. Ou seja, por exemplo:

- a 2 é feita numa página;
- a 3 noutra;
- a 4 noutra;
- e assim sucessivamente.

## E se faltar espaço?

Se não tiveres espaço suficiente para continuar uma resposta, podes usar uma folha de continuação. Nessa folha, tens de indicar:

- o número da pergunta que estás a continuar;
- o número da folha.

## Documento oficial e vídeo

[Documento oficial](/files/blog/ex-635-f1-2025-modelo.pdf)

!tiktok https://www.tiktok.com/@matematicatop1/video/7638016285120466209`,
    published_at: '2026-05-09T12:00:00.000Z',
    created_at: '2026-05-09T12:00:00.000Z',
    updated_at: '2026-05-09T12:00:00.000Z',
    category: 'Exame Nacional',
    cover_image_url: '/images/blog/folha-de-respostas-thumb.png',
    cover_image_alt: 'Ilustração sobre a folha de respostas do exame',
    read_time: '3 min',
    is_published: true,
  },
  {
    id: 'seed-materia-nao-lecionada',
    slug: 'materia-nao-lecionada-exame-matematica-a-2026',
    title: 'Sairá matéria que não foi dada pelos alunos no Exame de Matemática A',
    excerpt:
      'O exame de 2026 será diferente: sairão temas que alguns alunos poderão não ter dado. Aqui fica o essencial para perceber o que muda.',
    seo_description:
      'Percebe porque é que o Exame Nacional de Matemática A de 2026 pode incluir temas não lecionados por alguns alunos e como a estrutura da prova evita prejuízos.',
    content: `O exame de 2026 será diferente: sairão temas que alguns alunos poderão não ter dado.

Se quiseres ver um vídeo onde esta informação é explicada:

!youtube https://youtu.be/1hkqILlQEGg?si=Qg1khj6RWrJL3Al7

À semelhança dos anos anteriores, em 2026 haverá uma nova época de exames, na qual está incluído o Exame de Matemática A (635). Este exame engloba a matéria de 3 anos, 10.º, 11.º e 12.º anos, e será realizado no dia 23 de junho, com início às 9:30.

No entanto, o Exame de Matemática A de 2026 será um pouco diferente, já que abrangerá matéria que não foi lecionada por grande parte dos alunos. Para perceber o porquê desta situação, é necessário falar sobre as Aprendizagens Essenciais.

## O que são as Aprendizagens Essenciais?

“As Aprendizagens Essenciais são documentos de orientação curricular base na planificação, realização e avaliação do ensino e da aprendizagem, e visam promover o desenvolvimento das áreas de competências inscritas no Perfil dos Alunos à Saída da Escolaridade Obrigatória.”

Podemos entender as Aprendizagens Essenciais como os documentos que indicam os conteúdos a ser lecionados aos alunos.

Assim sendo, a grande maioria dos alunos aprendeu os conteúdos de acordo com as Aprendizagens Essenciais de 2018, mas, segundo o jornal *Público*, apenas dez turmas fizeram o seu percurso com base nas AE aprovadas em 2023.

!image /images/blog/ae-publico.png | Excerto do Público sobre as Aprendizagens Essenciais no Exame de Matemática A

## Porque é que o exame será diferente?

Apesar da discrepância no número de alunos que deu a matéria de acordo com cada uma das Aprendizagens Essenciais, o Exame de Matemática A de 2026 terá de abranger os conteúdos de ambas.

Segundo a informação divulgada, as AE de 2023 e de 2018 divergem, nomeadamente, nos seguintes conteúdos:

- Paridade de uma função
- Leis de De Morgan para conjuntos
- Monotonia e limites de sucessões
- Limite de uma sucessão de termo geral (1 + x/n)^n, com x ∈ ℝ
- Equações trigonométricas
- Triângulo de Pascal
- Binómio de Newton
- Fórmulas trigonométricas da soma, da diferença e da duplicação
- Modelos matemáticos nas eleições
- Modelos matemáticos na partilha
- Modelos matemáticos nas finanças
- Geometria sintética
- Soma de todos os termos de uma progressão geométrica de razão r, tal que |r| < 1
- Distribuições de probabilidades
- Modelo normal
- Resolução numérica de equações

!image /images/blog/ae-diferencas.png | Diferenças entre as Aprendizagens Essenciais homologadas em 2018 e em 2023

## Os alunos vão ser prejudicados?

Não. No exame, as perguntas sobre os conteúdos em que as AE divergem terão uma estrutura própria: haverá três pares de itens claramente identificados e, em cada par, o aluno responderá apenas a um dos itens.

Isto significa que o aluno pode responder à pergunta sobre a matéria que efetivamente lecionou ou, se também tiver estudado a outra, optar por essa.

!image /images/blog/ae-estrutura-prova.png | Excerto oficial sobre a estrutura da prova com pares de itens

## O que deves fazer a partir daqui?

O mais importante é preparares-te com método. Perceber esta alteração ajuda, mas o essencial continua a ser estudar com organização e saber quais são os temas que costumam sair.

**Ligações úteis:**
- [Quero aceder a um plano de preparação para o exame](/exames-nacionais/cronogramas)
- [Quero ver a frequência com que cada tema sai no exame](/exames-nacionais/o-que-sai)`,
    published_at: '2026-04-25T10:00:00.000Z',
    created_at: '2026-04-25T10:00:00.000Z',
    updated_at: '2026-04-25T10:00:00.000Z',
    category: 'Exame Nacional',
    cover_image_url: '/images/blog/materia-nao-dada-thumb.png',
    cover_image_alt: 'Ilustração sobre matéria não dada no exame',
    read_time: '4 min',
    is_published: true,
  },
  {
    id: 'seed-plano-preparacao',
    slug: 'como-fazer-plano-preparacao-exame-matematica-a',
    title: 'Como fazer um plano de preparação para o Exame de Matemática A',
    excerpt:
      'Um plano de preparação é um instrumento muito importante para uma boa nota no exame. Aqui fica um guia para o construíres bem.',
    seo_description:
      'Aprende a construir um plano de preparação para o Exame de Matemática A com objetivos realistas, estratégia de estudo e organização por prioridades.',
    content: `Um plano de preparação é um instrumento muito importante para uma boa nota no exame. Se queres chegar ao dia da prova com mais controlo, menos ansiedade e uma estratégia clara, vale a pena montares um plano a sério.

## 1. Define o teu objetivo

Quanto é que precisas para o exame? Precisas de um 19? De um 10? De um 14?

Antes de planificares o teu estudo, tem em conta a nota mínima que pretendes ter. Obviamente que o objetivo é sempre ter a nota máxima. O problema é que, para se ter um 20, a estratégia de estudo é uma e é necessário ter bases sólidas.

Como é que são as tuas bases? Qual foi a tua nota a Matemática A? Achas que essa nota reflete as tuas capacidades ou devias ter tido mais ou menos? Sê sincero e pensa numa nota alcançável com esforço e tendo em conta as tuas capacidades. Sê ambicioso, mas realista.

## 2. Muda a tua mentalidade

Agora que já tens o teu objetivo definido para o exame, tens de trabalhar para o alcançar. Se a nota que pretendes exige esforço, tens de perceber isso desde já.

O Exame de Matemática A é difícil, é verdade, a matéria não é fácil e é matéria de 3 anos, mas isso não significa que seja impossível tirar a nota que queres. Para tirares essa nota, vais ter de reorganizar as tuas prioridades e fazer sacrifícios: vais ter de estudar.

É um esforço, mas um esforço que vale a pena. Pensa bem: o que preferes, sofrer um pouco agora com a necessidade de te esforçares ou sofrer depois com o arrependimento de que devias ter estudado?

## 3. Planifica a estratégia

Já sabes a nota que precisas e já estás determinado a fazer o que for preciso para a alcançar. Falta decidir como é que o estudo vai ser realizado. Dependendo da nota que queres, a tua estratégia será diferente.

### Preciso de um 10

Se precisares de ter metade da cotação máxima, então a estratégia vai incidir em saberes muito bem um conjunto mais restrito de temas ou perguntas.

1. Resolve o exame mais recente, vê a sua correção e percebe quais são os temas que sabes mais e quais sabes menos.
2. Aperfeiçoa os temas que sabes mais, porque esses tens de acertar no exame. Depois, relativamente àqueles que não sabes tão bem, tenta perceber quais é que podes entender completamente se os estudares através da resolução de mais exercícios de exame.
3. Em 2026, a estrutura vai ser diferente, então dá uma olhada nas AE de 2023. Há temas acessíveis, como os modelos matemáticos, que te podem ajudar a ganhar alguns pontos.
4. Quando entenderes bem temas que cubram cerca de 60% do exame, dá uma olhada nos restantes para a possibilidade de espremer mais alguns pontos.

### Preciso de um 14

Se precisares de cerca de 70% da cotação, então vais ter de ter um grande entendimento da maioria dos temas do exame. Só podes falhar cerca de 4 perguntas, pelo que o teu estudo terá de abranger praticamente todos os temas.

1. Resolve o exame mais recente, vê a sua correção e percebe quais são os temas que sabes mais e quais sabes menos.
2. Esclarece rapidamente as dúvidas nos temas em que já tens mais bases e começa a focar-te naqueles em que tens mais dificuldades.
3. Revê a teoria e faz exercícios de exame, corrige-os, volta a fazer exercícios, volta a corrigi-los, até que os padrões fiquem bem mecanizados.
4. Garante que percorreste e entendeste bem todos os temas do programa e dá também uma olhada nas AE de 2023.
5. Resolve mais exames.

### Preciso de um 18-20

Se precisares de ter mais de 90% da cotação, então suponho que tens uma base muito sólida da matéria e que, ao longo do secundário, deste-te bem com a Matemática A.

1. Resolve o exame mais recente e vê se há alguma matéria que ainda não está bem esclarecida.
2. Se houver, esclarece-a, revendo a teoria e resolvendo perguntas de exame. Se não houver, continua a resolver mais exames.
3. Quando já tiveres resolvido bastantes exames, vais começar a mecanizar o tipo de exercícios e a sentir-te mais confortável. Nessa fase, os exercícios mais difíceis passam a ser os “papa-vintes”.
4. Resolve o “papa-vintes” de cada ano para treinares o teu cérebro a lidar com questões de maior dificuldade e procura também exercícios de demonstrações no manual ou na internet.

## 4. Plano de preparação

Agora que já tens a estratégia delineada, constrói o teu plano de preparação em função do tempo que tens até ao exame e de acordo com a tua estratégia e com as tuas prioridades.

Um bom plano de preparação deve:

- distribuir os temas pelo tempo que tens até ao exame
- dar mais espaço à matéria em que tens mais dificuldade
- reservar tempo para revisão
- incluir resolução de exames completos

Se precisares de ajuda, já fiz 19 cronogramas para o exame, construídos de acordo com a altura em que se vai começar a estudar e com o tema em que se tem mais dificuldade. Estes cronogramas abordam todos os temas do exame. Podes usá-los como plano de preparação ou apenas como referência para construíres o teu.

Já tens o teu plano de preparação. Agora só falta uma coisa: começar já a trabalhar.

**Ligações úteis:**
- [Ver cronogramas de preparação](/exames-nacionais/cronogramas)
- [Marcar uma explicação](/marcar)`,
    published_at: '2026-04-25T11:00:00.000Z',
    created_at: '2026-04-25T11:00:00.000Z',
    updated_at: '2026-04-25T11:00:00.000Z',
    category: 'Métodos de estudo',
    cover_image_url: '/images/blog/plano-preparacao-thumb.png',
    cover_image_alt: 'Ilustração sobre plano de preparação',
    read_time: '6 min',
    is_published: true,
  },
  {
    id: 'seed-prova-ensaio-9ano',
    slug: 'correcao-da-prova-ensaio-9ano',
    title: 'Correção da prova ensaio 9º ano',
    excerpt:
      'No dia 23 de abril realizou-se mais uma prova ensaio de Matemática do 9º ano. Aqui podes encontrar a correção em PDF ou em vídeo.',
    seo_description:
      'Consulta a correção da prova ensaio de Matemática do 9º ano de 2026, em PDF ou vídeo, e percebe o objetivo desta prova de preparação.',
    content: `No dia 23 de abril, realizou-se mais uma prova ensaio de matemática do 9º ano. Esta prova tem como objetivo preparar os alunos para o Exame Nacional de Matemática, bem como testar e aperfeiçoar detalhes técnicos para as provas finais.

Desde o ano passado, as provas finais, e também as provas ensaio, passaram a ser realizadas num novo formato: enunciado digital e resolução em papel. Foi uma mudança que gerou controvérsia e que foi acompanhada pela decisão de que as provas digitais não seriam disponibilizadas ao público.

Assim, supostamente, após a sua realização no dia 23 de abril, ninguém conseguiria aceder ao enunciado da prova ensaio de matemática, a não ser as autoridades correspondentes.

## Como foi possível reconstruir a prova?

No entanto, com a ajuda da comunidade MatemáticaTop, foi possível reconstituir parte da prova e, portanto, podes encontrar a sua resolução no PDF abaixo.

Se quiseres entrar na comunidade, basta ires a https://discord.gg/matematicatop.

## Correção em PDF

- [Abrir correção da prova ensaio 2026](/files/blog/correcao-prova-ensaio-2026.pdf)

## Correção em vídeo

Se preferires ver a correção em vídeo, podes aceder ao seguinte vídeo:

!youtube https://youtu.be/YyZxEvlN7qs?si=uxute-t_E2J5_L5v

## Links úteis

- [Ver cronogramas de preparação](/exames-nacionais/cronogramas)
- [Marcar uma explicação](/marcar)`,
    published_at: '2026-04-25T12:00:00.000Z',
    created_at: '2026-04-25T12:00:00.000Z',
    updated_at: '2026-04-25T12:00:00.000Z',
    category: 'Exame Nacional',
    cover_image_url: '/images/blog/prova-ensaio-thumb.png',
    cover_image_alt: 'Ilustração para correção da prova ensaio',
    read_time: '3 min',
    is_published: true,
  },
  {
    id: 'seed-formulas-exame-9ano',
    slug: 'formulas-exame-matematica-9ano',
    title: 'Fórmulas para o Exame de Matemática do 9.º ano (além do formulário)',
    excerpt:
      'Para além do formulário, há fórmulas que tens mesmo de saber de cor no Exame de Matemática do 9.º ano. Aqui ficam as principais, tema a tema.',
    seo_description:
      'Lista das fórmulas essenciais para o Exame de Matemática do 9.º ano além do formulário: áreas, Teorema de Pitágoras, trigonometria, funções, estatística e probabilidades.',
    content: `As fórmulas são importantes para uma boa nota no Exame de Matemática do 9.º ano. No dia da prova vais ter um formulário, mas ele não cobre tudo: há fórmulas que tens mesmo de saber de cor. Aqui ficam as principais, organizadas por tema.

## Geometria: áreas que tens de saber

Começa pelas áreas das figuras mais comuns:

- área do quadrado: lado vezes lado
- área do retângulo: comprimento vezes largura
- área do triângulo: base vezes altura a dividir por 2

## Trigonometria e Teorema de Pitágoras

Num triângulo retângulo, tens de saber calcular o seno, o cosseno e a tangente de um ângulo:

- seno: cateto oposto a dividir pela hipotenusa
- cosseno: cateto adjacente a dividir pela hipotenusa
- tangente: cateto oposto a dividir pelo cateto adjacente

E como é um triângulo retângulo, podes aplicar o Teorema de Pitágoras: a soma dos quadrados dos catetos é igual ao quadrado da hipotenusa.

## Funções: as expressões que precisas de dominar

Em relação às funções, há quatro situações que aparecem quase sempre:

- **Função afim:** é definida por y = ax + b.
- **Declive de uma reta:** para o encontrares precisas de dois pontos e aplicas a fórmula do declive (y2 - y1 a dividir por x2 - x1). Depois de teres o declive, substituis o x e o y pelas coordenadas de um ponto para descobrir o b.
- **Proporcionalidade inversa:** é definida por y = k/x. Para descobrires o k, substituis o x e o y pelas coordenadas de um ponto e multiplicas.
- **Função quadrática:** é do tipo y = ax². Para descobrires o a, substituis o x e o y pelas coordenadas de um ponto e divides y pelo x ao quadrado.

## Estatística

Na estatística, guarda estas duas:

- **Média:** soma de todos os valores a dividir pelo número de valores.
- **Amplitude:** valor máximo menos o valor mínimo.

## Probabilidades

Nas probabilidades, a fórmula essencial é a Lei de Laplace: a probabilidade de um acontecimento é igual ao número de casos favoráveis a dividir pelo número de casos possíveis.

## Resumo para guardares

Estas são as principais fórmulas para o exame. Guarda o resumo abaixo para o reveres antes da prova.

!resumo /images/blog/formulas-9ano-resumo.png | Resumo das fórmulas para o Exame de Matemática do 9.º ano | 900x1600

## Ver em vídeo

!tiktok https://www.tiktok.com/@matematicatop1/video/7640973728683167008

**Precisas de ajuda a fixar estas fórmulas?** [Marca uma explicação de Matemática](/marcar) e prepara-te bem para o exame.`,
    published_at: '2026-06-04T09:00:00.000Z',
    created_at: '2026-06-04T09:00:00.000Z',
    updated_at: '2026-06-04T09:00:00.000Z',
    category: 'Exame Nacional',
    cover_image_url: '/images/blog/formulas-exame-9ano-cover.png',
    cover_image_alt: 'Fórmulas para o Exame de Matemática do 9.º ano',
    read_time: '4 min',
    is_published: true,
  },
  {
    id: 'seed-como-estudar-exame-matematica',
    slug: 'como-estudar-para-o-exame-de-matematica',
    title: 'Como estudar para o Exame de Matemática: um método em 3 passos',
    excerpt:
      'Como é que se estuda para um Exame de Matemática? Aqui encontras um método simples que te vai ajudar na preparação para o exame.',
    seo_description:
      'Aprende a estudar para o Exame de Matemática em três passos: define o objetivo, sabe quantas perguntas precisas de acertar e resolve exercícios de exame.',
    content: `Com os exames a aproximar-se, uma pergunta muito frequente é: como é que se estuda para um Exame de Matemática? Eis três passos para preparares o teu exame de forma adequada.

## 1. Define o teu objetivo

A primeira pergunta a fazeres é: que nota precisas mesmo de tirar? Só precisas de positiva ou queres a nota máxima?

O ideal é sempre apontar o mais alto possível, mas tens de ter em conta as tuas capacidades e a tua relação com a disciplina. Sê realista, mas não te ponhas limites: este objetivo serve para orientar o teu estudo. Trabalha para o alcançar e, se sentires que consegues mais, vai atrás disso.

## 2. Sabe quantas perguntas precisas de acertar

Depois de saberes a nota que queres, consegues estimar quantas perguntas tens de acertar. Sabendo que o exame normalmente tem 18 perguntas (a título indicativo, porque depende sempre da cotação de cada pergunta):

- para cerca de 20%, precisas de acertar à volta de 4 perguntas
- para cerca de 50%, precisas de acertar 9 a 10 perguntas
- para cerca de 70%, precisas de mais ou menos 13 a 14 perguntas
- para cerca de 90%, tens de acertar por volta de 16 perguntas

Aponta sempre para uma ou duas perguntas a mais do que o mínimo. Assim, se falhares alguma, continuas dentro do teu objetivo.

## 3. Resolve exercícios de exame

Os exames costumam ser parecidos de ano para ano e, salvo algumas exceções, os exercícios são do mesmo tipo. Por isso, depois de definires o objetivo e de saberes quantas perguntas precisas de acertar, o passo mais importante é resolver muitos exercícios de exame até ganhares uma base sólida.

Estas são as minhas três dicas. Simples, mas fazem toda a diferença.

## Ver em vídeo

!tiktok https://www.tiktok.com/@matematicatop1/video/7641733187395243296

**Queres um plano feito à tua medida?** [Marca uma explicação de Matemática](/marcar) e organiza o teu estudo até ao dia do exame.`,
    published_at: '2026-06-04T09:05:00.000Z',
    created_at: '2026-06-04T09:05:00.000Z',
    updated_at: '2026-06-04T09:05:00.000Z',
    category: 'Métodos de estudo',
    cover_image_url: '/images/blog/como-estudar-exame-cover.png',
    cover_image_alt: 'Como estudar para o Exame de Matemática',
    read_time: '4 min',
    is_published: true,
  },
  {
    id: 'seed-erros-ao-estudar-exame-matematica',
    slug: 'erros-ao-estudar-para-o-exame-de-matematica',
    title: '3 erros que tens de evitar ao estudar para o Exame de Matemática',
    excerpt:
      'Estudar muito não chega se estudares mal. Estes são os três erros mais comuns ao preparar o Exame de Matemática, mais um extra que faz toda a diferença.',
    seo_description:
      'Os três erros mais comuns ao estudar para o Exame de Matemática: ficar pela teoria, decorar fórmulas sem as perceber e não resolver exercícios de exame.',
    content: `Estudar muitas horas não chega se estudares mal. Há erros que parecem produtivos, mas que te roubam tempo e nota. Estes são os três erros que não podes cometer ao preparar o Exame de Matemática (+ um erro extra).

## Erro 1: ficar só pela teoria e pelos resumos

Ler a teoria e fazer resumos bonitos dá uma falsa sensação de progresso. Vê a parte teórica até perceberes o essencial, mas salta rapidamente para os exercícios. A Matemática é uma disciplina prática.

## Erro 2: decorar fórmulas sem saber para que servem

Imagina que decoraste uma determinada fórmula. Podes sabê-la de cor, mas de que serve se não souberes usá-la?

Antes de a aplicares, pergunta-te:

- em que contexto é que uso esta fórmula?
- o que é que ela significa?
- o que representa cada elemento da fórmula?

Depois de fazeres este trabalho, sim, já estás pronto para a aplicar com confiança.

## Erro 3: não resolver exercícios de exame

Se há erro que não podes mesmo cometer é este. Para te preparares a sério, não resolvas qualquer exercício: resolve exercícios de exame. Assim habituas-te à linguagem das perguntas e ao tipo de questões que costuma sair.

## Erro extra: não praticar em contexto de exame

Para chegares pronto ao dia da prova, treina nas mesmas condições. Senta-te à mesa com um caderno e um exame de um determinado ano, mete um cronómetro com a duração real da prova e resolve-o como se estivesses mesmo a fazer o exame.

## Ver em vídeo

!tiktok https://www.tiktok.com/@matematicatop1/video/7643407464280509729

**Queres corrigir o teu método de estudo?** [Marca uma explicação de Matemática](/marcar) e estuda da forma certa.`,
    published_at: '2026-06-04T09:10:00.000Z',
    created_at: '2026-06-04T09:10:00.000Z',
    updated_at: '2026-06-04T09:10:00.000Z',
    category: 'Métodos de estudo',
    cover_image_url: '/images/blog/erros-ao-estudar-cover.png',
    cover_image_alt: 'Erros ao estudar para o Exame de Matemática',
    read_time: '3 min',
    is_published: true,
  },
  {
    id: 'seed-previsao-perguntas-matematica-a',
    slug: 'previsao-perguntas-exame-matematica-a',
    title: 'Quais vão ser as perguntas do Exame de Matemática A? A minha previsão',
    excerpt:
      'Já se conhecem as cotações do Exame de Matemática A. Com base nelas, deixo a minha previsão sobre as perguntas que podem sair na prova.',
    seo_description:
      'Previsão das perguntas do Exame de Matemática A com base nas cotações: escolhas múltiplas, respostas extensas opcionais e obrigatórias, tema a tema.',
    content: `Já saíram as instruções de realização da prova, por isso já conhecemos as cotações das perguntas do Exame de Matemática A. Com base nisso, deixo a minha previsão sobre o que pode sair. Atenção: é uma previsão, não uma garantia.

## As escolhas múltiplas e a pergunta de estatística

Olhando para as cotações, há 5 perguntas que valem 12 pontos cada. A minha previsão é que seja:

- uma de estatística
- quatro de escolha múltipla

Nas de escolha múltipla, a minha previsão é que 3 delas sejam daquelas em que as alternativas correspondem a AE diferentes (a tal estrutura com pares de itens). Suponho que saiam, do lado das Aprendizagens Essenciais de 2018, as leis de De Morgan, limites de sucessões e o triângulo de Pascal; e, do lado de 2023, modelos matemáticos, geometria sintética e distribuições de probabilidades.

A pergunta de escolha múltipla que falta, penso que seja sobre números complexos, qualquer coisa relacionada com a forma algébrica.

## As respostas extensas opcionais

Depois temos as perguntas de resposta extensa. Nas opcionais, há 6 perguntas das quais contam 3. A minha previsão para estas é:

- uma sobre sucessões
- uma sobre números complexos, em que terás de resolver uma equação
- uma sobre funções exponenciais ou logarítmicas
- uma sobre probabilidades
- uma sobre trigonometria, em que vais aplicar fórmulas ou interpretar o círculo trigonométrico
- uma sobre funções, com derivadas, ou então sobre geometria analítica

## As respostas extensas obrigatórias

Quanto às obrigatórias, o mais provável é que tenhamos estes temas:

- geometria no espaço (interseções de retas ou planos)
- funções (calculadora gráfica)
- probabilidades
- limites
- derivadas, com estudo da monotonia ou da concavidade
- papa-vintes

## Resumo da previsão

Esta é a minha previsão para as perguntas do exame. Guarda o resumo abaixo, mas não te esqueças: estuda tudo, porque isto é apenas uma previsão.

!resumo /images/blog/perguntas-exame-matematica-a-resumo.png | Resumo da previsão das perguntas do Exame de Matemática A | 900x1600

## Ver em vídeo

!tiktok https://www.tiktok.com/@matematicatop1/video/7634926598046764321

**Queres preparar todos estes temas a sério?** [Marca uma explicação de Matemática A](/marcar) e chega ao exame com confiança.`,
    published_at: '2026-06-04T09:15:00.000Z',
    created_at: '2026-06-04T09:15:00.000Z',
    updated_at: '2026-06-04T09:15:00.000Z',
    category: 'Matemática A',
    cover_image_url: '/images/blog/perguntas-exame-matematica-a-cover.png',
    cover_image_alt: 'Previsão das perguntas do Exame de Matemática A',
    read_time: '5 min',
    is_published: true,
  },
  {
    id: 'seed-o-que-sai-exame-9ano',
    slug: 'o-que-sai-no-exame-de-matematica-9ano',
    title: 'O que sai no Exame de Matemática do 9.º ano? Os temas de sempre',
    excerpt:
      'Saber o que costuma sair ajuda-te a estudar de forma mais eficiente. Estes são os 14 temas que aparecem quase todos os anos no Exame de Matemática do 9.º ano.',
    seo_description:
      'Os temas que saem quase sempre no Exame de Matemática do 9.º ano: intervalos, notação científica, funções, Pitágoras, probabilidades, estatística e mais.',
    content: `Saber o que costuma sair no Exame de Matemática do 9.º ano pode ajudar-te na tua preparação para o exame. Estes são os temas que aparecem quase todos os anos.

## Os temas que saem quase sempre

1. **Intervalos de números:** vais ter de dizer se um determinado número pertence a um certo intervalo.

2. **Dízimas:** vais ter de identificar se um número é uma dízima infinita periódica ou não periódica.

3. **Notação científica:** vais ter um enunciado com dados, vais ter de interpretá-los e escrever um número em notação científica.

4. **Sequências:** vais ter de calcular o termo geral ou calcular termos sabendo a sua ordem.

5. **Inequações:** vais ter de resolver uma inequação ou, como tem acontecido nos últimos anos, ordenar os passos da sua resolução.

6. **Equações do 2.º grau:** vais resolver uma equação do 2.º grau através de casos notáveis ou da lei do anulamento do produto.

7. **Funções:** costumam surgir duas perguntas, uma para calcular a expressão geral de uma função e outra com duas funções que se intersetam.

8. **Teorema de Pitágoras:** vais ter uma pergunta para o aplicar.

9. **Sólidos geométricos:** vais ter de calcular o volume de um sólido.

10. **Semelhança de triângulos:** vais ter de aplicar a semelhança de triângulos numa pergunta.

11. **Probabilidades:** costumam sair duas perguntas, uma com a Lei de Laplace quase direta e outra em que tens de fazer uma tabela antes de a aplicar.

12. **Trigonometria:** vais ter uma pergunta que envolve trigonometria.

13. **Circunferência:** vais ter triângulos e ângulos inscritos numa circunferência, e terás de calcular o que a pergunta pedir.

14. **Estatística:** costumam sair duas perguntas, uma para aplicar a média ou a mediana e outra para interpretar dados.

## Resumo para guardares

Estes são os temas que saem quase sempre no Exame de Matemática do 9.º ano. Guarda o resumo abaixo para reveres sempre que precisares.

!resumo /images/blog/o-que-sai-exame-9ano-resumo.png | Resumo dos temas que saem no Exame de Matemática do 9.º ano | 1080x1350

## Ver em vídeo

!tiktok https://www.tiktok.com/@matematicatop1/video/7630922477970918689

**Queres dominar todos estes temas?** [Marca uma explicação de Matemática](/marcar) e prepara-te bem para o exame.`,
    published_at: '2026-06-04T09:20:00.000Z',
    created_at: '2026-06-04T09:20:00.000Z',
    updated_at: '2026-06-04T09:20:00.000Z',
    category: 'Exame Nacional',
    cover_image_url: '/images/blog/o-que-sai-exame-9ano-cover.png',
    cover_image_alt: 'Temas que saem no Exame de Matemática do 9.º ano',
    read_time: '4 min',
    is_published: true,
  },
];

function mapBlogRow(row: Record<string, unknown>): BlogPost {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: String(row.excerpt || ''),
    seo_description: String(row.seo_description || ''),
    content: String(row.content || ''),
    published_at: row.published_at ? String(row.published_at) : null,
    created_at: String(row.created_at || row.published_at || ''),
    updated_at: row.updated_at ? String(row.updated_at) : null,
    category: String(row.category || 'Matemática A') as BlogCategory,
    cover_image_url: String(row.cover_image_url || '/images/exames/o-que-sai-nos-exames.png'),
    cover_image_alt: String(row.cover_image_alt || 'Capa do artigo'),
    read_time: String(row.read_time || '4 min'),
    is_published: Boolean(row.is_published),
  };
}

function mergePosts(dbPosts: BlogPost[]) {
  const merged = new Map<string, BlogPost>();

  BLOG_POST_SEED.forEach((post) => {
    merged.set(post.slug, post);
  });

  dbPosts.forEach((post) => {
    merged.set(post.slug, post);
  });

  const folhaPost = BLOG_POST_SEED.find((post) => post.slug === 'folha');
  if (folhaPost) {
    merged.set(folhaPost.slug, folhaPost);
  }

  return Array.from(merged.values()).sort((a, b) => {
    const aTime = new Date(a.published_at || a.created_at).getTime();
    const bTime = new Date(b.published_at || b.created_at).getTime();
    return bTime - aTime;
  });
}

export function createBlogPostSlug(title: string) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function getPublishedBlogPosts() {
  noStore();

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (error || !data) {
      return mergePosts([]);
    }

    return mergePosts(data.map((row) => mapBlogRow(row as Record<string, unknown>)).filter((row) => row.is_published));
  } catch {
    return BLOG_POST_SEED;
  }
}

export async function getBlogPostBySlug(slug: string) {
  noStore();

  if (slug === 'folha') {
    return BLOG_POST_SEED.find((post) => post.slug === slug) ?? null;
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (!error && data) {
      return mapBlogRow(data as Record<string, unknown>);
    }
  } catch {
    // noop
  }

  return BLOG_POST_SEED.find((post) => post.slug === slug) ?? null;
}

export function getSeedBlogPosts() {
  return BLOG_POST_SEED.slice();
}

export async function getAllBlogPosts() {
  return getPublishedBlogPosts();
}
