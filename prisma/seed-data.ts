import {
  CampaignStatus,
  FoundationDocumentType,
  FoundationStatus,
  NeedPriority,
  SocialNetworkType,
} from '@prisma/client';

export interface SeedAdminUser {
  email: string;
  fullName: string;
  phone?: string;
  city?: string;
  department?: string;
  bio?: string;
  /** Dias respecto a hoy (negativo = pasado). */
  registeredOffsetDays?: number;
}

export interface SeedDonorUser {
  email: string;
  fullName: string;
  phone: string;
  city: string;
  department: string;
  bio: string;
  /** Dias respecto a hoy (negativo = pasado). */
  registeredOffsetDays?: number;
}

export interface SeedCampaignInput {
  title: string;
  description: string;
  imageUrl: string;
  status: CampaignStatus;
  startOffsetDays: number;
  endOffsetDays: number;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  /** Dias respecto a hoy para created_at de la campana (negativo = pasado). */
  createdOffsetDays?: number;
  needs: Array<{
    name: string;
    description: string;
    quantity: number;
    unit: string;
    priority: NeedPriority;
    fulfilledQuantity: number;
  }>;
}

export interface SeedFoundationInput {
  accountEmail: string;
  accountFullName: string;
  accountPhone: string;
  name: string;
  acronym: string;
  nit: string;
  slug: string;
  category: string;
  mission: string;
  vision: string;
  description: string;
  city: string;
  department: string;
  country: string;
  address: string;
  latitude: number;
  longitude: number;
  institutionalEmail: string;
  phone: string;
  website: string;
  legalRepresentativeName: string;
  legalRepresentativeDocument: string;
  logoUrl: string;
  status: FoundationStatus;
  /** Dias respecto a hoy para alta de la fundacion (negativo = pasado). */
  registeredOffsetDays?: number;
  socialLinks: Array<{ network: SocialNetworkType; url: string }>;
  campaigns: SeedCampaignInput[];
}

export const ADMIN_USERS: SeedAdminUser[] = [
  {
    email: 'apoyo_ud@fesc.edu.co',
    fullName: 'Diego Alexander Rincon Casarubia',
    phone: '3001112233',
    city: 'Cucuta',
    department: 'Norte de Santander',
    bio: 'Administrador de la plataforma Ayudandonos — unidad de apoyo FESC.',
    registeredOffsetDays: -175,
  },
  {
    email: 'ericksperezc@gmail.com',
    fullName: 'Erick Sebastian Perez Carvajal',
    phone: '3180938385',
    city: 'Cucuta',
    department: 'Norte de Santander',
    bio: 'Administrador tecnico de Ayudandonos.',
    registeredOffsetDays: -170,
  },
  {
    email: 'tecnico_ud@fesc.edu.co',
    fullName: 'Erick Sebastian Perez Carvajal',
    phone: '3180938385',
    city: 'Cucuta',
    department: 'Norte de Santander',
    bio: 'Cuenta tecnica institucional FESC para administracion de Ayudandonos.',
    registeredOffsetDays: -168,
  },
];

export const DEMO_USERS_DEFAULT_PASSWORD = 'AyudaDemo2026!';

export const DONOR_USERS: SeedDonorUser[] = [
  {
    email: 'maria.gomez.donante@gmail.com',
    fullName: 'Maria Camila Gomez Ruiz',
    phone: '3105550101',
    city: 'Bogota',
    department: 'Cundinamarca',
    bio: 'Donante recurrente de viveres y kits escolares en Bogota.',
    registeredOffsetDays: -158,
  },
  {
    email: 'andres.lopez.ayuda@gmail.com',
    fullName: 'Andres Felipe Lopez Mejia',
    phone: '3115550202',
    city: 'Medellin',
    department: 'Antioquia',
    bio: 'Voluntario y donante de ropa y elementos de aseo.',
    registeredOffsetDays: -142,
  },
  {
    email: 'laura.martinez.solidaria@outlook.com',
    fullName: 'Laura Patricia Martinez Soto',
    phone: '3125550303',
    city: 'Cali',
    department: 'Valle del Cauca',
    bio: 'Apoyo campañas de nutricion infantil en el Valle.',
    registeredOffsetDays: -128,
  },
  {
    email: 'juan.castro.donaciones@gmail.com',
    fullName: 'Juan David Castro Pena',
    phone: '3135550404',
    city: 'Bucaramanga',
    department: 'Santander',
    bio: 'Donante de mercados y productos no perecederos.',
    registeredOffsetDays: -112,
  },
  {
    email: 'sofia.ramirez.ayuda@hotmail.com',
    fullName: 'Sofia Andrea Ramirez Quintero',
    phone: '3145550505',
    city: 'Cucuta',
    department: 'Norte de Santander',
    bio: 'Donante local enfocada en primera infancia y educacion.',
    registeredOffsetDays: -96,
  },
  {
    email: 'carlos.hernandez.donor@gmail.com',
    fullName: 'Carlos Eduardo Hernandez Diaz',
    phone: '3155550606',
    city: 'Barrancabermeja',
    department: 'Santander',
    bio: 'Empresario solidario que aporta insumos de higiene.',
    registeredOffsetDays: -78,
  },
  {
    email: 'valentina.rojas.donante@gmail.com',
    fullName: 'Valentina Rojas Aguilar',
    phone: '3165550707',
    city: 'Bogota',
    department: 'Cundinamarca',
    bio: 'Apoya jornadas de recoleccion de utiles escolares.',
    registeredOffsetDays: -52,
  },
  {
    email: 'diego.moreno.solidario@gmail.com',
    fullName: 'Diego Alejandro Moreno Silva',
    phone: '3175550808',
    city: 'Pereira',
    department: 'Risaralda',
    bio: 'Donante de enseres y materiales de construccion liviana.',
    registeredOffsetDays: -24,
  },
];

/** Donantes adicionales para simular crecimiento historico de la plataforma. */
export const HISTORICAL_DONOR_USERS: SeedDonorUser[] = [
  {
    email: 'camila.rios.solidaria@gmail.com',
    fullName: 'Camila Rios Ortiz',
    phone: '3185551001',
    city: 'Manizales',
    department: 'Caldas',
    bio: 'Donante activa desde el lanzamiento de la plataforma.',
    registeredOffsetDays: -165,
  },
  {
    email: 'felipe.garcia.ayuda@gmail.com',
    fullName: 'Felipe Garcia Montoya',
    phone: '3185551002',
    city: 'Ibague',
    department: 'Tolima',
    bio: 'Aporta mercados no perecederos cada trimestre.',
    registeredOffsetDays: -149,
  },
  {
    email: 'isabella.torres.donante@outlook.com',
    fullName: 'Isabella Torres Vargas',
    phone: '3185551003',
    city: 'Cartagena',
    department: 'Bolivar',
    bio: 'Voluntaria en campanas de primera infancia.',
    registeredOffsetDays: -135,
  },
  {
    email: 'santiago.munoz.solidario@gmail.com',
    fullName: 'Santiago Munoz Delgado',
    phone: '3185551004',
    city: 'Neiva',
    department: 'Huila',
    bio: 'Donante de kits de aseo y ropa.',
    registeredOffsetDays: -118,
  },
  {
    email: 'daniela.castro.ayuda@hotmail.com',
    fullName: 'Daniela Castro Mejia',
    phone: '3185551005',
    city: 'Pasto',
    department: 'Narino',
    bio: 'Apoya fundaciones verificadas en el sur del pais.',
    registeredOffsetDays: -101,
  },
  {
    email: 'mateo.salazar.donante@gmail.com',
    fullName: 'Mateo Salazar Henao',
    phone: '3185551006',
    city: 'Armenia',
    department: 'Quindio',
    bio: 'Donante de utiles escolares y mochilas.',
    registeredOffsetDays: -84,
  },
  {
    email: 'juliana.ospina.solidaria@gmail.com',
    fullName: 'Juliana Ospina Ruiz',
    phone: '3185551007',
    city: 'Villavicencio',
    department: 'Meta',
    bio: 'Participa en donaciones de alimentos fortificados.',
    registeredOffsetDays: -67,
  },
  {
    email: 'nicolas.velez.ayuda@gmail.com',
    fullName: 'Nicolas Velez Cardona',
    phone: '3185551008',
    city: 'Monteria',
    department: 'Cordoba',
    bio: 'Donante recurrente en campanas de nutricion.',
    registeredOffsetDays: -45,
  },
  {
    email: 'paula.herrera.donante@outlook.com',
    fullName: 'Paula Herrera Jimenez',
    phone: '3185551009',
    city: 'Santa Marta',
    department: 'Magdalena',
    bio: 'Solidaria con campanas de ayuda humanitaria.',
    registeredOffsetDays: -31,
  },
  {
    email: 'sebastian.angulo.solidario@gmail.com',
    fullName: 'Sebastian Angulo Pardo',
    phone: '3185551010',
    city: 'Popayan',
    department: 'Cauca',
    bio: 'Nuevo donante con aportes en especie locales.',
    registeredOffsetDays: -12,
  },
];

export const FOUNDATION_SEEDS: SeedFoundationInput[] = [
  {
    accountEmail: 'contacto.colombia@unicef-demo.org',
    accountFullName: 'Representante UNICEF Colombia',
    accountPhone: '6013121122',
    name: 'UNICEF Colombia',
    acronym: 'UNICEF',
    nit: '860013814-1',
    slug: 'unicef-colombia',
    category: 'Infancia y adolescencia',
    mission:
      'Proteger los derechos de ninas, ninos y adolescentes en Colombia, priorizando educacion, salud, proteccion y nutricion.',
    vision:
      'Un pais donde cada nina y nino crezca sano, seguro y con oportunidades de aprendizaje.',
    description:
      'Oficina de pais de UNICEF en Colombia. Trabaja con aliados publicos y privados para garantizar derechos de la ninez mediante programas de nutricion, educacion y proteccion.',
    city: 'Bogota',
    department: 'Cundinamarca',
    country: 'Colombia',
    address: 'Carrera 11 No. 93-07, Bogota D.C.',
    latitude: 4.6761,
    longitude: -74.0485,
    institutionalEmail: 'contacto.colombia@unicef-demo.org',
    phone: '6013121122',
    website: 'https://www.unicef.org/colombia',
    legalRepresentativeName: 'Ana Maria Duarte Lopez',
    legalRepresentativeDocument: '52456789',
    logoUrl:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=400&q=80',
    status: FoundationStatus.VERIFIED,
    registeredOffsetDays: -155,
    socialLinks: [
      { network: SocialNetworkType.INSTAGRAM, url: 'https://www.instagram.com/unicefcolombia' },
      { network: SocialNetworkType.FACEBOOK, url: 'https://www.facebook.com/UNICEFColombia' },
      { network: SocialNetworkType.X, url: 'https://x.com/unicefcolombia' },
    ],
    campaigns: [
      {
        title: 'Kits escolares para la primera infancia',
        description:
          'Recoleccion de kits escolares (cuadernos, lapices, colores y mochilas) para ninas y ninos de zonas rurales priorizadas en Cundinamarca y Boyaca.',
        imageUrl:
          'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
        status: CampaignStatus.PUBLISHED,
        startOffsetDays: -20,
        endOffsetDays: 40,
        createdOffsetDays: -45,
        deliveryAddress: 'Bodega UNICEF — Calle 100 No. 19-61, Bogota',
        deliveryLatitude: 4.6855,
        deliveryLongitude: -74.0478,
        needs: [
          {
            name: 'Mochilas escolares',
            description: 'Mochilas resistentes talla escolar',
            quantity: 200,
            unit: 'unidades',
            priority: NeedPriority.HIGH,
            fulfilledQuantity: 45,
          },
          {
            name: 'Kits de utiles',
            description: 'Cuadernos, lapices, colores y regla',
            quantity: 200,
            unit: 'kits',
            priority: NeedPriority.HIGH,
            fulfilledQuantity: 60,
          },
        ],
      },
      {
        title: 'Nutricion infantil — alimentos no perecederos',
        description:
          'Campana de recoleccion de alimentos no perecederos para complementar programas de nutricion en hogares comunitarios.',
        imageUrl:
          'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
        status: CampaignStatus.PUBLISHED,
        startOffsetDays: -10,
        endOffsetDays: 50,
        createdOffsetDays: -28,
        deliveryAddress: 'Centro de acopio UNICEF — Av. El Dorado No. 69-76, Bogota',
        deliveryLatitude: 4.6682,
        deliveryLongitude: -74.1009,
        needs: [
          {
            name: 'Leche en polvo',
            description: 'Latas de leche en polvo infantil',
            quantity: 300,
            unit: 'latas',
            priority: NeedPriority.HIGH,
            fulfilledQuantity: 80,
          },
          {
            name: 'Avena y cereales',
            description: 'Paquetes de avena o cereal seco',
            quantity: 250,
            unit: 'paquetes',
            priority: NeedPriority.MEDIUM,
            fulfilledQuantity: 40,
          },
        ],
      },
      {
        title: 'Agua segura para comunidades rurales',
        description:
          'Campana finalizada de filtros de agua y bidones para familias en zonas rurales de Boyaca y Cundinamarca.',
        imageUrl:
          'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=1200&q=80',
        status: CampaignStatus.FINISHED,
        startOffsetDays: -140,
        endOffsetDays: -75,
        createdOffsetDays: -148,
        deliveryAddress: 'Bodega UNICEF — Calle 100 No. 19-61, Bogota',
        deliveryLatitude: 4.6855,
        deliveryLongitude: -74.0478,
        needs: [
          {
            name: 'Filtros purificadores',
            description: 'Filtros de agua portatiles',
            quantity: 120,
            unit: 'unidades',
            priority: NeedPriority.HIGH,
            fulfilledQuantity: 120,
          },
          {
            name: 'Bidones de almacenamiento',
            description: 'Bidones de 20 litros',
            quantity: 150,
            unit: 'unidades',
            priority: NeedPriority.MEDIUM,
            fulfilledQuantity: 142,
          },
        ],
      },
    ],
  },
  {
    accountEmail: 'donaciones@cruzroja-demo.org',
    accountFullName: 'Voluntariado Cruz Roja Bogota',
    accountPhone: '6014375300',
    name: 'Cruz Roja Colombiana — Seccional Bogota',
    acronym: 'CRC',
    nit: '860007038-5',
    slug: 'cruz-roja-bogota',
    category: 'Ayuda humanitaria',
    mission:
      'Prevenir y aliviar el sufrimiento humano mediante accion humanitaria, salud y gestion del riesgo.',
    vision:
      'Ser referente nacional de respuesta humanitaria oportuna, imparcial y segura.',
    description:
      'Seccional Bogota de la Cruz Roja Colombiana. Atiende emergencias, jornadas de salud y recoleccion de ayudas en especie para comunidades afectadas.',
    city: 'Bogota',
    department: 'Cundinamarca',
    country: 'Colombia',
    address: 'Avenida Carrera 68 No. 66-31, Bogota',
    latitude: 4.6667,
    longitude: -74.0965,
    institutionalEmail: 'donaciones@cruzroja-demo.org',
    phone: '6014375300',
    website: 'https://www.cruzrojacolombiana.org',
    legalRepresentativeName: 'Pedro Antonio Vargas Rios',
    legalRepresentativeDocument: '79321456',
    logoUrl:
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=400&q=80',
    status: FoundationStatus.VERIFIED,
    registeredOffsetDays: -132,
    socialLinks: [
      { network: SocialNetworkType.INSTAGRAM, url: 'https://www.instagram.com/cruzrojacol' },
      { network: SocialNetworkType.FACEBOOK, url: 'https://www.facebook.com/CruzRojaColombiana' },
    ],
    campaigns: [
      {
        title: 'Kit de aseo familiar para emergencia',
        description:
          'Recoleccion de kits de higiene (jabon, shampoo, papel higienico, toallas sanitarias) para familias en albergues temporales.',
        imageUrl:
          'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
        status: CampaignStatus.PUBLISHED,
        startOffsetDays: -5,
        endOffsetDays: 25,
        createdOffsetDays: -38,
        deliveryAddress: 'Bodega Cruz Roja — Av. 68 No. 66-31, Bogota',
        deliveryLatitude: 4.6667,
        deliveryLongitude: -74.0965,
        needs: [
          {
            name: 'Jabon de tocador',
            description: 'Barras de jabon nuevas',
            quantity: 500,
            unit: 'unidades',
            priority: NeedPriority.HIGH,
            fulfilledQuantity: 120,
          },
          {
            name: 'Papel higienico',
            description: 'Rollos de papel higienico',
            quantity: 800,
            unit: 'rollos',
            priority: NeedPriority.MEDIUM,
            fulfilledQuantity: 200,
          },
        ],
      },
      {
        title: 'Respuesta a inundaciones — enseres de cocina',
        description:
          'Campana cerrada de ollas, utensilios y vajilla para familias afectadas por emergencias hidricas.',
        imageUrl:
          'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80',
        status: CampaignStatus.FINISHED,
        startOffsetDays: -120,
        endOffsetDays: -55,
        createdOffsetDays: -126,
        deliveryAddress: 'Bodega Cruz Roja — Av. 68 No. 66-31, Bogota',
        deliveryLatitude: 4.6667,
        deliveryLongitude: -74.0965,
        needs: [
          {
            name: 'Ollas y sartenes',
            description: 'Sets basicos de cocina',
            quantity: 90,
            unit: 'kits',
            priority: NeedPriority.HIGH,
            fulfilledQuantity: 90,
          },
        ],
      },
    ],
  },
  {
    accountEmail: 'aporte@bancoalimentos-demo.org',
    accountFullName: 'Operaciones Banco de Alimentos',
    accountPhone: '6017420100',
    name: 'Banco de Alimentos de Bogota',
    acronym: 'BAB',
    nit: '830053394-7',
    slug: 'banco-alimentos-bogota',
    category: 'Seguridad alimentaria',
    mission:
      'Rescatar y redistribuir alimentos aptos para consumo hacia organizaciones sociales que atienden poblacion vulnerable.',
    vision:
      'Una ciudad sin desperdicio de alimentos y con nutricion digna para quienes mas lo necesitan.',
    description:
      'Organizacion que articula empresas, donantes y fundaciones para recuperar alimentos y entregarlos a comedores comunitarios y hogares de paso.',
    city: 'Bogota',
    department: 'Cundinamarca',
    country: 'Colombia',
    address: 'Calle 22C No. 68A-45, Bogota',
    latitude: 4.6412,
    longitude: -74.1201,
    institutionalEmail: 'aporte@bancoalimentos-demo.org',
    phone: '6017420100',
    website: 'https://www.bancodealimentos.org.co',
    legalRepresentativeName: 'Claudia Patricia Nieto Gomez',
    legalRepresentativeDocument: '51789456',
    logoUrl:
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=400&q=80',
    status: FoundationStatus.VERIFIED,
    registeredOffsetDays: -118,
    socialLinks: [
      {
        network: SocialNetworkType.INSTAGRAM,
        url: 'https://www.instagram.com/bancodealimentosbogota',
      },
      { network: SocialNetworkType.LINKEDIN, url: 'https://www.linkedin.com/company/banco-de-alimentos' },
    ],
    campaigns: [
      {
        title: 'Mercados solidarios — granos y enlatados',
        description:
          'Recoleccion de arroz, lentejas, atun, aceite y azucar para armar mercados familiares de 15 dias.',
        imageUrl:
          'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
        status: CampaignStatus.PUBLISHED,
        startOffsetDays: -15,
        endOffsetDays: 30,
        createdOffsetDays: -72,
        deliveryAddress: 'Centro logistico BAB — Calle 22C No. 68A-45, Bogota',
        deliveryLatitude: 4.6412,
        deliveryLongitude: -74.1201,
        needs: [
          {
            name: 'Arroz',
            description: 'Arroz blanco en presentacion de 1 kg',
            quantity: 1000,
            unit: 'kg',
            priority: NeedPriority.HIGH,
            fulfilledQuantity: 320,
          },
          {
            name: 'Atun en lata',
            description: 'Latas de atun en agua o aceite',
            quantity: 600,
            unit: 'latas',
            priority: NeedPriority.MEDIUM,
            fulfilledQuantity: 150,
          },
          {
            name: 'Aceite vegetal',
            description: 'Botellas de 1 litro',
            quantity: 400,
            unit: 'botellas',
            priority: NeedPriority.HIGH,
            fulfilledQuantity: 90,
          },
        ],
      },
      {
        title: 'Canastas navidenas para comedores comunitarios',
        description:
          'Campana finalizada de canastas con arroz, lentejas, aceite y panela para comedores de Bogota.',
        imageUrl:
          'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
        status: CampaignStatus.FINISHED,
        startOffsetDays: -105,
        endOffsetDays: -40,
        createdOffsetDays: -112,
        deliveryAddress: 'Centro logistico BAB — Calle 22C No. 68A-45, Bogota',
        deliveryLatitude: 4.6412,
        deliveryLongitude: -74.1201,
        needs: [
          {
            name: 'Canastas navidenas',
            description: 'Canastas con alimentos no perecederos',
            quantity: 200,
            unit: 'canastas',
            priority: NeedPriority.HIGH,
            fulfilledQuantity: 198,
          },
        ],
      },
    ],
  },
  {
    accountEmail: 'voluntarios@techo-demo.org',
    accountFullName: 'Coordinacion TECHO Colombia',
    accountPhone: '6013815000',
    name: 'TECHO Colombia',
    acronym: 'TECHO',
    nit: '900123456-1',
    slug: 'techo-colombia',
    category: 'Vivienda y comunidad',
    mission:
      'Trabajar por una sociedad justa y sin pobreza, donde todas las personas tengan oportunidad de desarrollo y ejerzan sus derechos.',
    vision:
      'Comunidades organizadas, protagonistas de su desarrollo y con vivienda digna.',
    description:
      'Organizacion que construye viviendas de emergencia y acompana proyectos comunitarios junto a voluntariado joven en asentamientos populares.',
    city: 'Bogota',
    department: 'Cundinamarca',
    country: 'Colombia',
    address: 'Carrera 7 No. 32-33, Bogota',
    latitude: 4.6186,
    longitude: -74.0678,
    institutionalEmail: 'voluntarios@techo-demo.org',
    phone: '6013815000',
    website: 'https://colombia.techo.org',
    legalRepresentativeName: 'Santiago Ruiz Cardona',
    legalRepresentativeDocument: '1012345678',
    logoUrl:
      'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=400&q=80',
    status: FoundationStatus.VERIFIED,
    registeredOffsetDays: -95,
    socialLinks: [
      { network: SocialNetworkType.INSTAGRAM, url: 'https://www.instagram.com/techocolombia' },
      { network: SocialNetworkType.YOUTUBE, url: 'https://www.youtube.com/@TECHOColombia' },
    ],
    campaigns: [
      {
        title: 'Materiales para vivienda de emergencia',
        description:
          'Recoleccion de laminas, madera tratada, clavos y kits de herramientas para jornadas de construccion en Soacha y Bosa.',
        imageUrl:
          'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
        status: CampaignStatus.PUBLISHED,
        startOffsetDays: -8,
        endOffsetDays: 45,
        createdOffsetDays: -58,
        deliveryAddress: 'Bodega TECHO — Parque Industrial Cazuca, Soacha',
        deliveryLatitude: 4.5781,
        deliveryLongitude: -74.2165,
        needs: [
          {
            name: 'Laminas de zinc',
            description: 'Laminas para techo de vivienda de emergencia',
            quantity: 120,
            unit: 'unidades',
            priority: NeedPriority.HIGH,
            fulfilledQuantity: 28,
          },
          {
            name: 'Martillos',
            description: 'Martillos de carpinteria',
            quantity: 40,
            unit: 'unidades',
            priority: NeedPriority.LOW,
            fulfilledQuantity: 10,
          },
        ],
      },
      {
        title: 'Enseres basicos para familias reubicadas',
        description:
          'Campana de colchones, cobijas y utensilios de cocina para familias que reciben vivienda de emergencia.',
        imageUrl:
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
        status: CampaignStatus.FINISHED,
        startOffsetDays: -90,
        endOffsetDays: -10,
        createdOffsetDays: -98,
        deliveryAddress: 'Bodega TECHO — Parque Industrial Cazuca, Soacha',
        deliveryLatitude: 4.5781,
        deliveryLongitude: -74.2165,
        needs: [
          {
            name: 'Cobijas',
            description: 'Cobijas dobles nuevas o en buen estado',
            quantity: 80,
            unit: 'unidades',
            priority: NeedPriority.MEDIUM,
            fulfilledQuantity: 80,
          },
        ],
      },
    ],
  },
  {
    accountEmail: 'fundacion.exito@demo.org',
    accountFullName: 'Fundacion Exito — Alianzas',
    accountPhone: '6046049696',
    name: 'Fundacion Exito',
    acronym: 'FEX',
    nit: '890900608-9',
    slug: 'fundacion-exito',
    category: 'Nutricion infantil',
    mission:
      'Contribuir a la nutricion adecuada de la primera infancia en Colombia para que ninas y ninos alcancen su maximo potencial.',
    vision:
      'Ser referentes en nutricion infantil a traves de alianzas publicas y privadas.',
    description:
      'Fundacion empresarial enfocada en nutricion de la primera infancia, educacion a cuidadores y fortalecimiento de entornos protectores.',
    city: 'Medellin',
    department: 'Antioquia',
    country: 'Colombia',
    address: 'Carrera 48 No. 32B Sur-139, Envigado',
    latitude: 6.1694,
    longitude: -75.5842,
    institutionalEmail: 'fundacion.exito@demo.org',
    phone: '6046049696',
    website: 'https://www.fundacionexito.org',
    legalRepresentativeName: 'Carolina Restrepo Velez',
    legalRepresentativeDocument: '43321567',
    logoUrl:
      'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80',
    status: FoundationStatus.VERIFIED,
    registeredOffsetDays: -68,
    socialLinks: [
      { network: SocialNetworkType.INSTAGRAM, url: 'https://www.instagram.com/fundacionexito' },
      { network: SocialNetworkType.FACEBOOK, url: 'https://www.facebook.com/FundacionExito' },
    ],
    campaigns: [
      {
        title: 'Paquetes nutricionales para primera infancia',
        description:
          'Recoleccion de alimentos fortificados, puree y snacks saludables para ninas y ninos de 0 a 5 anos en Antioquia.',
        imageUrl:
          'https://images.unsplash.com/photo-1476703993599-0035df94c839?auto=format&fit=crop&w=1200&q=80',
        status: CampaignStatus.PUBLISHED,
        startOffsetDays: -12,
        endOffsetDays: 35,
        createdOffsetDays: -42,
        deliveryAddress: 'Cedi Fundacion Exito — Envigado, Antioquia',
        deliveryLatitude: 6.1694,
        deliveryLongitude: -75.5842,
        needs: [
          {
            name: 'Compotas',
            description: 'Frascos de compota infantil',
            quantity: 500,
            unit: 'frascos',
            priority: NeedPriority.HIGH,
            fulfilledQuantity: 110,
          },
          {
            name: 'Panal desechable',
            description: 'Panal etapa 3 y 4',
            quantity: 1000,
            unit: 'unidades',
            priority: NeedPriority.MEDIUM,
            fulfilledQuantity: 250,
          },
        ],
      },
    ],
  },
  {
    accountEmail: 'nueva.fundacion@pendiente.org',
    accountFullName: 'Asociacion Manos que Suman',
    accountPhone: '3185559090',
    name: 'Asociacion Manos que Suman',
    acronym: 'AMS',
    nit: '901456789-0',
    slug: 'manos-que-suman',
    category: 'Desarrollo comunitario',
    mission:
      'Acompanar comunidades vulnerables de Norte de Santander con donaciones en especie y formacion comunitaria.',
    vision:
      'Comunidades autoorganizadas con acceso digno a bienes basicos.',
    description:
      'Organizacion local en proceso de verificacion. Trabaja con madres cabeza de hogar y adultos mayores en Cucuta y Villa del Rosario.',
    city: 'Cucuta',
    department: 'Norte de Santander',
    country: 'Colombia',
    address: 'Avenida 4 No. 15-20, Cucuta',
    latitude: 7.8891,
    longitude: -72.4967,
    institutionalEmail: 'nueva.fundacion@pendiente.org',
    phone: '3185559090',
    website: 'https://manosquesuman-demo.org',
    legalRepresentativeName: 'Liliana Patricia Suarez Mora',
    legalRepresentativeDocument: '60321458',
    logoUrl:
      'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=400&q=80',
    status: FoundationStatus.PENDING,
    registeredOffsetDays: -16,
    socialLinks: [
      { network: SocialNetworkType.INSTAGRAM, url: 'https://www.instagram.com/manosquesuman' },
    ],
    campaigns: [
      {
        title: 'Borrador — Ropa de invierno frontera',
        description:
          'Borrador de campana para recolectar chaquetas y cobijas en zona de frontera. Pendiente de publicacion tras verificacion.',
        imageUrl:
          'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
        status: CampaignStatus.DRAFT,
        startOffsetDays: 5,
        endOffsetDays: 60,
        createdOffsetDays: -8,
        deliveryAddress: 'Sede AMS — Avenida 4 No. 15-20, Cucuta',
        deliveryLatitude: 7.8891,
        deliveryLongitude: -72.4967,
        needs: [
          {
            name: 'Chaquetas',
            description: 'Chaquetas talla adulto y nino',
            quantity: 100,
            unit: 'unidades',
            priority: NeedPriority.MEDIUM,
            fulfilledQuantity: 0,
          },
        ],
      },
    ],
  },
];

export const DOCUMENT_TYPES: FoundationDocumentType[] = [
  FoundationDocumentType.RUT,
  FoundationDocumentType.LEGAL_EXISTENCE_CERTIFICATE,
  FoundationDocumentType.LEGAL_REPRESENTATIVE_ID,
  FoundationDocumentType.BANK_CERTIFICATION,
];
