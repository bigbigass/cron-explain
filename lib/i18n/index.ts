import en from "./dictionaries/en.json";
import zh from "./dictionaries/zh.json";
import es from "./dictionaries/es.json";
import de from "./dictionaries/de.json";
import fr from "./dictionaries/fr.json";
import ja from "./dictionaries/ja.json";
import pt from "./dictionaries/pt.json";
import type { Locale } from "./config";

export type Dictionary = typeof en;
export type ToolDict = Dictionary["tool"];

export const dictionaries: Record<Locale, Dictionary> = { en, zh, es, de, fr, ja, pt };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
