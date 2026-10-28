export interface CategoryMeta {
  /** Como se muestra en el help. */
  label: string;
  emoji?: string;
  description?: string;
}

/** La categoria que se asigna a un comando que esta suelto, sin subcarpeta. */
export const DEFAULT_CATEGORY = "general";

/**
 * Orden y presentacion en el help. El orden de las claves ES el orden
 * de los fields del embed. Una carpeta que no este aqui no se rompe:
 * se muestra al final con su nombre en mayusculas.
 */
export const CATEGORIES: Record<string, CategoryMeta> = {
  general: { label: "GENERAL", emoji: "📋" },
  fun: { label: "FUN", emoji: "🎉" },
  moderation: { label: "MODERATION", emoji: "🛡️" },
  utility: { label: "UTILITY", emoji: "🔧" },
  music: { label: "MUSIC", emoji: "🎵" },
  canvas: {label: "CANVAS_UMB", emoji: "📚"}
};

/** Si una categoria esta vacia, la escondemos del help. Pon false para mostrarla con "—". */
export const HIDE_EMPTY_CATEGORIES = true;

export function categoryLabel(key: string): string {
  return CATEGORIES[key]?.label ?? key.toUpperCase();
}

export function categoryEmoji(key: string): string {
  const emoji = CATEGORIES[key]?.emoji;
  return emoji ? `${emoji} ` : "";
}

/** Orden definido en CATEGORIES primero; lo que no este, alfabetico al final. */
export function sortCategories(keys: Iterable<string>): string[] {
  const known = Object.keys(CATEGORIES);

  return [...keys].sort((a, b) => {
    const ia = known.indexOf(a);
    const ib = known.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
}