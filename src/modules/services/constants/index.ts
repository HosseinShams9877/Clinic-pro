/**
 * constants/index.ts — static, non-translatable facts of the services catalog.
 *
 * Group membership and display order come verbatim from services-data.js:
 *   ORDER = { surg: ["gen","plastic","ortho","uro","eye","ent","gyn"],
 *             med:  ["aes","anes","endo"] }
 * ("order as requested by the client", comment in the reference itself).
 *
 * The floors the reference actually uses (services.js FL map): -1, 0, 2, 3.
 * Labels for these floors are translatable and live in the i18n messages
 * (floor.*), not here.
 */

import type { Locale } from "@/core/i18n/locales";
import type { MessageKey } from "@/modules/i18n/messages";

/** Surgical group first, then medical — the reference's client-requested order. */
export const SERVICE_GROUP_ORDER = {
  surg: ["gen", "plastic", "ortho", "uro", "eye", "ent", "gyn"],
  med: ["aes", "anes", "endo"],
} as const satisfies Record<"surg" | "med", readonly string[]>;

/** All category ids in display order (surgical block, then medical block). */
export const SERVICE_CATEGORY_ORDER: readonly string[] = [
  ...SERVICE_GROUP_ORDER.surg,
  ...SERVICE_GROUP_ORDER.med,
];

/** Group labels are translatable — key lookup, not a hardcoded string. */
export const SERVICE_GROUP_MESSAGE_KEYS: Readonly<Record<"surg" | "med", MessageKey>> = {
  surg: "sg.surg",
  med: "sg.med",
};
export const SERVICE_GROUP_SUBTITLE_KEYS: Readonly<Record<"surg" | "med", MessageKey>> = {
  surg: "sg.surgS",
  med: "sg.medS",
};

/** The reference's floors → the i18n key that labels them (services.js FL). */
const FLOOR_MESSAGE_KEYS: Readonly<Record<number, MessageKey>> = {
  [-1]: "floor.basm",
  0: "floor.ground",
  2: "floor.second",
  3: "floor.third",
};

/** Floors that actually occur in the catalog, in the reference's FL order. */
export const SERVICE_FLOORS: readonly number[] = [-1, 0, 2, 3];

export function floorMessageKey(floor: number): MessageKey | undefined {
  return FLOOR_MESSAGE_KEYS[floor];
}

/** Locale guard kept local — avoids a circular import with core/i18n. */
export type { Locale };
