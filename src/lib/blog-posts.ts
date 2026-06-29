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
  {
    id: 'seed-nota-precisas-exame-9ano',
    slug: 'que-nota-precisas-no-exame-9ano',
    title: 'Que nota precisas de tirar no Exame do 9.º ano para passar? (Português e Matemática)',
    excerpt:
      'Agora que o exame do 9.º ano está à porta, percebe que nota precisas mesmo de tirar a Português e a Matemática para passar de ano. Explico a fórmula, quantas negativas podes ter e deixo uma tabela para guardares.',
    seo_description:
      'Que nota precisas de tirar nos exames do 9.º ano de Português e Matemática para passar de ano? Vê a fórmula da nota final, quantas negativas podes ter e uma tabela com todas as combinações de nota interna e nota do exame.',
    content: `Agora que o exame do 9.º ano está mesmo à porta, é importante saberes que nota precisas de tirar para passares de ano. A boa notícia é que, com a tua nota interna na mão, dá para saber exatamente o que tens de fazer no exame. Isto aplica-se tanto a Português como a Matemática.

## Quantas negativas podes ter?

Para passares de ano, podes ter até duas negativas, mas com uma condição importante: não podem ser ao mesmo tempo a Português e a Matemática.

Ou seja:

- Até duas negativas noutras disciplinas (não Português e Matemática em simultâneo): passas.
- Negativa a Português E a Matemática ao mesmo tempo: não passas.
- Três ou mais negativas: não passas.

## Como se calcula a nota final da disciplina

A nota final de Português e de Matemática no 9.º ano não é só o exame. Junta a tua nota interna (a que tens na disciplina depois de terminarem as aulas) com a nota do exame, com pesos diferentes:

**Nota final = (7 × nota interna + 3 × nota do exame) ÷ 10**

Ou seja, a nota interna vale 70% e o exame vale 30%. No fim, o resultado é arredondado às unidades, para o nível mais próximo (de 1 a 5).

## Quando é que o exame muda a tua nota final?

Como a nota interna pesa mais, o exame não muda assim tão facilmente a tua nota final. Na prática, a tua nota final só sobe ou desce um nível se a nota do exame for, pelo menos, dois níveis diferente da tua nota interna.

Vê este exemplo a Matemática:

- Tens 3 na disciplina e tiras 1 no exame: a nota final passa a 2 (ficas com negativa).
- Tens 3 na disciplina e tiras 2, 3 ou 4 no exame: a nota final mantém-se em 3.

Um exame só ligeiramente abaixo da tua nota interna não te tira a positiva. Mas um exame muito abaixo pode tirar.

## Tabela: a tua nota final consoante a interna e o exame

Para não teres de fazer contas, guarda esta tabela. Procura a tua nota interna e a nota do exame: o cruzamento é a tua nota final.

!resumo /images/blog/nota-exame-9ano-resumo.png | Tabela da nota final do 9.º ano consoante a nota interna e a nota do exame | 1080x1080

## Ver em vídeo

!tiktok https://www.tiktok.com/@matematicatop1/video/7650152073572470049

## Precisas de chegar à nota que queres?

Se precisas de ajuda para garantir a positiva ou subir a nota no exame, eu e a minha equipa damos explicações de Matemática desde 6€/hora. Vê em [matematica.top/explicacoes](/explicacoes) e marca a tua.`,
    published_at: '2026-06-08T10:00:00.000Z',
    created_at: '2026-06-08T10:00:00.000Z',
    updated_at: '2026-06-08T10:00:00.000Z',
    category: 'Exame Nacional',
    cover_image_url: '/images/blog/nota-exame-9ano-cover.png',
    cover_image_alt: 'Que nota precisas de tirar no Exame do 9.º ano',
    read_time: '3 min',
    is_published: true,
  },
  {
    id: 'seed-como-tirar-20-9ano',
    slug: 'como-tirar-20-no-exame-de-matematica-9ano',
    title: 'Como tirar 20% (nível 2) no Exame de Matemática do 9.º ano',
    excerpt:
      'Não precisas de saber tudo para garantir o nível 2 no Exame de Matemática do 9.º ano. Com uma estratégia focada nos temas mais fáceis, garantes as perguntas de que precisas.',
    seo_description:
      'Como tirar pelo menos 20% (nível 2) no Exame de Matemática do 9.º ano: quantas perguntas precisas de acertar e que temas estudar (dízimas, intervalos, probabilidades, estatística e Teorema de Pitágoras).',
    content: `Não precisas de saber tudo para garantir o nível 2 no Exame de Matemática do 9.º ano. Com uma estratégia focada nos temas mais fáceis, que saem quase todos os anos, consegues garantir as perguntas de que precisas.

## Quantas perguntas precisas de acertar?

Para tirares pelo menos nível 2, precisas de acertar à volta de 5 a 6 perguntas. O exame costuma ter 18 a 19 perguntas, cada uma a valer cerca de 5 a 7 pontos, por isso acertar 5 a 6 dá-te uma boa margem para chegar aos 20%.

## A estratégia: dominar os temas mais fáceis

A ideia é simples: em vez de tentares estudar tudo, escolhe os temas mais fáceis de entre os que saem quase sempre e treina-os muito bem com exercícios de exames de anos anteriores. Se garantires esses, garantes as perguntas de que precisas.

## Os temas a estudar

- **Dízimas:** costuma aparecer uma escolha múltipla em que tens de dizer se um número é uma dízima infinita periódica ou não periódica.
- **Intervalos:** também costuma ser escolha múltipla, em que identificas o número que pertence ao intervalo apresentado.
- **Probabilidades:** em especial a escolha múltipla em que aplicas a Lei de Laplace diretamente.
- **Estatística:** aqui tens duas perguntas a aproveitar, uma para interpretar gráficos e outra para calcular a média ou a mediana.
- **Teorema de Pitágoras:** aparece uma pergunta em que calculas o comprimento de um cateto ou da hipotenusa.

## Resumo para guardares

Estes são os temas a dominar para garantir o nível 2. Guarda o resumo abaixo.

!resumo /images/blog/tirar-20-9ano-resumo.png | Temas a estudar para tirar 20% no Exame de Matemática do 9.º ano | 900x900

## Não te ponhas limites

Se acertares estes temas, basicamente garantes o nível 2. Mas não fiques por aí: no dia do exame, tenta resolver tudo e tirar o máximo de pontos possível.

## Ver em vídeo

!tiktok https://www.tiktok.com/@matematicatop1/video/7653582281067564320

## Precisas de ajuda?

Se precisas de ajuda para garantir a positiva no exame, eu e a minha equipa damos explicações de Matemática. Vê em [matematica.top/explicacoes](/explicacoes).`,
    published_at: '2026-06-21T10:00:00.000Z',
    created_at: '2026-06-21T10:00:00.000Z',
    updated_at: '2026-06-21T10:00:00.000Z',
    category: 'Exame Nacional',
    cover_image_url: '/images/blog/tirar-20-9ano-cover.png',
    cover_image_alt: 'Como tirar 20% no Exame de Matemática do 9.º ano',
    read_time: '3 min',
    is_published: true,
  },
  {
    id: 'seed-estudar-ultima-semana',
    slug: 'como-estudar-exame-matematica-ultima-semana',
    title: 'Como estudar para o Exame de Matemática na última semana',
    excerpt:
      'Falta pouco e ainda não estudaste? Não entres em pânico. Aqui fica um plano focado para aproveitares ao máximo o tempo que tens até ao Exame de Matemática.',
    seo_description:
      'Plano para estudar para o Exame de Matemática na última semana: define o objetivo, resolve um exame recente, garante os temas que sabes e monta um plano de estudo eficaz.',
    content: `Falta pouco para o exame e ainda não estudaste? Não entres em pânico. Com um plano focado, ainda dás a volta. Aqui ficam os passos para aproveitares ao máximo o tempo que tens.

## O que NÃO deves fazer

- Não estudar e deixar tudo ao acaso.
- Ficar desesperado, porque o desespero só te tira tempo e foco.
- Estudar à toa, sem método nem objetivo.

## Passo 1: define o teu objetivo

Começa por decidir que nota queres e percebe quantas perguntas precisas de acertar para lá chegar. Usa a estimativa consoante a forma como o teu exame é classificado.

9.º ano:

!image /images/blog/estudar-ultima-semana-perguntas-percentagem.png | Estimativa do número de perguntas a acertar consoante a percentagem que queres no exame

12.º ano:

!image /images/blog/estudar-ultima-semana-perguntas-valores.png | Estimativa do número de perguntas a acertar consoante os valores que queres no exame

## Passo 2: resolve um exame recente

Resolve um exame nacional recente, corrige-o com cuidado e percebe quais são os temas que sabes melhor e os que sabes pior. É este diagnóstico que vai guiar o teu estudo.

## Passo 3: garante os temas que já sabes

Faz exercícios sobre os temas que dominas melhor para garantir que não falhas essas perguntas. São os teus pontos seguros.

## Passo 4: recupera os temas certos

Dos temas que sabes pior, identifica aqueles em que, com algum treino, ainda consegues passar a acertar, e resolve exercícios de exame sobre esses. O objetivo é ficares com uma base sólida para o número de perguntas de que precisas.

## Passo 5: faz um plano de estudo

Por fim, monta um plano com um número definido de horas para resolver exercícios sobre estes temas e para fazer simulações de dia de exame (resolver exames completos como se fosse o dia real). Fora dessas simulações, estuda em intervalos de cerca de 45 minutos, com pausas de 5 a 10 minutos (ou outros tempos que já funcionem para ti), e sem distrações.

## Resumo para guardares

!resumo /images/blog/estudar-ultima-semana-resumo.png | Plano para estudar para o Exame de Matemática na última semana | 742x578

## Ver em vídeo

!tiktok https://www.tiktok.com/@matematicatop1/video/7652795170680769824

## Precisas de ajuda?

Se precisas de ajuda para alcançar a nota que queres, eu e a minha equipa damos explicações de Matemática. Vê em [matematica.top/explicacoes](/explicacoes).`,
    published_at: '2026-06-20T10:00:00.000Z',
    created_at: '2026-06-20T10:00:00.000Z',
    updated_at: '2026-06-20T10:00:00.000Z',
    category: 'Métodos de estudo',
    cover_image_url: '/images/blog/estudar-ultima-semana-cover.png',
    cover_image_alt: 'Como estudar para o Exame de Matemática em uma semana',
    read_time: '4 min',
    is_published: true,
  },
  {
    id: 'seed-nota-exames-secundario',
    slug: 'que-nota-precisas-nos-exames-do-secundario',
    title: 'Que nota precisas de tirar nos Exames Nacionais do Secundário?',
    excerpt:
      'No secundário, o peso do exame depende de para que serve: aprovação à disciplina ou prova de ingresso. Vê como funciona e usa a tabela para saber a nota que precisas.',
    seo_description:
      'Que nota precisas de tirar nos Exames Nacionais do Secundário? Como o exame conta para a nota da disciplina (25%), a fórmula da nota final, um exemplo e o peso como prova de ingresso na universidade.',
    content: `Antes do exame, vale a pena saber exatamente que nota precisas de tirar. No secundário, o peso do exame depende de para que serve: aprovação à disciplina ou prova de ingresso na universidade. Vê como funciona e usa a tabela para saber a tua.

## Quando o exame conta para a nota da disciplina

Se o exame é para aprovação, ele vale 25% da nota final dessa disciplina. A nota final calcula-se assim:

**Nota final = 0,75 × nota interna + 0,25 × nota do exame**

Ou seja, a tua nota interna pesa 75% e o exame pesa 25%.

## Um exemplo

Imagina um aluno com 15 na nota interna de Matemática. Se tirar 12 no exame, a nota final desce para 14. Como a interna pesa mais, o exame ajusta a nota, mas não a muda de forma drástica.

## Tabela: a tua nota final

Para saberes onde ficas, usa a tabela. Cruza a tua nota interna com a nota que esperas tirar no exame:

!resumo /images/blog/nota-secundario-resumo.png | Tabela da nota final no secundário consoante a nota interna e a nota do exame | 2214x3350

## Quando o exame é só prova de ingresso

Se fizeres o exame apenas como prova de ingresso, ele não conta para a nota final da disciplina. Mas continua a ser muito importante: vale, pelo menos, 45% da tua nota de candidatura ao ensino superior. Ou seja, é decisivo para entrares no curso que queres.

## Ver em vídeo

!tiktok https://www.tiktok.com/@matematicatop1/video/7651730123598597409

## Precisas de ajuda?

Especificamente a Matemática, se precisas de ajuda para tirar a nota que queres, eu e a minha equipa damos explicações. Vê em [matematica.top/explicacoes](/explicacoes).`,
    published_at: '2026-06-19T10:00:00.000Z',
    created_at: '2026-06-19T10:00:00.000Z',
    updated_at: '2026-06-19T10:00:00.000Z',
    category: 'Exame Nacional',
    cover_image_url: '/images/blog/nota-secundario-cover.png',
    cover_image_alt: 'Que nota precisas de tirar nos Exames Nacionais do Secundário',
    read_time: '3 min',
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
