// Mock data para Spotters CXJ

export const siteConfig = {
  name: "Spotters CXJ",
  tagline: "Registrando a aviação em Caxias do Sul",
  logoMain: "https://customer-assets.emergentagent.com/job_e962b36b-c540-44a9-aaec-65346f6fe250/artifacts/j82ijto8_LOGO%20SPOTTERCXJ.jpg",
  logoSecondary: "https://customer-assets.emergentagent.com/job_e962b36b-c540-44a9-aaec-65346f6fe250/artifacts/y59qvget_LOGO%20SPOTTERCXJ%20II.jpg",
  instagram: "@spotterscxj",
  youtube: "https://youtube.com/@spotterscxj",
  instagramUrl: "https://instagram.com/spotterscxj",
};

export const homeContent = {
  title: "Bem-vindo ao Spotters CXJ",
  subtitle: "A comunidade de entusiastas da aviação em Caxias do Sul",
  description: `O Spotters CXJ é um grupo apaixonado por aviação que se dedica a registrar e documentar 
  as operações aéreas no Aeroporto Hugo Cantergiani (CXJ) em Caxias do Sul, Rio Grande do Sul.
  
  Nossa missão é preservar a memória da aviação regional, compartilhar conhecimento sobre aeronaves 
  e promover o hobby do aircraft spotting na Serra Gaúcha.`,
  objectives: [
    "Documentar as operações aéreas no Aeroporto CXJ",
    "Preservar a história da aviação em Caxias do Sul",
    "Unir entusiastas da aviação da região",
    "Compartilhar fotografias e conhecimentos sobre aeronaves",
    "Promover o spotting como hobby saudável e educativo"
  ]
};

export const airportHistory = {
  title: "História do Aeroporto CXJ",
  subtitle: "Aeroporto Hugo Cantergiani - O portal aéreo da Serra Gaúcha",
  content: `O Aeroporto Hugo Cantergiani, conhecido pelo código IATA CXJ, é o principal aeroporto 
  de Caxias do Sul e da região da Serra Gaúcha. Localizado a aproximadamente 5 km do centro 
  da cidade, o aeroporto desempenha papel fundamental no desenvolvimento econômico da região.
  
  Inaugurado na década de 1940, o aeroporto passou por diversas modernizações ao longo dos anos, 
  ampliando sua capacidade e infraestrutura para atender à crescente demanda de passageiros e cargas.`,
  timeline: [
    { year: "1940s", event: "Início das operações aeroportuárias em Caxias do Sul" },
    { year: "1970s", event: "Primeiras grandes reformas e ampliação da pista" },
    { year: "1990s", event: "Modernização do terminal de passageiros" },
    { year: "2000s", event: "Início dos voos comerciais regulares" },
    { year: "2010s", event: "Novas ampliações e melhorias na infraestrutura" },
    { year: "2020s", event: "Consolidação como importante hub regional" }
  ],
  specs: {
    icao: "SBCX",
    iata: "CXJ",
    elevation: "2.472 pés (754 m)",
    runway: "1.950 m x 45 m",
    location: "Caxias do Sul, RS - Brasil"
  }
};

export const spottersHistory = {
  title: "História dos Spotters CXJ",
  subtitle: "Nossa jornada no mundo da aviação",
  content: `O grupo Spotters CXJ nasceu da paixão compartilhada por um pequeno grupo de amigos 
  que frequentavam o Aeroporto Hugo Cantergiani para fotografar aeronaves. O que começou como 
  encontros informais se transformou em uma comunidade organizada e reconhecida.
  
  Ao longo dos anos, o grupo cresceu e se tornou referência no spotting da região Sul do Brasil, 
  participando de eventos, day spotters oficiais e colaborando com a divulgação da aviação regional.`,
  milestones: [
    { year: "2015", title: "Fundação", description: "Primeiro encontro oficial dos fundadores" },
    { year: "2016", title: "Redes Sociais", description: "Criação das páginas no Instagram e YouTube" },
    { year: "2017", title: "Primeiro Day Spotter", description: "Evento oficial no aeroporto CXJ" },
    { year: "2018", title: "Reconhecimento", description: "Parceria com a administração do aeroporto" },
    { year: "2020", title: "Expansão Digital", description: "Crescimento nas redes durante a pandemia" },
    { year: "2023", title: "Comunidade Consolidada", description: "Mais de 50 membros ativos" }
  ]
};

export const memories = [
  {
    id: "1",
    title: "Primeiro Day Spotter Oficial",
    date: "2017-05-15",
    description: "O dia em que realizamos nosso primeiro evento oficial no aeroporto, com acesso especial à área de manobras.",
    highlight: true
  },
  {
    id: "2",
    title: "Visita do Hércules C-130",
    date: "2018-09-07",
    description: "Registro histórico da passagem do Hércules C-130 da FAB pelo CXJ durante celebrações do 7 de Setembro.",
    highlight: true
  },
  {
    id: "3",
    title: "Encontro Regional de Spotters",
    date: "2019-03-22",
    description: "Reunimos spotters de todo o Rio Grande do Sul para um encontro memorável.",
    highlight: false
  },
  {
    id: "4",
    title: "Último voo do ATR 72",
    date: "2021-12-10",
    description: "Documentamos a despedida do ATR 72 das operações regulares em Caxias do Sul.",
    highlight: true
  },
  {
    id: "5",
    title: "Aniversário de 5 Anos",
    date: "2020-06-01",
    description: "Celebração dos 5 anos do grupo com encontro especial dos membros fundadores.",
    highlight: false
  }
];

export const galleryPhotos = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800",
    description: "Boeing 737-800 em aproximação final na pista 18",
    aircraft: "Boeing 737-800",
    registration: "PR-GXJ",
    airline: "GOL Linhas Aéreas",
    date: "2024-03-15",
    author: "João Silva",
    approved: true
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800",
    description: "ATR 72-600 taxiando após pouso matinal",
    aircraft: "ATR 72-600",
    registration: "PR-AQR",
    airline: "Azul Linhas Aéreas",
    date: "2024-02-20",
    author: "Maria Santos",
    approved: true
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1559268950-2d7ceb2efa3a?w=800",
    description: "Embraer 195 decolando com as montanhas ao fundo",
    aircraft: "Embraer 195",
    registration: "PR-AYT",
    airline: "Azul Linhas Aéreas",
    date: "2024-01-10",
    author: "Pedro Oliveira",
    approved: true
  },
  {
    id: "4",
    url: "https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800",
    description: "Pôr do sol espetacular no aeroporto CXJ",
    aircraft: "Paisagem",
    registration: "-",
    airline: "-",
    date: "2024-04-05",
    author: "Ana Costa",
    approved: true
  },
  {
    id: "5",
    url: "https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=800",
    description: "Cessna 172 em voo de instrução sobre Caxias do Sul",
    aircraft: "Cessna 172",
    registration: "PT-KQW",
    airline: "Aeroclube de Caxias",
    date: "2024-03-28",
    author: "Lucas Ferreira",
    approved: true
  },
  {
    id: "6",
    url: "https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=800",
    description: "Helicóptero do SAMU em operação de resgate",
    aircraft: "Eurocopter EC135",
    registration: "PR-SMG",
    airline: "SAMU",
    date: "2024-02-14",
    author: "Roberto Lima",
    approved: true
  }
];

export const groupInfo = {
  about: `O Spotters CXJ é uma comunidade de entusiastas da aviação baseada em Caxias do Sul, RS. 
  Somos apaixonados por aeronaves e dedicamos nosso tempo livre a fotografar, documentar e 
  compartilhar o fascinante mundo da aviação.
  
  Nossa comunidade é aberta a todos que compartilham essa paixão, desde iniciantes até 
  fotógrafos experientes. Realizamos encontros regulares, day spotters e eventos especiais 
  ao longo do ano.`,
  leaders: [
    {
      id: "1",
      name: "Nome do Líder 1",
      role: "Fundador & Coordenador",
      photo: null,
      bio: "Spotter desde 2010, apaixonado por aviação comercial."
    },
    {
      id: "2",
      name: "Nome do Líder 2",
      role: "Coordenador de Eventos",
      photo: null,
      bio: "Responsável pela organização dos day spotters e encontros."
    },
    {
      id: "3",
      name: "Nome do Líder 3",
      role: "Social Media",
      photo: null,
      bio: "Gerencia as redes sociais e conteúdo digital do grupo."
    }
  ],
  contacts: {
    instagram: "@spotterscxj",
    instagramUrl: "https://instagram.com/spotterscxj",
    youtube: "Spotters CXJ",
    youtubeUrl: "https://youtube.com/@spotterscxj",
    email: "contato@spotterscxj.com.br"
  },
  stats: {
    members: "50+",
    photos: "5.000+",
    events: "30+",
    years: "8+"
  }
};

export const mockUsers = [
  { id: "1", name: "Admin", email: "admin@spotterscxj.com", role: "admin", approved: true },
  { id: "2", name: "João Silva", email: "joao@email.com", role: "contributor", approved: true },
  { id: "3", name: "Maria Santos", email: "maria@email.com", role: "contributor", approved: false }
];
