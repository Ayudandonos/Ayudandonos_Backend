import bcrypt from 'bcrypt';
import {
  DonationStatus,
  FoundationStatus,
  NotificationType,
  PostReactionType,
  PrismaClient,
  StockMovementType,
  UserRole,
  type User,
} from '@prisma/client';
import dotenv from 'dotenv';
import {
  ADMIN_USERS,
  DEMO_USERS_DEFAULT_PASSWORD,
  DOCUMENT_TYPES,
  DONOR_USERS,
  FOUNDATION_SEEDS,
  HISTORICAL_DONOR_USERS,
  SEED_DONATION_DONOR_NOTES,
  SEED_DONATION_RECEPTION_NOTES,
  SEED_INVENTORY_IN_NOTES,
  SEED_OUTBOUND_OBSERVATIONS,
  SEED_POST_IMAGE_URLS,
  type SeedAdminUser,
  type SeedDonorUser,
  type SeedFoundationBranchInput,
  type SeedFoundationInput,
} from './seed-data.js';

dotenv.config();

const SALT_ROUNDS = 12;
const prisma = new PrismaClient();

/** Dias de historial simulado para graficas administrativas (6 meses). */
const HISTORY_SPAN_DAYS = 175;

/**
 * Entrada: plainText: contrasena en texto plano.
 * Proceso: Genera hash bcrypt con las mismas rondas de sal que autenticacion.
 * Salida: Retorna el hash listo para persistir.
 */
async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

/**
 * Entrada: days: desplazamiento en dias respecto a hoy (negativo = pasado).
 * Proceso: Calcula una fecha UTC al mediodia desplazada.
 * Salida: Retorna Date resultante.
 */
function daysFromNow(days: number): Date {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

/**
 * Entrada: days: desplazamiento en dias respecto a hoy.
 * Proceso: Construye createdAt y updatedAt para simular registros historicos.
 * Salida: Retorna objeto con marcas de tiempo.
 */
function timestampsAt(days: number): { createdAt: Date; updatedAt: Date } {
  const createdAt = daysFromNow(days);
  return { createdAt, updatedAt: createdAt };
}

/**
 * Entrada: offsetDays: desplazamiento opcional del registro.
 * Proceso: Resuelve el desplazamiento por defecto a hoy si no se define.
 * Salida: Retorna dias de desplazamiento efectivos.
 */
function resolveOffsetDays(offsetDays?: number): number {
  return offsetDays ?? 0;
}

/**
 * Entrada: Ninguna.
 * Proceso: Vacia todas las tablas de negocio para dejar solo el dataset del seed.
 * Salida: No retorna valor.
 */
async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "notifications",
      "messages",
      "conversations",
      "donation_status_history",
      "donations",
      "needs",
      "post_comments",
      "post_reactions",
      "foundation_post_images",
      "foundation_post_lines",
      "foundation_posts",
      "stock_movements",
      "inventory_outbound_lines",
      "inventory_outbounds",
      "inventory_items",
      "campaigns",
      "foundation_branches",
      "foundation_admin_observations",
      "foundation_documents",
      "foundation_social_links",
      "foundations",
      "users"
    RESTART IDENTITY CASCADE
  `);

  console.log('[SEED] Base de datos vaciada. Se cargara solo el dataset del seed.');
}

/**
 * Entrada: Ninguna.
 * Proceso: Verifica que migraciones recientes esten aplicadas antes de sembrar.
 * Salida: Retorna void o lanza error con instrucciones de despliegue.
 */
async function assertMigrationsApplied(): Promise<void> {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'donations'
        AND column_name = 'foundation_branch_id'
    ) AS "exists"
  `;

  if (!rows[0]?.exists) {
    throw new Error(
      'El esquema de la base de datos no esta actualizado (falta donations.foundation_branch_id). ' +
        'Ejecuta: npm run db:deploy  o  npm run db:setup',
    );
  }
}

/**
 * Entrada: admin: datos del administrador; passwordHash: hash de contrasena.
 * Proceso: Crea un usuario ADMIN con fecha de registro historica.
 * Salida: Retorna el usuario persistido.
 */
async function createAdmin(admin: SeedAdminUser, passwordHash: string): Promise<User> {
  const { createdAt, updatedAt } = timestampsAt(resolveOffsetDays(admin.registeredOffsetDays));

  return prisma.user.create({
    data: {
      email: admin.email,
      fullName: admin.fullName,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      phone: admin.phone ?? null,
      city: admin.city ?? null,
      department: admin.department ?? null,
      bio: admin.bio ?? null,
      avatarUrl: admin.avatarUrl ?? null,
      createdAt,
      updatedAt,
    },
  });
}

/**
 * Entrada: donors: lista de donantes; passwordHash: hash compartido.
 * Proceso: Crea donantes demo con perfil y fechas de registro distribuidas.
 * Salida: Retorna la lista de usuarios donantes.
 */
async function seedDonors(donors: SeedDonorUser[], passwordHash: string): Promise<User[]> {
  const created: User[] = [];

  for (const donor of donors) {
    const { createdAt, updatedAt } = timestampsAt(resolveOffsetDays(donor.registeredOffsetDays));

    const user = await prisma.user.create({
      data: {
        email: donor.email,
        fullName: donor.fullName,
        passwordHash,
        role: UserRole.USER,
        isActive: true,
        phone: donor.phone,
        city: donor.city,
        department: donor.department,
        bio: donor.bio,
        avatarUrl: donor.avatarUrl ?? null,
        createdAt,
        updatedAt,
      },
    });
    created.push(user);
    console.log(`[SEED] Donante listo: ${user.fullName} <${user.email}>`);
  }

  return created;
}

/**
 * Entrada: foundationId: id de fundacion.
 * Proceso: Crea documentos legales placeholder requeridos para operar.
 * Salida: No retorna valor.
 */
async function seedFoundationDocuments(foundationId: string, baseDate: Date): Promise<void> {
  for (const type of DOCUMENT_TYPES) {
    await prisma.foundationDocument.create({
      data: {
        foundationId,
        type,
        fileName: `${type.toLowerCase()}.pdf`,
        mimeType: 'application/pdf',
        fileSize: 120_000,
        fileUrl: `https://example.com/seed-docs/${foundationId}/${type.toLowerCase()}.pdf`,
        uploadedAt: baseDate,
        updatedAt: baseDate,
      },
    });
  }
}

/**
 * Entrada: foundationId: id; links: redes sociales; baseDate: fecha de alta.
 * Proceso: Crea enlaces sociales por red.
 * Salida: No retorna valor.
 */
async function seedSocialLinks(
  foundationId: string,
  links: SeedFoundationInput['socialLinks'],
  baseDate: Date,
): Promise<void> {
  for (const link of links) {
    await prisma.foundationSocialLink.create({
      data: {
        foundationId,
        network: link.network,
        url: link.url,
        createdAt: baseDate,
        updatedAt: baseDate,
      },
    });
  }
}

/**
 * Entrada: foundationId, sedes demo y fecha base.
 * Proceso: Persiste las sedes de la fundacion y retorna la sede principal.
 * Salida: Retorna sede principal y listado creado.
 */
async function seedFoundationBranches(
  foundationId: string,
  branchSeeds: SeedFoundationBranchInput[],
  createdAt: Date,
): Promise<{
  primaryBranch: {
    id: string;
    address: string;
    city: string;
    department: string;
    latitude: number | null;
    longitude: number | null;
  };
}> {
  let primaryBranch:
    | {
        id: string;
        address: string;
        city: string;
        department: string;
        latitude: number | null;
        longitude: number | null;
      }
    | null = null;

  for (const branchSeed of branchSeeds) {
    const branch = await prisma.foundationBranch.create({
      data: {
        foundationId,
        name: branchSeed.name,
        department: branchSeed.department,
        city: branchSeed.city,
        address: branchSeed.address,
        reference: branchSeed.reference,
        phone: branchSeed.phone,
        openingHours: branchSeed.openingHours,
        latitude: branchSeed.latitude,
        longitude: branchSeed.longitude,
        createdAt,
        updatedAt: createdAt,
      },
    });

    const snapshot = {
      id: branch.id,
      address: branch.address,
      city: branch.city,
      department: branch.department,
      latitude: branch.latitude,
      longitude: branch.longitude,
    };

    if (branchSeed.isPrimary) {
      primaryBranch = snapshot;
    } else if (!primaryBranch) {
      primaryBranch = snapshot;
    }
  }

  if (!primaryBranch) {
    throw new Error('[SEED] Cada fundacion debe tener al menos una sede en branches.');
  }

  return { primaryBranch };
}

/**
 * Entrada: foundationId: id; campaigns: campanas demo.
 * Proceso: Crea campanas y needs con fechas historicas.
 * Salida: Retorna ids de needs para donaciones demo.
 */
async function seedCampaigns(
  foundationId: string,
  foundationBranchId: string,
  branchSnapshot: {
    address: string;
    city: string;
    department: string;
    latitude: number | null;
    longitude: number | null;
  },
  campaigns: SeedFoundationInput['campaigns'],
): Promise<string[]> {
  const needIds: string[] = [];

  for (const campaignSeed of campaigns) {
    const campaignCreatedAt = daysFromNow(
      resolveOffsetDays(campaignSeed.createdOffsetDays ?? campaignSeed.startOffsetDays),
    );

    const campaign = await prisma.campaign.create({
      data: {
        foundationId,
        foundationBranchId,
        title: campaignSeed.title,
        description: campaignSeed.description,
        imageUrl: campaignSeed.imageUrl,
        status: campaignSeed.status,
        startDate: daysFromNow(campaignSeed.startOffsetDays),
        endDate: daysFromNow(campaignSeed.endOffsetDays),
        deliveryAddress: `${branchSnapshot.address}, ${branchSnapshot.city}, ${branchSnapshot.department}`,
        deliveryLatitude: branchSnapshot.latitude,
        deliveryLongitude: branchSnapshot.longitude,
        createdAt: campaignCreatedAt,
        updatedAt: campaignCreatedAt,
      },
    });

    for (const needSeed of campaignSeed.needs) {
      const need = await prisma.need.create({
        data: {
          campaignId: campaign.id,
          name: needSeed.name,
          description: needSeed.description,
          quantity: needSeed.quantity,
          unit: needSeed.unit,
          priority: needSeed.priority,
          fulfilledQuantity: needSeed.fulfilledQuantity,
          createdAt: campaignCreatedAt,
          updatedAt: campaignCreatedAt,
        },
      });

      needIds.push(need.id);
    }

    console.log(`[SEED] Campana lista: ${campaign.title}`);
  }

  return needIds;
}

/**
 * Entrada: seed: datos de fundacion; passwordHash: hash de cuenta; verifierId: admin.
 * Proceso: Crea usuario FOUNDATION, perfil, documentos, redes y campanas.
 * Salida: Retorna ids de needs de la fundacion.
 */
async function seedFoundation(
  seed: SeedFoundationInput,
  passwordHash: string,
  verifierId: string,
): Promise<string[]> {
  const foundationOffset = resolveOffsetDays(seed.registeredOffsetDays);
  const { createdAt, updatedAt } = timestampsAt(foundationOffset);
  const verifiedAt =
    seed.status === FoundationStatus.VERIFIED ? daysFromNow(foundationOffset + 3) : null;

  const account = await prisma.user.create({
    data: {
      email: seed.accountEmail,
      fullName: seed.accountFullName,
      passwordHash,
      role: UserRole.FOUNDATION,
      isActive: true,
      phone: seed.accountPhone,
      city: seed.city,
      department: seed.department,
      bio: `Cuenta institucional de ${seed.name}.`,
      avatarUrl: seed.accountAvatarUrl ?? null,
      createdAt,
      updatedAt,
    },
  });

  const foundation = await prisma.foundation.create({
    data: {
      userId: account.id,
      name: seed.name,
      acronym: seed.acronym,
      nit: seed.nit,
      slug: seed.slug,
      category: seed.category,
      mission: seed.mission,
      vision: seed.vision,
      description: seed.description,
      city: seed.city,
      department: seed.department,
      country: seed.country,
      address: seed.address,
      latitude: seed.latitude,
      longitude: seed.longitude,
      institutionalEmail: seed.institutionalEmail,
      phone: seed.phone,
      website: seed.website,
      legalRepresentativeName: seed.legalRepresentativeName,
      legalRepresentativeDocument: seed.legalRepresentativeDocument,
      logoUrl: seed.logoUrl,
      status: seed.status,
      verifiedAt,
      verifiedById: seed.status === FoundationStatus.VERIFIED ? verifierId : null,
      adminNotes:
        seed.status === FoundationStatus.PENDING
          ? 'Fundacion demo pendiente de revision administrativa.'
          : 'Fundacion demo verificada por seed.',
      createdAt,
      updatedAt,
    },
  });

  await seedFoundationDocuments(foundation.id, createdAt);
  await seedSocialLinks(foundation.id, seed.socialLinks, createdAt);

  const { primaryBranch } = await seedFoundationBranches(
    foundation.id,
    seed.branches,
    createdAt,
  );

  const needIds = await seedCampaigns(
    foundation.id,
    primaryBranch.id,
    {
      address: primaryBranch.address,
      city: primaryBranch.city,
      department: primaryBranch.department,
      latitude: primaryBranch.latitude,
      longitude: primaryBranch.longitude,
    },
    seed.campaigns,
  );

  console.log(`[SEED] Fundacion lista: ${foundation.name} (${foundation.status})`);
  return needIds;
}

/**
 * Entrada: offsetDays: antiguedad de la donacion; index: indice para variar estado.
 * Proceso: Asigna un estado coherente con la antiguedad simulada.
 * Salida: Retorna estado de donacion.
 */
function donationStatusForAge(offsetDays: number, index: number): DonationStatus {
  if (offsetDays < -100) {
    const pool = [
      DonationStatus.RECEIVED,
      DonationStatus.RECEIVED,
      DonationStatus.RECEIVED,
      DonationStatus.CANCELLED,
    ];
    return pool[index % pool.length] ?? DonationStatus.RECEIVED;
  }

  if (offsetDays < -50) {
    const pool = [
      DonationStatus.RECEIVED,
      DonationStatus.RECEIVED,
      DonationStatus.COMMITTED,
    ];
    return pool[index % pool.length] ?? DonationStatus.RECEIVED;
  }

  const pool = [
    DonationStatus.COMMITTED,
    DonationStatus.COMMITTED,
    DonationStatus.RECEIVED,
    DonationStatus.CANCELLED,
  ];
  return pool[index % pool.length] ?? DonationStatus.COMMITTED;
}

/**
 * Entrada: Ninguna.
 * Proceso: Genera offsets de donaciones distribuidos en los ultimos 6 meses.
 * Salida: Retorna lista de dias negativos para created_at de donaciones.
 */
function buildHistoricalDonationOffsets(): number[] {
  const offsets: number[] = [];

  for (let month = 5; month >= 0; month -= 1) {
    const base = month * 28 + 8;
    const donationsThisMonth = 6 + (month % 3);

    for (let index = 0; index < donationsThisMonth; index += 1) {
      const day = base + index * 4 + (month % 2);
      if (day <= HISTORY_SPAN_DAYS) {
        offsets.push(-day);
      }
    }
  }

  return offsets.sort((a, b) => a - b);
}

/**
 * Entrada: donors: usuarios donantes; needIds: necesidades publicadas; changerId: admin.
 * Proceso: Crea donaciones demo distribuidas en el tiempo para graficas administrativas.
 * Salida: No retorna valor.
 */
async function seedHistoricalDonations(
  donors: User[],
  needIds: string[],
  changerId: string,
): Promise<void> {
  if (donors.length === 0 || needIds.length === 0) {
    return;
  }

  const offsets = buildHistoricalDonationOffsets();
  let created = 0;

  for (let index = 0; index < offsets.length; index += 1) {
    const offsetDays = offsets[index] ?? -7;
    const donor = donors[index % donors.length];
    const needId = needIds[index % needIds.length];
    const status = donationStatusForAge(offsetDays, index);
    const { createdAt, updatedAt } = timestampsAt(offsetDays);

    const need = await prisma.need.findFirstOrThrow({
      where: { id: needId },
      select: {
        campaign: { select: { foundationBranchId: true } },
      },
    });

    const quantity = 2 + (index % 7);
    const isReceived = status === DonationStatus.RECEIVED;
    const receptionDate = new Date(createdAt);
    if (isReceived) {
      receptionDate.setUTCDate(receptionDate.getUTCDate() + 3);
    }

    const donation = await prisma.donation.create({
      data: {
        needId,
        donorUserId: donor.id,
        foundationBranchId: need.campaign.foundationBranchId,
        status,
        quantity,
        receivedQuantity: isReceived ? quantity : null,
        receivedAt: isReceived ? receptionDate : null,
        receptionNotes: isReceived
          ? SEED_DONATION_RECEPTION_NOTES[index % SEED_DONATION_RECEPTION_NOTES.length]
          : null,
        notes: SEED_DONATION_DONOR_NOTES[index % SEED_DONATION_DONOR_NOTES.length],
        estimatedDeliveryAt: daysFromNow(offsetDays + 5),
        createdAt,
        updatedAt,
      },
    });

    const statusHistoryNote =
      status === DonationStatus.RECEIVED
        ? 'Recepcion confirmada en sede de acopio.'
        : status === DonationStatus.CANCELLED
          ? 'Compromiso cancelado por el donante.'
          : null;

    await prisma.donationStatusHistory.create({
      data: {
        donationId: donation.id,
        fromStatus: null,
        toStatus: status,
        changedById: changerId,
        note: statusHistoryNote,
        createdAt,
      },
    });

    await prisma.conversation.create({
      data: { donationId: donation.id },
    });

    created += 1;
  }

  console.log(`[SEED] Donaciones demo creadas: ${created} (historial ~6 meses)`);
}

type SeedChatTurn = {
  from: 'donor' | 'foundation';
  body: string;
  hoursOffset: number;
};

const SEED_CHAT_THREADS: SeedChatTurn[][] = [
  [
    {
      from: 'donor',
      body: 'Hola, acabo de comprometer mi donacion. ¿Me confirman la direccion de la sede de entrega?',
      hoursOffset: 1,
    },
  ],
  [
    {
      from: 'donor',
      body: 'Buenos dias, puedo llevar los productos este sabado por la tarde.',
      hoursOffset: 1,
    },
    {
      from: 'foundation',
      body: 'Hola, gracias por tu apoyo. Te esperamos el sabado de 9:00 a 17:00 en la sede de la campana.',
      hoursOffset: 3,
    },
    {
      from: 'donor',
      body: 'Perfecto, llegare alrededor de las 11:00. Muchas gracias.',
      hoursOffset: 5,
    },
  ],
  [
    {
      from: 'donor',
      body: 'Tengo listos los articulos. ¿Hay parqueadero disponible cerca de la sede?',
      hoursOffset: 2,
    },
    {
      from: 'foundation',
      body: 'Si, hay parqueadero para visitantes frente al punto de acopio.',
      hoursOffset: 4,
    },
  ],
  [
    {
      from: 'donor',
      body: '¿Puedo entregar en varias partes o debe ser todo el mismo dia?',
      hoursOffset: 1,
    },
  ],
  [
    {
      from: 'donor',
      body: 'Hola, coordinemos la entrega. Estoy disponible entre semana despues de las 4pm.',
      hoursOffset: 2,
    },
    {
      from: 'foundation',
      body: 'Con gusto. Puedes acercarte de lunes a viernes de 8:00 a 17:00.',
      hoursOffset: 6,
    },
    {
      from: 'donor',
      body: 'Excelente, paso el jueves a las 4:30pm. Llevo todo lo comprometido.',
      hoursOffset: 8,
    },
    {
      from: 'foundation',
      body: 'Te esperamos el jueves. Gracias por sumarte a la campana.',
      hoursOffset: 10,
    },
  ],
];

/**
 * Entrada: donors: usuarios donantes del seed.
 * Proceso: Crea hilos de chat en donaciones activas para demo de mensajeria.
 * Salida: No retorna valor.
 */
async function seedDonationMessages(donors: User[]): Promise<void> {
  const donations = await prisma.donation.findMany({
    where: {
      status: { in: [DonationStatus.COMMITTED, DonationStatus.RECEIVED] },
      conversation: { isNot: null },
    },
    include: {
      conversation: true,
      need: {
        select: {
          campaign: {
            select: {
              foundation: {
                select: {
                  userId: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 18,
  });

  if (donations.length === 0) {
    console.log('[SEED] Mensajeria demo omitida: sin donaciones con conversacion.');
    return;
  }

  let messageCount = 0;

  for (let index = 0; index < donations.length; index += 1) {
    const donation = donations[index];
    const conversation = donation.conversation;

    if (!conversation) {
      continue;
    }

    const thread = SEED_CHAT_THREADS[index % SEED_CHAT_THREADS.length] ?? SEED_CHAT_THREADS[0]!;
    const recentActivity = index < 8;
    const baseTime = recentActivity ? daysFromNow(-2 + (index % 3)) : donation.createdAt;
    const foundationHasRead = index % 4 === 0;

    for (const turn of thread) {
      const createdAt = new Date(baseTime);
      createdAt.setHours(createdAt.getHours() + turn.hoursOffset);
      const senderId =
        turn.from === 'donor'
          ? donation.donorUserId
          : donation.need.campaign.foundation.userId;

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId,
          body: turn.body,
          createdAt,
        },
      });
      messageCount += 1;
    }

    const lastTurn = thread[thread.length - 1]!;
    const lastCreatedAt = new Date(baseTime);
    lastCreatedAt.setHours(lastCreatedAt.getHours() + lastTurn.hoursOffset);
    const lastSenderId =
      lastTurn.from === 'donor'
        ? donation.donorUserId
        : donation.need.campaign.foundation.userId;
    const lastFromDonor = lastTurn.from === 'donor';

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: lastCreatedAt,
        lastMessageBody: lastTurn.body,
        lastMessageSenderId: lastSenderId,
        foundationLastReadAt:
          lastFromDonor && !foundationHasRead ? null : lastCreatedAt,
        donorLastReadAt: lastFromDonor ? lastCreatedAt : null,
      },
    });
  }

  const demoDonor = donors.find((donor) => donor.email === DEMO_DONOR_EMAIL);
  const spotlightDonation = demoDonor
    ? await prisma.donation.findFirst({
        where: {
          donorUserId: demoDonor.id,
          status: DonationStatus.COMMITTED,
          conversation: { isNot: null },
        },
        include: {
          conversation: true,
          need: {
            select: {
              campaign: {
                select: {
                  foundation: { select: { userId: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    : null;

  if (spotlightDonation?.conversation) {
    await prisma.message.deleteMany({
      where: { conversationId: spotlightDonation.conversation.id },
    });

    const spotlightThread: SeedChatTurn[] = [
      {
        from: 'donor',
        body: 'Hola, soy Maria. Quiero coordinar la entrega de mi donacion esta semana.',
        hoursOffset: 0,
      },
      {
        from: 'foundation',
        body: 'Hola Maria, gracias por escribir. Puedes acercarte a la sede de la campana de lunes a viernes.',
        hoursOffset: 2,
      },
      {
        from: 'donor',
        body: 'Perfecto. ¿Debo llevar alguna lista o comprobante al momento de entregar?',
        hoursOffset: 4,
      },
      {
        from: 'foundation',
        body: 'Solo indica tu nombre y la campana. Nosotros validamos el compromiso en el sistema.',
        hoursOffset: 6,
      },
      {
        from: 'donor',
        body: 'Listo, paso manana a las 10:00 am. Muchas gracias por la orientacion.',
        hoursOffset: 8,
      },
    ];

    const baseTime = daysFromNow(-1);

    for (const turn of spotlightThread) {
      const createdAt = new Date(baseTime);
      createdAt.setHours(createdAt.getHours() + turn.hoursOffset);
      const senderId =
        turn.from === 'donor'
          ? spotlightDonation.donorUserId
          : spotlightDonation.need.campaign.foundation.userId;

      await prisma.message.create({
        data: {
          conversationId: spotlightDonation.conversation.id,
          senderId,
          body: turn.body,
          createdAt,
        },
      });
      messageCount += 1;
    }

    const lastTurn = spotlightThread[spotlightThread.length - 1]!;
    const lastCreatedAt = new Date(baseTime);
    lastCreatedAt.setHours(lastCreatedAt.getHours() + lastTurn.hoursOffset);

    await prisma.conversation.update({
      where: { id: spotlightDonation.conversation.id },
      data: {
        lastMessageAt: lastCreatedAt,
        lastMessageBody: lastTurn.body,
        lastMessageSenderId: spotlightDonation.donorUserId,
        foundationLastReadAt: null,
        donorLastReadAt: lastCreatedAt,
      },
    });

    console.log(
      `[SEED] Conversacion demo destacada: donacion ${spotlightDonation.id} (${spotlightDonation.need.campaign.foundation.name})`,
    );
  }

  console.log(`[SEED] Mensajeria demo creada: ${messageCount} mensajes en ${donations.length} conversaciones.`);
}

const DEMO_DONOR_EMAIL = 'maria.gomez.donante@gmail.com';
const DEMO_ADMIN_EMAIL = 'ericksperezc@gmail.com';

/**
 * Entrada: donors y admins: usuarios demo del seed.
 * Proceso: Crea notificaciones in-app de ejemplo para donante y administrador demo.
 * Salida: No retorna valor.
 */
async function seedDemoNotifications(donors: User[], admins: User[]): Promise<void> {
  const demoDonor = donors.find((donor) => donor.email === DEMO_DONOR_EMAIL);

  if (!demoDonor) {
    console.log('[SEED] Notificaciones donante omitidas: donante demo no encontrado.');
  } else {
    const donation = await prisma.donation.findFirst({
      where: { donorUserId: demoDonor.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!donation) {
      console.log('[SEED] Notificaciones donante omitidas: sin donaciones del donante demo.');
    } else {
      const recentAt = daysFromNow(-1);
      const olderAt = daysFromNow(-3);

      await prisma.notification.createMany({
        data: [
          {
            userId: demoDonor.id,
            type: NotificationType.DONATION_STATUS_CHANGED,
            title: 'Actualización de donación',
            body: 'Tu donacion fue recibida por la fundacion.',
            linkPath: `/my-donations/${donation.id}`,
            resourceType: 'DONATION',
            resourceId: donation.id,
            isRead: false,
            createdAt: recentAt,
          },
          {
            userId: demoDonor.id,
            type: NotificationType.DONATION_STATUS_CHANGED,
            title: 'Donación recibida',
            body: 'La fundación confirmó la recepción de tu donación.',
            linkPath: `/my-donations/${donation.id}`,
            resourceType: 'DONATION',
            resourceId: donation.id,
            isRead: true,
            readAt: olderAt,
            createdAt: olderAt,
          },
        ],
      });

      console.log('[SEED] Notificaciones demo creadas: 2 (donante demo)');
    }
  }

  const demoAdmin = admins.find((admin) => admin.email === DEMO_ADMIN_EMAIL);

  if (!demoAdmin) {
    console.log('[SEED] Notificaciones admin omitidas: admin demo no encontrado.');
    return;
  }

  const pendingFoundation = await prisma.foundation.findFirst({
    where: { status: FoundationStatus.PENDING },
    orderBy: { createdAt: 'desc' },
  });

  const recentDonation = await prisma.donation.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  const adminRecentAt = daysFromNow(-1);
  const adminOlderAt = daysFromNow(-4);

  await prisma.notification.createMany({
    data: [
      {
        userId: demoAdmin.id,
        type: NotificationType.DONATION_CREATED,
        title: 'Fundación pendiente de verificación',
        body: pendingFoundation
          ? `"${pendingFoundation.name}" espera revisión administrativa.`
          : 'Hay fundaciones pendientes de verificación en el panel.',
        linkPath: '/admin/foundations',
        resourceType: pendingFoundation ? 'FOUNDATION' : null,
        resourceId: pendingFoundation?.id ?? null,
        isRead: false,
        createdAt: adminRecentAt,
      },
      {
        userId: demoAdmin.id,
        type: NotificationType.DONATION_STATUS_CHANGED,
        title: 'Actividad reciente en donaciones',
        body: 'Revisa el panel de reportes para ver el resumen del último mes.',
        linkPath: '/admin/reports',
        resourceType: recentDonation ? 'DONATION' : null,
        resourceId: recentDonation?.id ?? null,
        isRead: true,
        readAt: adminOlderAt,
        createdAt: adminOlderAt,
      },
    ],
  });

  console.log('[SEED] Notificaciones demo creadas: 2 (admin demo)');
}

const RECEIVED_DONATION_STATUSES: DonationStatus[] = [DonationStatus.RECEIVED];

interface InventoryItemSeedRef {
  id: string;
  foundationId: string;
  name: string;
  unit: string;
}

interface OutboundLineSeed {
  inventoryItemId: string;
  quantity: number;
  name: string;
  unit: string;
}

/**
 * Entrada: foundationSlug, title e indice de salida.
 * Proceso: Genera slug unico para publicacion de impacto.
 * Salida: Retorna slug URL-safe.
 */
function buildSeedPostSlug(foundationSlug: string, title: string, index: number): string {
  const normalized = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return `${foundationSlug}-${normalized || 'entrega'}-${index}`;
}

/**
 * Entrada: parametros de salida, lineas, imagenes y fecha historica.
 * Proceso: Crea salida OUT, movimientos y publicacion obligatoria en una transaccion.
 * Salida: Retorna id del post creado.
 */
async function createOutboundWithPostAt(params: {
  foundationId: string;
  campaignId: string;
  foundationBranchId: string;
  title: string;
  description: string;
  observations?: string | null;
  slug: string;
  lines: OutboundLineSeed[];
  imageUrls: string[];
  createdById: string | null;
  eventDate: Date;
}): Promise<string> {
  const totalQuantityDelivered = params.lines.reduce((sum, line) => sum + line.quantity, 0);

  const result = await prisma.$transaction(async (tx) => {
    for (const line of params.lines) {
      const item = await tx.inventoryItem.findFirst({
        where: { id: line.inventoryItemId, foundationId: params.foundationId },
      });

      if (!item || item.quantityAvailable < line.quantity) {
        throw new Error(`INSUFFICIENT_STOCK:${line.name}`);
      }
    }

    const outbound = await tx.inventoryOutbound.create({
      data: {
        foundationId: params.foundationId,
        campaignId: params.campaignId,
        foundationBranchId: params.foundationBranchId,
        title: params.title,
        description: params.description,
        observations: params.observations ?? null,
        totalQuantityDelivered,
        createdById: params.createdById,
        createdAt: params.eventDate,
      },
    });

    for (const line of params.lines) {
      await tx.inventoryItem.update({
        where: { id: line.inventoryItemId },
        data: { quantityAvailable: { decrement: line.quantity } },
      });

      await tx.inventoryOutboundLine.create({
        data: {
          outboundId: outbound.id,
          inventoryItemId: line.inventoryItemId,
          quantity: line.quantity,
        },
      });

      await tx.stockMovement.create({
        data: {
          foundationId: params.foundationId,
          inventoryItemId: line.inventoryItemId,
          outboundId: outbound.id,
          campaignId: params.campaignId,
          foundationBranchId: params.foundationBranchId,
          type: StockMovementType.OUT,
          quantity: line.quantity,
          note: 'Salida registrada para entrega comunitaria.',
          createdById: params.createdById,
          createdAt: params.eventDate,
        },
      });
    }

    const post = await tx.foundationPost.create({
      data: {
        foundationId: params.foundationId,
        campaignId: params.campaignId,
        foundationBranchId: params.foundationBranchId,
        outboundId: outbound.id,
        title: params.title,
        description: params.description,
        totalQuantityDelivered,
        slug: params.slug,
        publishedAt: params.eventDate,
        createdAt: params.eventDate,
        updatedAt: params.eventDate,
        lines: {
          create: params.lines.map((line) => ({
            inventoryItemId: line.inventoryItemId,
            itemName: line.name,
            unit: line.unit,
            quantity: line.quantity,
          })),
        },
        images: {
          create: params.imageUrls.map((imageUrl, index) => ({
            imageUrl,
            sortOrder: index,
          })),
        },
      },
    });

    return post.id;
  });

  return result;
}

/**
 * Entrada: donors: usuarios donantes del seed.
 * Proceso: Crea inventario desde donaciones recibidas, salidas con posts y actividad social demo.
 * Salida: No retorna valor.
 */
async function seedInventoryFromDonations(donors: User[]): Promise<void> {
  const receivedDonations = await prisma.donation.findMany({
    where: { status: { in: RECEIVED_DONATION_STATUSES } },
    include: {
      need: {
        select: {
          name: true,
          unit: true,
          campaign: {
            select: { id: true, title: true, foundationId: true, foundationBranchId: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (receivedDonations.length === 0) {
    console.log('[SEED] Inventario omitido: no hay donaciones recibidas (RECEIVED).');
    return;
  }

  const itemByKey = new Map<string, InventoryItemSeedRef>();
  let stockInMovements = 0;

  for (const donation of receivedDonations) {
    const campaign = donation.need.campaign;
    const key = `${campaign.foundationId}:${donation.need.name}:${donation.need.unit}`;
    let item = itemByKey.get(key);

    if (!item) {
      const created = await prisma.inventoryItem.create({
        data: {
          foundationId: campaign.foundationId,
          name: donation.need.name,
          unit: donation.need.unit,
          quantityAvailable: 0,
        },
      });

      item = {
        id: created.id,
        foundationId: created.foundationId,
        name: created.name,
        unit: created.unit,
      };
      itemByKey.set(key, item);
    }

    const receptionDate = new Date(donation.createdAt);
    receptionDate.setUTCDate(receptionDate.getUTCDate() + 3);

    const receivedQty = donation.receivedQuantity ?? donation.quantity;

    await prisma.inventoryItem.update({
      where: { id: item.id },
      data: { quantityAvailable: { increment: receivedQty } },
    });

    await prisma.stockMovement.create({
      data: {
        foundationId: item.foundationId,
        inventoryItemId: item.id,
        donationId: donation.id,
        campaignId: campaign.id,
        foundationBranchId: donation.foundationBranchId,
        type: StockMovementType.IN,
        quantity: receivedQty,
        note: SEED_INVENTORY_IN_NOTES[stockInMovements % SEED_INVENTORY_IN_NOTES.length],
        createdAt: receptionDate,
      },
    });

    stockInMovements += 1;
  }

  const verifiedFoundations = await prisma.foundation.findMany({
    where: { status: FoundationStatus.VERIFIED },
    select: { id: true, name: true, slug: true, userId: true },
    orderBy: { createdAt: 'asc' },
  });

  const outboundTemplates = [
    {
      title: 'Entrega a familias en territorio priorizado',
      description:
        'Distribuimos los aportes recibidos de donantes en especie a hogares identificados por la fundacion.',
    },
    {
      title: 'Jornada de entrega comunitaria',
      description:
        'Salida de inventario para apoyar la campana activa con productos donados y verificados en bodega.',
    },
    {
      title: 'Entrega institucional de apoyos en especie',
      description:
        'Los productos acopiados fueron entregados a instituciones aliadas que atienden poblacion vulnerable.',
    },
  ];

  const createdPostIds: string[] = [];
  let outboundCount = 0;

  for (const foundation of verifiedFoundations) {
    const foundationSlug = foundation.slug ?? foundation.id.slice(0, 8);
    const foundationItems = await prisma.inventoryItem.findMany({
      where: { foundationId: foundation.id, quantityAvailable: { gt: 0 } },
      orderBy: { quantityAvailable: 'desc' },
    });

    if (foundationItems.length === 0) {
      continue;
    }

    const foundationCampaigns = await prisma.campaign.findMany({
      where: {
        foundationId: foundation.id,
        needs: {
          some: {
            donations: {
              some: {
                status: { in: RECEIVED_DONATION_STATUSES },
              },
            },
          },
        },
      },
      select: { id: true, title: true, foundationBranchId: true },
      orderBy: { createdAt: 'asc' },
    });

    if (foundationCampaigns.length === 0) {
      continue;
    }

    const outboundsForFoundation = Math.min(2, foundationCampaigns.length);

    for (let index = 0; index < outboundsForFoundation; index += 1) {
      const campaign = foundationCampaigns[index % foundationCampaigns.length];
      if (!campaign) {
        continue;
      }

      const refreshedItems = await prisma.inventoryItem.findMany({
        where: { foundationId: foundation.id, quantityAvailable: { gt: 0 } },
        orderBy: { quantityAvailable: 'desc' },
        take: 2,
      });

      if (refreshedItems.length === 0) {
        break;
      }

      const lines: OutboundLineSeed[] = refreshedItems
        .map((item) => {
          const quantity = Math.max(1, Math.min(item.quantityAvailable, Math.floor(item.quantityAvailable * 0.35)));
          return {
            inventoryItemId: item.id,
            quantity,
            name: item.name,
            unit: item.unit,
          };
        })
        .filter((line) => line.quantity > 0);

      if (lines.length === 0) {
        continue;
      }

      const template = outboundTemplates[(outboundCount + index) % outboundTemplates.length];
      if (!template) {
        continue;
      }

      const eventDate = daysFromNow(-20 - outboundCount * 12 - index * 5);
      const postImages = [
        SEED_POST_IMAGE_URLS[outboundCount % SEED_POST_IMAGE_URLS.length],
        SEED_POST_IMAGE_URLS[(outboundCount + 1) % SEED_POST_IMAGE_URLS.length],
        SEED_POST_IMAGE_URLS[(outboundCount + 2) % SEED_POST_IMAGE_URLS.length],
      ];

      const postId = await createOutboundWithPostAt({
        foundationId: foundation.id,
        campaignId: campaign.id,
        foundationBranchId: campaign.foundationBranchId,
        title: `${template.title} — ${campaign.title}`,
        description: template.description,
        observations:
          SEED_OUTBOUND_OBSERVATIONS[outboundCount % SEED_OUTBOUND_OBSERVATIONS.length],
        slug: buildSeedPostSlug(foundationSlug, template.title, outboundCount + 1),
        lines,
        imageUrls: postImages,
        createdById: foundation.userId,
        eventDate,
      });

      createdPostIds.push(postId);
      outboundCount += 1;
    }

    console.log(`[SEED] Inventario demo listo: ${foundation.name}`);
  }

  if (createdPostIds.length > 0 && donors.length > 0) {
    const commentBodies = [
      'Gracias por compartir el impacto de esta entrega.',
      'Excelente trabajo de la fundacion con las familias.',
      'Me alegra ver que la donacion llego a quienes lo necesitaban.',
    ];

    const reactionTypes: PostReactionType[] = [
      PostReactionType.LIKE,
      PostReactionType.LOVE,
      PostReactionType.PROUD,
    ];

    for (let postIndex = 0; postIndex < createdPostIds.length; postIndex += 1) {
      const postId = createdPostIds[postIndex];
      if (!postId) {
        continue;
      }

      const donorA = donors[postIndex % donors.length];
      const donorB = donors[(postIndex + 1) % donors.length];

      if (donorA) {
        await prisma.postReaction.create({
          data: {
            postId,
            userId: donorA.id,
            type: reactionTypes[postIndex % reactionTypes.length] ?? PostReactionType.LIKE,
          },
        });
      }

      if (donorB && donorB.id !== donorA?.id) {
        await prisma.postComment.create({
          data: {
            postId,
            userId: donorB.id,
            body: commentBodies[postIndex % commentBodies.length] ?? commentBodies[0]!,
          },
        });
      }
    }
  }

  console.log(
    `[SEED] Inventario: ${stockInMovements} entradas desde donaciones recibidas; ${outboundCount} salidas con publicacion.`,
  );
}

/**
 * Entrada: Ninguna.
 * Proceso: Vacia la BD y carga unicamente el dataset del seed.
 * Salida: No retorna valor al completar el seed.
 */
async function main(): Promise<void> {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminPassword || adminPassword.length < 8) {
    throw new Error(
      'SEED_ADMIN_PASSWORD debe estar definida en .env y tener al menos 8 caracteres.',
    );
  }

  await assertMigrationsApplied();
  await resetDatabase();

  const adminPasswordHash = await hashPassword(adminPassword);
  const admins: User[] = [];

  for (const admin of ADMIN_USERS) {
    const user = await createAdmin(admin, adminPasswordHash);
    admins.push(user);
    console.log(`[SEED] Admin listo: ${user.fullName} <${user.email}>`);
  }

  const demoPassword =
    process.env.SEED_DEMO_PASSWORD?.trim() || DEMO_USERS_DEFAULT_PASSWORD;

  if (demoPassword.length < 8) {
    throw new Error('SEED_DEMO_PASSWORD debe tener al menos 8 caracteres cuando se define.');
  }

  const demoPasswordHash = await hashPassword(demoPassword);
  const verifierId = admins[0]?.id;

  if (!verifierId) {
    throw new Error('No hay administradores para verificar fundaciones demo.');
  }

  const allDonorSeeds = [...DONOR_USERS, ...HISTORICAL_DONOR_USERS];
  const donors = await seedDonors(allDonorSeeds, demoPasswordHash);
  const allNeedIds: string[] = [];

  for (const foundationSeed of FOUNDATION_SEEDS) {
    const needIds = await seedFoundation(foundationSeed, demoPasswordHash, verifierId);
    allNeedIds.push(...needIds);
  }

  await seedHistoricalDonations(donors, allNeedIds, verifierId);
  await seedDonationMessages(donors);
  await seedDemoNotifications(donors, admins);
  await seedInventoryFromDonations(donors);

  console.log('[SEED] Dataset completo listo (solo seeders).');
  console.log('[SEED] Historial simulado: ~6 meses para reportes administrativos.');
  console.log('[SEED] Password admins: SEED_ADMIN_PASSWORD');
  console.log(`[SEED] Password donantes/fundaciones demo: ${demoPassword}`);
}

main()
  .catch((error: unknown) => {
    console.error('[SEED] Error al sembrar datos:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
