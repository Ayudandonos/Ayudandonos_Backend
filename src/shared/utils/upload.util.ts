import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { uploadConfig } from '../../config/env.config.js';

const PUBLIC_UPLOAD_PREFIX = `${uploadConfig.publicBaseUrl}/uploads/`;

/**
 * Entrada: relativePath: ruta relativa dentro del directorio de uploads publicos.
 * Proceso: Construye la URL publica absoluta del archivo almacenado.
 * Salida: Retorna la URL HTTP del archivo.
 */
export function buildPublicUploadUrl(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  return `${PUBLIC_UPLOAD_PREFIX}${normalized}`;
}

/**
 * Entrada: foundationId: identificador de la fundacion; subfolder: carpeta destino; file: archivo subido.
 * Proceso: Persiste el archivo en disco. Logos son publicos; documentos en almacenamiento privado.
 * Salida: Retorna metadatos del archivo guardado y referencia de almacenamiento.
 */
export async function saveFoundationFile(
  foundationId: string,
  subfolder: 'logo' | 'documents',
  file: Express.Multer.File,
): Promise<{
  relativePath: string;
  storageKey: string;
  publicUrl: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
}> {
  const extension = path.extname(file.originalname) || inferExtension(file.mimetype);
  const safeName = `${randomUUID()}${extension}`;
  const isDocument = subfolder === 'documents';
  const relativeDir = isDocument
    ? path.join('private', uploadConfig.foundationsDir, foundationId, subfolder)
    : path.join(uploadConfig.foundationsDir, foundationId, subfolder);
  const absoluteDir = path.join(uploadConfig.rootDir, relativeDir);

  await fs.mkdir(absoluteDir, { recursive: true });

  const relativePath = path.join(relativeDir, safeName).replace(/\\/g, '/');
  const absolutePath = path.join(uploadConfig.rootDir, relativePath);

  await fs.writeFile(absolutePath, file.buffer);

  return {
    relativePath,
    storageKey: relativePath,
    publicUrl: isDocument ? null : buildPublicUploadUrl(relativePath),
    fileName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
  };
}

/**
 * Entrada: storageKey: clave relativa o URL publica previamente emitida.
 * Proceso: Resuelve la ruta absoluta en disco del archivo almacenado.
 * Salida: Retorna la ruta absoluta o null si la referencia no es valida.
 */
export function resolveStoragePath(storageKey: string): string | null {
  if (storageKey.startsWith(PUBLIC_UPLOAD_PREFIX)) {
    const relativePath = storageKey.slice(PUBLIC_UPLOAD_PREFIX.length);
    return path.join(uploadConfig.rootDir, relativePath);
  }

  const normalized = storageKey.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.includes('..')) {
    return null;
  }

  return path.join(uploadConfig.rootDir, normalized);
}

/**
 * Entrada: storageKey: clave relativa o URL publica previamente emitida.
 * Proceso: Elimina el archivo fisico si existe en el directorio de uploads.
 * Salida: Retorna void.
 */
export async function deleteStoredFile(storageKey: string): Promise<void> {
  const absolutePath = resolveStoragePath(storageKey);
  if (!absolutePath) {
    return;
  }

  try {
    await fs.unlink(absolutePath);
  } catch {
    return;
  }
}

/**
 * Entrada: mimeType: tipo MIME del archivo.
 * Proceso: Infiere extension por tipo MIME cuando el nombre original no la incluye.
 * Salida: Retorna extension con punto o cadena vacia.
 */
function inferExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'application/pdf':
      return '.pdf';
    default:
      return '';
  }
}
