/**
 * A matéria de Matemática do 7.º ao 12.º ano, organizada por ano e por tema,
 * com os vídeos do canal de YouTube que já a cobrem.
 *
 * É a fonte única das páginas /matematica, /matematica/[ano] e
 * /matematica/[ano]/[tema]. Um tema sem vídeos aparece no índice do ano como
 * "em breve" mas não tem página própria, para não haver páginas vazias.
 *
 * Para acrescentar um vídeo: mete-o no tema certo, pela ordem em que deve ser
 * visto. O `id` é o da URL do YouTube (watch?v=ID).
 */

export type Video = {
  /** ID do vídeo no YouTube. */
  id: string;
  titulo: string;
  /** Uma ou duas frases, o que se aprende no vídeo. */
  descricao: string;
  /** Ideias-chave, para quem lê antes de ver. */
  pontos?: string[];
};

export type Tema = {
  slug: string;
  nome: string;
  /** Frase curta para o índice do ano. */
  resumo: string;
  /** Um parágrafo para o topo da página do tema. */
  descricao: string;
  videos: Video[];
};

export type Ano = {
  slug: string;
  /** "7.º ano", "Matemática A · 10.º ano" */
  nome: string;
  numero: number;
  /** Frase curta para a lista de anos. */
  resumo: string;
  /** Parágrafo para o topo da página do ano. */
  descricao: string;
  temas: Tema[];
};

export const ANOS: Ano[] = [
  {
    slug: '7-ano',
    nome: '7.º ano',
    numero: 7,
    resumo: 'Números inteiros, equações, funções e a primeira geometria a sério.',
    descricao:
      'O 7.º ano é o ano em que a Matemática muda de regras: aparecem os números negativos, as letras nas equações e as primeiras funções. Aqui tens a matéria toda por tema, pela ordem em que costuma ser dada na escola.',
    temas: [
      {
        slug: 'numeros-inteiros',
        nome: 'Números inteiros',
        resumo: 'Negativos, reta numérica, simétrico, valor absoluto e operações.',
        descricao:
          'Os números inteiros são os naturais, o zero e os números negativos. É o primeiro tema do 7.º ano e o que mais condiciona o resto: as regras dos sinais que se aprendem aqui voltam nas expressões, nas equações e nas funções o ano inteiro.',
        videos: [
          {
            id: 'Q-5N7pm6deY',
            titulo: 'Números inteiros: o que são, reta numérica, simétrico e valor absoluto',
            descricao:
              'O que são os números inteiros, onde já usas números negativos sem dar por isso, como os representar na reta numérica, o simétrico e o valor absoluto, e a regra para comparar inteiros sem te enganares.',
            pontos: [
              'ℤ é o conjunto dos naturais, do zero e dos negativos',
              'Simétrico é o espelho no zero; valor absoluto é a distância ao zero',
              'Quanto mais à esquerda na reta, mais pequeno é o número: −5 < −2',
            ],
          },
        ],
      },
      { slug: 'numeros-racionais', nome: 'Números racionais', resumo: 'Frações, dízimas, percentagens e notação científica.', descricao: '', videos: [] },
      { slug: 'sequencias', nome: 'Sequências e regularidades', resumo: 'Descobrir a regra e escrever o termo geral.', descricao: '', videos: [] },
      { slug: 'equacoes', nome: 'Equações do 1.º grau', resumo: 'Resolver equações e usá-las em problemas.', descricao: '', videos: [] },
      { slug: 'funcoes', nome: 'Funções', resumo: 'O que é uma função e a proporcionalidade direta.', descricao: '', videos: [] },
      { slug: 'estatistica-e-probabilidades', nome: 'Dados e probabilidades', resumo: 'População e amostra, tabelas, mediana e amplitude.', descricao: '', videos: [] },
      { slug: 'figuras-planas-e-solidos', nome: 'Figuras planas e sólidos', resumo: 'Quadriláteros, áreas, poliedros e a relação de Euler.', descricao: '', videos: [] },
      { slug: 'semelhanca', nome: 'Semelhança de figuras', resumo: 'Figuras semelhantes e critérios de semelhança de triângulos.', descricao: '', videos: [] },
    ],
  },
  {
    slug: '8-ano',
    nome: '8.º ano',
    numero: 8,
    resumo: 'Potências, Pitágoras, sistemas de equações e a função afim.',
    descricao:
      'No 8.º ano um só tema, os números racionais com as potências, ocupa mais de um quarto do ano. Depois vêm os polinómios, os sistemas de equações, a função afim e o teorema de Pitágoras. Tudo por tema, pela ordem da escola.',
    temas: [
      {
        slug: 'numeros-racionais',
        nome: 'Números racionais',
        resumo: 'Dízimas, potências, raízes e notação científica.',
        descricao:
          'Os números racionais são todos os que se escrevem como fração de inteiros. O tema começa pelas dízimas finitas e periódicas e continua para as potências, as raízes quadradas e cúbicas e a notação científica. É o maior tema do 8.º ano.',
        videos: [
          {
            id: 'x16RBvOoAis',
            titulo: 'Números racionais: o que são, dízimas finitas e infinitas periódicas',
            descricao:
              'O que é um número racional, os tipos de dízimas, como descobrir o período fazendo a divisão, e o truque para saber se uma fração dá uma dízima finita ou periódica sem dividir.',
            pontos: [
              'Racional é qualquer a/b com a e b inteiros; os inteiros também são racionais',
              'Toda a fração dá uma dízima finita ou infinita periódica',
              'Fração irredutível com denominador só de 2 e 5: dízima finita; outro primo: periódica',
            ],
          },
        ],
      },
      { slug: 'polinomios-e-equacoes', nome: 'Polinómios e equações', resumo: 'Operações com polinómios, equações com frações e equações literais.', descricao: '', videos: [] },
      { slug: 'sistemas-de-equacoes', nome: 'Sistemas de equações', resumo: 'Duas equações, duas incógnitas: substituição e interpretação gráfica.', descricao: '', videos: [] },
      { slug: 'funcao-afim', nome: 'Função afim', resumo: 'y = ax + b: o declive, a ordenada na origem e o gráfico.', descricao: '', videos: [] },
      { slug: 'estatistica-e-probabilidades', nome: 'Dados e probabilidades', resumo: 'Quartis, diagrama de extremos e quartis, probabilidade.', descricao: '', videos: [] },
      { slug: 'teorema-de-pitagoras', nome: 'Teorema de Pitágoras', resumo: 'A fórmula mais famosa da Matemática e como a aplicar.', descricao: '', videos: [] },
      { slug: 'vetores-e-isometrias', nome: 'Vetores e isometrias', resumo: 'Translações, reflexões e simetrias.', descricao: '', videos: [] },
      { slug: 'areas-e-volumes', nome: 'Áreas e volumes', resumo: 'Prismas, pirâmides, cilindros, cones e esferas.', descricao: '', videos: [] },
    ],
  },
  {
    slug: '9-ano',
    nome: '9.º ano',
    numero: 9,
    resumo: 'O ano da prova final: números reais, equações do 2.º grau, trigonometria e probabilidades.',
    descricao:
      'O 9.º ano é diferente dos outros por uma razão: em junho há prova final, e ela avalia também o que devias saber do 7.º e do 8.º. Aqui tens a matéria do ano por tema, mais a resolução da prova.',
    temas: [
      {
        slug: 'numeros-reais',
        nome: 'Números reais e inequações',
        resumo: 'Racionais e irracionais, intervalos, reta real e inequações.',
        descricao:
          'Os números reais são todos os pontos da reta: os racionais, que já conhecias, e os irracionais, como √2 e π. O tema continua com os intervalos de números reais e as inequações do 1.º grau, e sai na prova final quase todos os anos.',
        videos: [
          {
            id: 'XeFm1Mn7WSk',
            titulo: 'Números reais: conjuntos de números, irracionais e dízimas',
            descricao:
              'Os conjuntos ℕ, ℤ, ℚ e ℝ, os tipos de dízimas, o que são os números irracionais e como descobrir a que conjuntos pertence cada número, incluindo as armadilhas: √9 é um natural e −8/2 é um inteiro.',
            pontos: [
              'ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ',
              'Irracional é uma dízima infinita não periódica: √2, π, 0,1010010001…',
              'Simplifica primeiro, classifica depois: √9 = 3, −8/2 = −4',
            ],
          },
        ],
      },
      { slug: 'equacoes-do-2-grau', nome: 'Equações do 2.º grau', resumo: 'Equações incompletas, fórmula resolvente e problemas.', descricao: '', videos: [] },
      { slug: 'funcoes', nome: 'Funções', resumo: 'Proporcionalidade inversa e a função quadrática y = ax².', descricao: '', videos: [] },
      { slug: 'trigonometria', nome: 'Trigonometria', resumo: 'Seno, cosseno e tangente no triângulo retângulo.', descricao: '', videos: [] },
      { slug: 'circunferencia-e-lugares-geometricos', nome: 'Circunferência e lugares geométricos', resumo: 'Ângulos ao centro e inscritos, polígonos inscritos, mediatriz e bissetriz.', descricao: '', videos: [] },
      { slug: 'probabilidades', nome: 'Probabilidades', resumo: 'Regra de Laplace, diagramas de árvore e experiências compostas.', descricao: '', videos: [] },
      { slug: 'estatistica', nome: 'Estatística', resumo: 'Histogramas e diagramas de extremos e quartis paralelos.', descricao: '', videos: [] },
      {
        slug: 'prova-final',
        nome: 'Prova final do 9.º ano',
        resumo: 'A prova de 2026 resolvida questão a questão.',
        descricao:
          'A prova final de Matemática do 9.º ano avalia a matéria dos três anos do 3.º ciclo. Aqui tens a prova de 2026 resolvida do princípio ao fim, e a prova de ensaio que a antecedeu, para veres como se responde a cada tipo de questão.',
        videos: [
          {
            id: 'UqBaYSoR3RE',
            titulo: 'Prova final de Matemática do 9.º ano 2026: resolução completa',
            descricao:
              'Todas as questões da prova de 2026 resolvidas e explicadas: áreas e volumes, sequências, notação científica, funções, intervalos, equações do 2.º grau, semelhança, Pitágoras, probabilidades e estatística.',
          },
          {
            id: 'YyZxEvlN7qs',
            titulo: 'Prova de ensaio de Matemática do 9.º ano 2026: resolução completa',
            descricao: 'A prova de ensaio resolvida questão a questão, para treinar antes da prova final.',
          },
        ],
      },
    ],
  },
  {
    slug: '10-ano',
    nome: 'Matemática A · 10.º ano',
    numero: 10,
    resumo: 'Modelos matemáticos, funções, geometria analítica e estatística.',
    descricao:
      'O 10.º ano de Matemática A começa por um tema novo, os modelos matemáticos para a cidadania (eleições, partilha e finanças), e segue para as funções, a geometria analítica no plano e no espaço, e a estatística. Também é o ano em que se aprende a usar a calculadora gráfica.',
    temas: [
      {
        slug: 'modelos-matematicos',
        nome: 'Modelos matemáticos para a cidadania',
        resumo: 'Eleições, partilha de mandatos e finanças pessoais.',
        descricao:
          'É o primeiro tema do 10.º ano e é matemática do mundo real: como se decide quem ganha uma eleição, como se distribuem os deputados pelos partidos, e como se calcula um salário líquido ou os juros de uma poupança. Três vídeos, um por subtema.',
        videos: [
          {
            id: 'WnuQ3K0zKH4',
            titulo: 'Eleições: maioria simples, maioria absoluta e método de Borda',
            descricao:
              'Os tipos de votos e as fórmulas das percentagens, a maioria simples, a maioria absoluta com segunda volta (como nas presidenciais) e o método de Borda a partir de uma tabela de preferências.',
            pontos: [
              'Maioria absoluta é mais de metade dos votos, não "o mais votado"',
              'Na segunda volta, os votos de quem saiu passam para a segunda escolha',
              'O vencedor depende do método: a mesma eleição pode ter vencedores diferentes',
            ],
          },
          {
            id: '4svE71jiyWw',
            titulo: 'Partilha: método de Hondt e método de Sainte-Laguë',
            descricao:
              'Como se distribuem os mandatos pelos partidos com o método de Hondt, o que se usa nas legislativas e autárquicas em Portugal, e com o método de Sainte-Laguë, com exemplos resolvidos e as limitações de cada um.',
          },
          {
            id: 'uT6VY-gcKNI',
            titulo: 'Finanças: salários, IRS, poupança e crédito',
            descricao:
              'Salário mensal, anual e por hora, a diferença entre bruto e líquido, a Segurança Social e a retenção de IRS, e a matemática da poupança e do crédito com juros simples e compostos.',
          },
        ],
      },
      { slug: 'funcoes', nome: 'Funções', resumo: 'Estudo de uma função, função afim, quadrática e definida por ramos.', descricao: '', videos: [] },
      { slug: 'geometria-analitica', nome: 'Geometria analítica', resumo: 'Distâncias, mediatriz, circunferência, vetores e retas no plano e no espaço.', descricao: '', videos: [] },
      { slug: 'geometria-sintetica', nome: 'Geometria sintética', resumo: 'Pontos notáveis do triângulo e reta de Euler.', descricao: '', videos: [] },
      { slug: 'estatistica', nome: 'Estatística', resumo: 'Dados univariados e bivariados, medidas de localização e dispersão.', descricao: '', videos: [] },
      {
        slug: 'calculadora-grafica',
        nome: 'Calculadora gráfica',
        resumo: 'Introdução à Casio fx-CG50, à TI-Nspire CX II-T e à NumWorks.',
        descricao:
          'A calculadora gráfica é obrigatória a partir do 10.º ano e vale pontos no exame. Estes vídeos são a introdução a cada modelo: os menus, as teclas que tramam toda a gente na primeira semana, um tour do que a máquina faz e o modo de exame. Vê o da tua calculadora.',
        videos: [
          {
            id: '63UXDLa3aYU',
            titulo: 'Calculadora gráfica Casio fx-CG50: introdução para o 10.º ano',
            descricao: 'Ligar, menus, as cinco teclas que confundem toda a gente, o que a máquina faz e o modo de exame, na Casio fx-CG50.',
          },
          {
            id: 'dyNURV3SVxE',
            titulo: 'Calculadora gráfica TI-Nspire CX II-T: introdução para o 10.º ano',
            descricao: 'O mesmo guia de início, na TI-Nspire CX II-T.',
          },
          {
            id: 'O0gcsVnXeCs',
            titulo: 'Calculadora gráfica NumWorks: introdução para o 10.º ano',
            descricao: 'O mesmo guia de início, na NumWorks.',
          },
        ],
      },
    ],
  },
  {
    slug: '11-ano',
    nome: 'Matemática A · 11.º ano',
    numero: 11,
    resumo: 'Trigonometria, produto escalar, contagem, sucessões, funções e derivadas.',
    descricao:
      'O 11.º ano de Matemática A abre com a trigonometria e o círculo trigonométrico, passa pelo produto escalar, pela contagem e pelas sucessões, e termina nas funções polinomiais e racionais e no início do cálculo diferencial. Aqui tens tudo por tema.',
    temas: [
      {
        slug: 'trigonometria',
        nome: 'Trigonometria',
        resumo: 'Razões trigonométricas, problemas com triângulos, círculo trigonométrico e funções trigonométricas.',
        descricao:
          'A trigonometria do 11.º ano começa onde o 9.º acabou, com o seno, o cosseno e a tangente no triângulo retângulo, e depois estende-os a qualquer ângulo com o círculo trigonométrico. Os primeiros vídeos são a revisão e os problemas com triângulos; os seguintes vão para o círculo, as fórmulas de redução e as equações trigonométricas.',
        videos: [
          {
            id: 'o7T5Y8TOjC0',
            titulo: 'Razões trigonométricas: seno, cosseno, tangente e valores exatos',
            descricao:
              'Revisão do SOH CAH TOA, os valores exatos de 30°, 45° e 60° com o truque para os decorar, e um problema resolvido num triângulo retângulo.',
            pontos: [
              'sen = oposto/hipotenusa, cos = adjacente/hipotenusa, tan = oposto/adjacente',
              'Valores exatos do seno: √1/2, √2/2, √3/2; o cosseno é a mesma linha ao contrário',
              'Marca o ângulo, identifica os lados, escolhe a razão',
            ],
          },
          {
            id: 'apz3wgPylAc',
            titulo: 'Problema de trigonometria sem ângulo reto',
            descricao:
              'Um triângulo com um ângulo de 110°: sem ângulo reto não há razões trigonométricas, por isso desenha-se a altura e criam-se dois triângulos retângulos. Resolvido passo a passo, com exercícios no fim.',
            pontos: ['Sem ângulo reto, desenha a altura', 'A altura cria dois triângulos retângulos que se resolvem um a seguir ao outro'],
          },
          {
            id: 'iMtMnI8b5f8',
            titulo: 'O problema dos dois triângulos, resolvido passo a passo',
            descricao:
              'O problema mais característico do 11.º ano: dois triângulos retângulos com um lado comum. Escreve-se a tangente em cada um, igualam-se as duas expressões da altura e resolve-se em ordem a x.',
            pontos: ['h = x·tan α e h = (d + x)·tan β', 'Iguala as duas expressões e resolve em ordem a x', 'Guarda os valores exatos na calculadora até ao fim'],
          },
          {
            id: 'x-QzgeFi4DM',
            titulo: 'Trigonometria do 11.º ano: explicação completa',
            descricao: 'A trigonometria do 11.º ano de uma ponta à outra, num só vídeo, para rever antes do teste ou do exame.',
          },
        ],
      },
      { slug: 'produto-escalar', nome: 'Geometria analítica e produto escalar', resumo: 'Declive e inclinação, produto escalar, equações de retas e planos.', descricao: '', videos: [] },
      {
        slug: 'contagem',
        nome: 'Contagem',
        resumo: 'Princípios gerais de contagem, arranjos, permutações e combinações.',
        descricao:
          'A contagem responde à pergunta "de quantas maneiras?": quantos códigos, quantas filas, quantas equipas. Os princípios gerais, os arranjos, as permutações e as combinações, e sobretudo como saber qual usar em cada problema.',
        videos: [
          {
            id: 'wqgt1zxxbVM',
            titulo: 'Contagem do 11.º ano: explicação completa',
            descricao: 'Toda a contagem do 11.º ano num só vídeo: princípio fundamental da contagem, arranjos, permutações e combinações, com exemplos resolvidos.',
          },
        ],
      },
      {
        slug: 'sucessoes',
        nome: 'Sucessões',
        resumo: 'Termo geral, monotonia, recorrência, progressões aritméticas e geométricas.',
        descricao:
          'Uma sucessão é uma lista infinita de números com uma regra. O tema passa pelo termo geral, pela monotonia, pelas sucessões definidas por recorrência e pelas duas famílias que caem sempre nos testes: as progressões aritméticas e as geométricas.',
        videos: [
          {
            id: 'hqGnL7qiHZY',
            titulo: 'Sucessões do 11.º ano: explicação completa',
            descricao: 'Termo geral, monotonia, sucessões definidas por recorrência, progressões aritméticas e progressões geométricas, tudo num só vídeo.',
            pontos: [
              'Termo geral: a fórmula que dá qualquer termo a partir de n',
              'Progressão aritmética: soma-se sempre o mesmo; geométrica: multiplica-se sempre pelo mesmo',
            ],
          },
        ],
      },
      {
        slug: 'funcoes-polinomiais-e-racionais',
        nome: 'Funções polinomiais e racionais',
        resumo: 'Polinómios, regra de Ruffini, funções cúbicas e quárticas, funções racionais.',
        descricao:
          'As funções polinomiais de grau 3 e 4, a divisão de polinómios e a regra de Ruffini, e as funções racionais com as suas assíntotas. É o tema que liga a álgebra ao estudo de funções e prepara o cálculo diferencial.',
        videos: [
          {
            id: 'BHRAhoVc7rg',
            titulo: 'Funções polinomiais e racionais do 11.º ano: explicação completa',
            descricao: 'Polinómios e regra de Ruffini, funções cúbicas e quárticas, e funções racionais, num só vídeo.',
          },
        ],
      },
      { slug: 'calculo-diferencial', nome: 'Cálculo diferencial', resumo: 'Taxa de variação média, derivada num ponto e função derivada.', descricao: '', videos: [] },
    ],
  },
  {
    slug: '12-ano',
    nome: 'Matemática A · 12.º ano',
    numero: 12,
    resumo: 'Números complexos, probabilidades, exponenciais, logaritmos, limites e derivadas.',
    descricao:
      'O 12.º ano de Matemática A é o ano do exame nacional, que avalia os três anos do secundário. A matéria nova são os números complexos, as probabilidades e as funções exponenciais e logarítmicas com limites e derivadas. Aqui tens tudo por tema, mais a resolução do exame.',
    temas: [
      {
        slug: 'numeros-complexos',
        nome: 'Números complexos',
        resumo: 'Forma algébrica, forma trigonométrica, De Moivre, raízes e equações.',
        descricao:
          'Os números complexos nascem de uma pergunta: x² + 1 = 0 tem solução? Com a unidade imaginária i passa a ter. O tema vai da forma algébrica e do plano complexo à forma trigonométrica, às potências e raízes com a fórmula de De Moivre, e às equações em ℂ. Quatro vídeos, pela ordem em que a matéria é dada.',
        videos: [
          {
            id: 'h6hpz2Rpk0A',
            titulo: 'Unidade imaginária i, forma algébrica e plano complexo',
            descricao:
              'O que é i, as potências de i, a forma algébrica z = a + bi, o plano complexo, e as operações na forma algébrica: soma, subtração, multiplicação, conjugado e divisão.',
            pontos: ['i² = −1, e as potências de i repetem-se de 4 em 4', 'Im(3 + 2i) = 2, não 2i', 'Dividir é multiplicar pelo conjugado do denominador'],
          },
          {
            id: 'jXZdlP1N0q4',
            titulo: 'Módulo, argumento e forma trigonométrica',
            descricao:
              'O módulo e o argumento de um número complexo, a forma trigonométrica z = ρ(cos θ + i sen θ), e como passar de uma forma à outra sem te enganares no quadrante.',
            pontos: ['|z| = √(a² + b²)', 'tan θ = b/a, mas o quadrante decide o argumento', 'Faz sempre um esboço no plano complexo antes de escolher θ'],
          },
          {
            id: 'Sm6K6H27a-M',
            titulo: 'Operações na forma trigonométrica e fórmula de De Moivre',
            descricao:
              'Multiplicar e dividir na forma trigonométrica (os módulos multiplicam-se, os argumentos somam-se) e as potências com a fórmula de De Moivre.',
            pontos: ['Somar e subtrair: forma algébrica. Multiplicar, dividir e potências: forma trigonométrica', '(ρ e^{iθ})ⁿ = ρⁿ e^{inθ}'],
          },
          {
            id: 'tGTaOij4M-I',
            titulo: 'Raízes de índice n e equações zⁿ = w',
            descricao:
              'As n raízes de índice n de um número complexo, onde ficam no plano (num polígono regular) e como resolver equações do tipo zⁿ = w.',
            pontos: ['Um complexo tem exatamente n raízes de índice n', 'As raízes ficam nos vértices de um polígono regular de n lados'],
          },
        ],
      },
      { slug: 'probabilidades', nome: 'Probabilidades', resumo: 'Conjuntos, probabilidade condicionada e combinatória.', descricao: '', videos: [] },
      { slug: 'exponenciais-e-logaritmos', nome: 'Funções exponenciais e logarítmicas', resumo: 'Propriedades, equações e inequações.', descricao: '', videos: [] },
      { slug: 'limites-e-derivadas', nome: 'Limites e derivadas', resumo: 'Limites, continuidade, regras de derivação e estudo de funções.', descricao: '', videos: [] },
      {
        slug: 'exame-nacional',
        nome: 'Exame nacional de Matemática A',
        resumo: 'O exame de 2026 resolvido do princípio ao fim.',
        descricao:
          'O exame nacional de Matemática A avalia a matéria do 10.º, 11.º e 12.º ano. Aqui tens o exame de 2026 resolvido questão a questão, com a explicação de cada resposta.',
        videos: [
          {
            id: 'LLAqgLynzko',
            titulo: 'Exame nacional de Matemática A 2026: resolução completa',
            descricao: 'Todas as questões do exame de 2026 resolvidas e explicadas.',
          },
        ],
      },
    ],
  },
];

// ─── Acesso ──────────────────────────────────────────────────────────────────

export function getAno(slug: string) {
  return ANOS.find((a) => a.slug === slug);
}

export function getTema(anoSlug: string, temaSlug: string) {
  const ano = getAno(anoSlug);
  const tema = ano?.temas.find((t) => t.slug === temaSlug);
  return ano && tema ? { ano, tema } : undefined;
}

/** Só os temas que já têm vídeos têm página própria. */
export function temasComVideos(ano: Ano) {
  return ano.temas.filter((t) => t.videos.length > 0);
}

export function contarVideos(ano: Ano) {
  return ano.temas.reduce((n, t) => n + t.videos.length, 0);
}

export const TOTAL_VIDEOS = ANOS.reduce((n, a) => n + contarVideos(a), 0);

export function thumbnailYoutube(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function urlYoutube(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}
