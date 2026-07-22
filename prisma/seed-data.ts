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
}

export interface SeedDonorUser {
  email: string;
  fullName: string;
  phone: string;
  city: string;
  department: string;
  bio: string;
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
  socialLinks: Array<{ network: SocialNetworkType; url: string }>;
  campaigns: Array<{
    title: string;
    description: string;
    imageUrl: string;
    status: CampaignStatus;
    startOffsetDays: number;
    endOffsetDays: number;
    deliveryAddress: string;
    deliveryLatitude: number;
    deliveryLongitude: number;
    needs: Array<{
      name: string;
      description: string;
      quantity: number;
      unit: string;
      priority: NeedPriority;
      fulfilledQuantity: number;
    }>;
  }>;
}

export const ADMIN_USERS: SeedAdminUser[] = [
  {
    email: 'apoyo_ud@fesc.edu.co',
    fullName: 'Diego Alexander Rincon Casarubia',
    phone: '3001112233',
    city: 'Cucuta',
    department: 'Norte de Santander',
    bio: 'Administrador de la plataforma Ayudandonos — unidad de apoyo FESC.',
  },
  {
    email: 'ericksperezc@gmail.com',
    fullName: 'Erick Sebastian Perez Carvajal',
    phone: '3180938385',
    city: 'Cucuta',
    department: 'Norte de Santander',
    bio: 'Administrador tecnico de Ayudandonos.',
  },
  {
    email: 'tecnico_ud@fesc.edu.co',
    fullName: 'Erick Sebastian Perez Carvajal',
    phone: '3180938385',
    city: 'Cucuta',
    department: 'Norte de Santander',
    bio: 'Cuenta tecnica institucional FESC para administracion de Ayudandonos.',
  },
];

/** Cuentas del seed antiguo que deben eliminarse al sembrar el dataset actual. */
export const LEGACY_SEED_EMAILS: string[] = ['admin@gmail.com'];

export const DEMO_USERS_DEFAULT_PASSWORD = 'AyudaDemo2026!';

export const DONOR_USERS: SeedDonorUser[] = [
  {
    email: 'maria.gomez.donante@gmail.com',
    fullName: 'Maria Camila Gomez Ruiz',
    phone: '3105550101',
    city: 'Bogota',
    department: 'Cundinamarca',
    bio: 'Donante recurrente de viveres y kits escolares en Bogota.',
  },
  {
    email: 'andres.lopez.ayuda@gmail.com',
    fullName: 'Andres Felipe Lopez Mejia',
    phone: '3115550202',
    city: 'Medellin',
    department: 'Antioquia',
    bio: 'Voluntario y donante de ropa y elementos de aseo.',
  },
  {
    email: 'laura.martinez.solidaria@outlook.com',
    fullName: 'Laura Patricia Martinez Soto',
    phone: '3125550303',
    city: 'Cali',
    department: 'Valle del Cauca',
    bio: 'Apoyo campañas de nutricion infantil en el Valle.',
  },
  {
    email: 'juan.castro.donaciones@gmail.com',
    fullName: 'Juan David Castro Pena',
    phone: '3135550404',
    city: 'Bucaramanga',
    department: 'Santander',
    bio: 'Donante de mercados y productos no perecederos.',
  },
  {
    email: 'sofia.ramirez.ayuda@hotmail.com',
    fullName: 'Sofia Andrea Ramirez Quintero',
    phone: '3145550505',
    city: 'Cucuta',
    department: 'Norte de Santander',
    bio: 'Donante local enfocada en primera infancia y educacion.',
  },
  {
    email: 'carlos.hernandez.donor@gmail.com',
    fullName: 'Carlos Eduardo Hernandez Diaz',
    phone: '3155550606',
    city: 'Barrancabermeja',
    department: 'Santander',
    bio: 'Empresario solidario que aporta insumos de higiene.',
  },
  {
    email: 'valentina.rojas.donante@gmail.com',
    fullName: 'Valentina Rojas Aguilar',
    phone: '3165550707',
    city: 'Bogota',
    department: 'Cundinamarca',
    bio: 'Apoya jornadas de recoleccion de utiles escolares.',
  },
  {
    email: 'diego.moreno.solidario@gmail.com',
    fullName: 'Diego Alejandro Moreno Silva',
    phone: '3175550808',
    city: 'Pereira',
    department: 'Risaralda',
    bio: 'Donante de enseres y materiales de construccion liviana.',
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
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Logo_of_UNICEF.svg/512px-Logo_of_UNICEF.svg.png',
    status: FoundationStatus.VERIFIED,
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
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_the_Red_Cross.svg/512px-Flag_of_the_Red_Cross.svg.png',
    status: FoundationStatus.VERIFIED,
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
