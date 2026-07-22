import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { del, get, put } from '@vercel/blob';
import { isVercelRuntime, uploadConfig } from '../../config/env.config.js';
import { AppError } from '../errors/app.error.js';
import { mapUnknownError } from '../errors/map-unknown-error.js';
import { API_MESSAGES } from '../constants/messages.constants.js';

const PUBLIC_UPLOAD_PREFIX = `${uploadConfig.publicBaseUrl}/uploads/`;
const BLOB_HOST_MARKER = 'blob.vercel-storage.com';

export type StoredFileResult = {
  relativePath: string;
  storageKey: string;
  publicUrl: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
};

export type DocumentFilePayload =
  | { kind: 'path'; absolutePath: string; fileName: string; mimeType: string }
  | { kind: 'stream'; stream: Readable; fileName: string; mimeType: string };

/**
 * Entrada: Ninguna.
 * Proceso: Indica si hay token de Vercel Blob para usar almacenamiento persistente.
 * Salida: Retorna true cuando Blob esta habilitado.
 */
export function isBlobStorageEnabled(): boolean {
  return Boolean(uploadConfig.blobReadWriteToken);
}

/**
 * Entrada: value: referencia de almacenamiento o URL.
 * Proceso: Detecta si la referencia apunta a Vercel Blob.
 * Salida: Retorna true si es una URL de Blob.
 */
function isBlobUrl(value: string): boolean {
  return value.includes(BLOB_HOST_MARKER);
}

/**
 * Entrada: relativePath: ruta relativa dentro del directorio de uploads publicos.
 * Proceso: Construye la URL publica absoluta del archivo almacenado en disco local.
 * Salida: Retorna la URL HTTP del archivo.
 */
export function buildPublicUploadUrl(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  return `${PUBLIC_UPLOAD_PREFIX}${normalized}`;
}

/**
 * Entrada: foundationId: id fundacion; subfolder: destino; file: archivo multer.
 * Proceso: Persiste en Vercel Blob si hay token; si no, en disco local.
 * Salida: Retorna metadatos y clave/URL de almacenamiento.
 */
export async function saveFoundationFile(
  foundationId: string,
  subfolder: 'logo' | 'documents',
  file: Express.Multer.File,
): Promise<StoredFileResult> {
  try {
    const extension = path.extname(file.originalname) || inferExtension(file.mimetype);
    const safeName = `${randomUUID()}${extension}`;
    const isDocument = subfolder === 'documents';
    const pathname = `foundations/${foundationId}/${subfolder}/${safeName}`;

    if (isVercelRuntime && !isBlobStorageEnabled()) {
      throw new AppError(API_MESSAGES.UPLOAD_STORAGE_UNAVAILABLE, 503);
    }

    if (isBlobStorageEnabled()) {
      const blob = await put(pathname, file.buffer, {
        access: uploadConfig.blobAccess,
        contentType: file.mimetype,
        token: uploadConfig.blobReadWriteToken,
        addRandomSuffix: false,
      });

      return {
        relativePath: pathname,
        storageKey: blob.url,
        publicUrl: isDocument ? null : blob.url,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
      };
    }

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
  } catch (error) {
    throw mapUnknownError(error);
  }
}

/**
 * Entrada: storageKey: clave relativa o URL publica/blob previamente emitida.
 * Proceso: Resuelve la ruta absoluta en disco del archivo local (no aplica a Blob).
 * Salida: Retorna la ruta absoluta o null si no es almacenamiento local valido.
 */
export function resolveStoragePath(storageKey: string): string | null {
  if (isBlobUrl(storageKey)) {
    return null;
  }

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
 * Entrada: storageKey: clave relativa o URL; fileName/mimeType del documento.
 * Proceso: Obtiene el archivo desde Blob o disco para descarga autenticada.
 * Salida: Retorna payload listo para enviar por HTTP.
 */
export async function resolveDocumentFile(params: {
  storageKey: string;
  fileName: string;
  mimeType: string;
}): Promise<DocumentFilePayload> {
  const { storageKey, fileName, mimeType } = params;

  if (isBlobStorageEnabled() && isBlobUrl(storageKey)) {
    const result = await get(storageKey, {
      access: uploadConfig.blobAccess,
      token: uploadConfig.blobReadWriteToken,
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new AppError(API_MESSAGES.UPLOAD_FILE_NOT_FOUND, 404);
    }

    return {
      kind: 'stream',
      stream: Readable.fromWeb(result.stream as import('node:stream/web').ReadableStream),
      fileName,
      mimeType,
    };
  }

  const absolutePath = resolveStoragePath(storageKey);
  if (!absolutePath) {
    throw new AppError(API_MESSAGES.UPLOAD_FILE_NOT_FOUND, 404);
  }

  try {
    await fs.access(absolutePath);
  } catch {
    throw new AppError(API_MESSAGES.UPLOAD_FILE_NOT_FOUND, 404);
  }

  return {
    kind: 'path',
    absolutePath,
    fileName,
    mimeType,
  };
}

/**
 * Entrada: storageKey: clave relativa o URL publica/blob previamente emitida.
 * Proceso: Elimina el archivo en Blob o en disco local si existe.
 * Salida: Retorna void.
 */
export async function deleteStoredFile(storageKey: string): Promise<void> {
  if (!storageKey) {
    return;
  }

  if (isBlobUrl(storageKey)) {
    if (!isBlobStorageEnabled()) {
      return;
    }
    try {
      await del(storageKey, { token: uploadConfig.blobReadWriteToken });
    } catch {
      return;
    }
    return;
  }

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
