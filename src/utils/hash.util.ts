import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export const hashUtil = {
  /**
   * Entrada: plainText: texto en claro a hashear.
   * Proceso: Genera un hash bcrypt del texto con el número de rondas de sal configurado.
   * Salida: Retorna el hash generado como cadena de texto.
   */
  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, SALT_ROUNDS);
  },

  /**
   * Entrada: plainText: texto en claro a comparar; hash: hash almacenado previamente.
   * Proceso: Compara el texto en claro contra el hash usando bcrypt.
   * Salida: Retorna true si coinciden, false en caso contrario.
   */
  async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  },
};
