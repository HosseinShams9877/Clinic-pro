import type { Locale } from "@/core/i18n/locales";

export type LocalizedText = Record<Locale, string>;

export interface PublicDoctor {
  id: string;
  slug: string;
  cat: string;
  photo: string;
  founder: boolean;
  name: LocalizedText;
  spec: LocalizedText;
  url: string;
}

export interface PublicDoctorCategory {
  fa: string;
  en: string;
  ar: string;
}

export interface DoctorProfileService {
  i: string;
  fa: string[];
  en: string[];
  ar: string[];
}

export interface DoctorProfileCredential extends LocalizedText {}

export interface PublicDoctorProfile {
  hero: string;
  heroPos?: string;
  floor: LocalizedText;
  tag: LocalizedText;
  lead: LocalizedText;
  about: LocalizedText;
  services: DoctorProfileService[];
  creds: DoctorProfileCredential[];
}

export interface GuideCategory {
  id: string;
  n: LocalizedText;
}

export interface GuideLocalizedItem extends LocalizedText {}

export interface GuideSurgery {
  id: string;
  cat: string;
  img: string;
  hero: string;
  n: LocalizedText;
  d: LocalizedText;
  pre: GuideLocalizedItem[];
  post: GuideLocalizedItem[];
}

export interface GuideTip {
  i: string;
  n: LocalizedText;
  d: LocalizedText;
}

export interface GuideCommonContent {
  pre: GuideTip[];
  post: GuideTip[];
  warn: GuideLocalizedItem[];
  checklist: GuideLocalizedItem[];
  videos: unknown;
  audio: GuideLocalizedItem[];
}
