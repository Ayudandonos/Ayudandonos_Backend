// Entrada:
// moduleExport: valor importado por defecto desde un paquete CJS/ESM.

// Proceso:
// Normaliza el export default cuando TypeScript resuelve el modulo como namespace (NodeNext/Vercel).

// Salida:
// Retorna la funcion exportada lista para invocar.
export function resolveDefaultImport<Fn extends (...args: never[]) => unknown>(
  moduleExport: unknown,
): Fn {
  if (typeof moduleExport === 'function') {
    return moduleExport as Fn;
  }

  const withDefault = moduleExport as { default?: Fn };

  if (typeof withDefault.default === 'function') {
    return withDefault.default;
  }

  throw new Error('No se pudo resolver el export default del modulo');
}
