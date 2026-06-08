/**
 * Transforma uma string em um slug legível para URL.
 * Exemplo: "Anjos de Patas (SLZ)" -> "anjos-de-patas-slz"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD") // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9 -]/g, "") // Remove caracteres não alfanuméricos exceto espaços e hífens
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/-+/g, "-") // Remove hífens múltiplos
    .replace(/^-+/, "") // Remove hífens do início
    .replace(/-+$/, ""); // Remove hífens do fim
}
