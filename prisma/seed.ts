import bcrypt from 'bcrypt';
import {
  DonationStatus,
  FoundationStatus,
  PrismaClient,
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
  LEGACY_SEED_EMAILS,
  type SeedAdminUser,
  type SeedFoundationInput,
} from './seed-data.js';

dotenv.config();

const SALT_ROUNDS = 12;
const prisma = new PrismaClient();

/**
 * Entrada: plainText: contrasena en texto plano.
 * Proceso: Genera hash bcrypt con las mismas rondas de sal que autenticacion.
 * Salida: Retorna el hash listo para persistir.
 */
async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

/**
 * Entrada: days: desplazamiento en dias respecto a hoy.
 * Proceso: Calcula una fecha UTC a medianoche desplazada.
 * Salida: Retorna Date resultante.
 */
function daysFromNow(days: number): Date {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

/**
 * Entrada: Ninguna.
 * Proceso: Elimina cuentas residuales del seed antiguo (cascade de fundaciones asociadas).
 * Salida: No retorna valor.
 */
async function removeLegacySeedUsers(): Promise<void> {
  const result = await prisma.user.deleteMany({
    where: {
      email: { in: LEGACY_SEED_EMAILS },
    },
  });

  if (result.count > 0) {
    console.log(`[SEED] Cuentas legacy eliminadas: ${result.count}`);
  }
}

/**
 * Entrada: admin: datos del administrador; passwordHash: hash de contrasena.
 * Proceso: Crea o actualiza un usuario ADMIN por email (idempotente).
 * Salida: Retorna el usuario persistido.
 */
async function upsertAdmin(admin: SeedAdminUser, passwordHash: string): Promise<User> {
  return prisma.user.upsert({
    where: { email: admin.email },
    update: {
      fullName: admin.fullName,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      phone: admin.phone ?? null,
      city: admin.city ?? null,
      department: admin.department ?? null,
      bio: admin.bio ?? null,
    },
    create: {
      email: admin.email,
      fullName: admin.fullName,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      phone: admin.phone ?? null,
      city: admin.city ?? null,
      department: admin.department ?? null,
      bio: admin.bio ?? null,
    },
  });
}

/**
 * Entrada: passwordHash: hash compartido de contrasena demo.
 * Proceso: Crea o actualiza donantes demo con perfil completo.
 * Salida: Retorna la lista de usuarios donantes.
 */
async function seedDonors(passwordHash: string): Promise<User[]> {
  const donors: User[] = [];

  for (const donor of DONOR_USERS) {
    const user = await prisma.user.upsert({
      where: { email: donor.email },
      update: {
        fullName: donor.fullName,
        passwordHash,
        role: UserRole.USER,
        isActive: true,
        phone: donor.phone,
        city: donor.city,
        department: donor.department,
        bio: donor.bio,
      },
      create: {
        email: donor.email,
        fullName: donor.fullName,
        passwordHash,
        role: UserRole.USER,
        isActive: true,
        phone: donor.phone,
        city: donor.city,
        department: donor.department,
        bio: donor.bio,
      },
    });
    donors.push(user);
    console.log(`[SEED] Donante listo: ${user.fullName} <${user.email}>`);
  }

  return donors;
}

/**
 * Entrada: foundationId: id de fundacion.
 * Proceso: Upsert de documentos legales placeholder requeridos para operar.
 * Salida: No retorna valor.
 */
async function seedFoundationDocuments(foundationId: string): Promise<void> {
  for (const type of DOCUMENT_TYPES) {
    await prisma.foundationDocument.upsert({
      where: {
        foundationId_type: {
          foundationId,
          type,
        },
      },
      update: {
        fileName: `${type.toLowerCase()}.pdf`,
        mimeType: 'application/pdf',
        fileSize: 120_000,
        fileUrl: `https://example.com/seed-docs/${foundationId}/${type.toLowerCase()}.pdf`,
      },
      create: {
        foundationId,
        type,
        fileName: `${type.toLowerCase()}.pdf`,
        mimeType: 'application/pdf',
        fileSize: 120_000,
        fileUrl: `https://example.com/seed-docs/${foundationId}/${type.toLowerCase()}.pdf`,
      },
    });
  }
}

/**
 * Entrada: foundationId: id; links: redes sociales.
 * Proceso: Upsert de enlaces sociales por red.
 * Salida: No retorna valor.
 */
async function seedSocialLinks(
  foundationId: string,
  links: SeedFoundationInput['socialLinks'],
): Promise<void> {
  for (const link of links) {
    await prisma.foundationSocialLink.upsert({
      where: {
        foundationId_network: {
          foundationId,
          network: link.network,
        },
      },
      update: { url: link.url },
      create: {
        foundationId,
        network: link.network,
        url: link.url,
      },
    });
  }
}

/**
 * Entrada: foundationId: id; campaigns: campanas demo; nowVerifierId: admin verificador.
 * Proceso: Upsert de campanas y needs por titulo dentro de la fundacion.
 * Salida: Retorna ids de needs creadas/actualizadas para donaciones demo.
 */
async function seedCampaigns(
  foundationId: string,
  campaigns: SeedFoundationInput['campaigns'],
): Promise<string[]> {
  const needIds: string[] = [];

  for (const campaignSeed of campaigns) {
    const existing = await prisma.campaign.findFirst({
      where: {
        foundationId,
        title: campaignSeed.title,
        deletedAt: null,
      },
    });

    const campaignData = {
      title: campaignSeed.title,
      description: campaignSeed.description,
      imageUrl: campaignSeed.imageUrl,
      status: campaignSeed.status,
      startDate: daysFromNow(campaignSeed.startOffsetDays),
      endDate: daysFromNow(campaignSeed.endOffsetDays),
      deliveryAddress: campaignSeed.deliveryAddress,
      deliveryLatitude: campaignSeed.deliveryLatitude,
      deliveryLongitude: campaignSeed.deliveryLongitude,
    };

    const campaign = existing
      ? await prisma.campaign.update({
          where: { id: existing.id },
          data: campaignData,
        })
      : await prisma.campaign.create({
          data: {
            foundationId,
            ...campaignData,
          },
        });

    for (const needSeed of campaignSeed.needs) {
      const existingNeed = await prisma.need.findFirst({
        where: {
          campaignId: campaign.id,
          name: needSeed.name,
          deletedAt: null,
        },
      });

      const need = existingNeed
        ? await prisma.need.update({
            where: { id: existingNeed.id },
            data: {
              description: needSeed.description,
              quantity: needSeed.quantity,
              unit: needSeed.unit,
              priority: needSeed.priority,
              fulfilledQuantity: needSeed.fulfilledQuantity,
            },
          })
        : await prisma.need.create({
            data: {
              campaignId: campaign.id,
              name: needSeed.name,
              description: needSeed.description,
              quantity: needSeed.quantity,
              unit: needSeed.unit,
              priority: needSeed.priority,
              fulfilledQuantity: needSeed.fulfilledQuantity,
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
 * Proceso: Upsert de usuario FOUNDATION, perfil, documentos, redes y campanas.
 * Salida: Retorna ids de needs de la fundacion.
 */
async function seedFoundation(
  seed: SeedFoundationInput,
  passwordHash: string,
  verifierId: string,
): Promise<string[]> {
  const account = await prisma.user.upsert({
    where: { email: seed.accountEmail },
    update: {
      fullName: seed.accountFullName,
      passwordHash,
      role: UserRole.FOUNDATION,
      isActive: true,
      phone: seed.accountPhone,
      city: seed.city,
      department: seed.department,
      bio: `Cuenta institucional de ${seed.name}.`,
    },
    create: {
      email: seed.accountEmail,
      fullName: seed.accountFullName,
      passwordHash,
      role: UserRole.FOUNDATION,
      isActive: true,
      phone: seed.accountPhone,
      city: seed.city,
      department: seed.department,
      bio: `Cuenta institucional de ${seed.name}.`,
    },
  });

  const foundationData = {
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
    verifiedAt: seed.status === FoundationStatus.VERIFIED ? new Date() : null,
    verifiedById: seed.status === FoundationStatus.VERIFIED ? verifierId : null,
    rejectedAt: null,
    suspendedAt: null,
    rejectionReason: null,
    adminNotes:
      seed.status === FoundationStatus.PENDING
        ? 'Fundacion demo pendiente de revision administrativa.'
        : 'Fundacion demo verificada por seed.',
    deletedAt: null,
  };

  const existingByUser = await prisma.foundation.findUnique({
    where: { userId: account.id },
  });

  const foundation = existingByUser
    ? await prisma.foundation.update({
        where: { id: existingByUser.id },
        data: foundationData,
      })
    : await prisma.foundation.create({
        data: {
          userId: account.id,
          ...foundationData,
        },
      });

  await seedFoundationDocuments(foundation.id);
  await seedSocialLinks(foundation.id, seed.socialLinks);
  const needIds = await seedCampaigns(foundation.id, seed.campaigns);

  console.log(`[SEED] Fundacion lista: ${foundation.name} (${foundation.status})`);
  return needIds;
}

/**
 * Entrada: donors: usuarios donantes; needIds: necesidades publicadas; changerId: admin.
 * Proceso: Crea donaciones demo si aun no existen para el par donante-need.
 * Salida: No retorna valor.
 */
async function seedSampleDonations(
  donors: User[],
  needIds: string[],
  changerId: string,
): Promise<void> {
  if (donors.length === 0 || needIds.length === 0) {
    return;
  }

  const samples = Math.min(12, needIds.length * 2);
  let created = 0;

  for (let index = 0; index < samples; index += 1) {
    const donor = donors[index % donors.length];
    const needId = needIds[index % needIds.length];
    const statuses = [
      DonationStatus.COMMITTED,
      DonationStatus.IN_TRANSIT,
      DonationStatus.DELIVERED,
      DonationStatus.CONFIRMED,
    ];
    const status = statuses[index % statuses.length];

    const existing = await prisma.donation.findFirst({
      where: {
        needId,
        donorUserId: donor.id,
      },
    });

    if (existing) {
      continue;
    }

    const donation = await prisma.donation.create({
      data: {
        needId,
        donorUserId: donor.id,
        status,
        quantity: 2 + (index % 5),
        notes: 'Donacion de demostracion generada por seed.',
        estimatedDeliveryAt: daysFromNow(3 + (index % 7)),
      },
    });

    await prisma.donationStatusHistory.create({
      data: {
        donationId: donation.id,
        fromStatus: null,
        toStatus: status,
        changedById: changerId,
        note: 'Estado inicial de donacion demo.',
      },
    });

    created += 1;
  }

  console.log(`[SEED] Donaciones demo creadas: ${created}`);
}

/**
 * Entrada: Ninguna.
 * Proceso: Siembra administradores, limpia cuentas legacy y carga el dataset demo completo.
 * Salida: No retorna valor al completar el seed.
 */
async function main(): Promise<void> {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminPassword || adminPassword.length < 8) {
    throw new Error(
      'SEED_ADMIN_PASSWORD debe estar definida en .env y tener al menos 8 caracteres.',
    );
  }

  await removeLegacySeedUsers();

  const adminPasswordHash = await hashPassword(adminPassword);
  const admins: User[] = [];

  for (const admin of ADMIN_USERS) {
    const user = await upsertAdmin(admin, adminPasswordHash);
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

  const donors = await seedDonors(demoPasswordHash);
  const allNeedIds: string[] = [];

  for (const foundationSeed of FOUNDATION_SEEDS) {
    const needIds = await seedFoundation(foundationSeed, demoPasswordHash, verifierId);
    allNeedIds.push(...needIds);
  }

  await seedSampleDonations(donors, allNeedIds, verifierId);

  console.log('[SEED] Dataset completo listo.');
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
