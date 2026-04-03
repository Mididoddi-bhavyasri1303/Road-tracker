import en from "./en";
import hi from "./hi";
import te from "./te";
import ta from "./ta";
import kn from "./kn";
import ml from "./ml";
import bn from "./bn";
import mr from "./mr";
import gu from "./gu";
import pa from "./pa";
import or_ from "./or";

export type Language = "en" | "hi" | "te" | "ta" | "kn" | "ml" | "bn" | "mr" | "gu" | "pa" | "or";

export const languageLabels: Record<Language, string> = {
  en: "English",
  hi: "हिन्दी",
  te: "తెలుగు",
  ta: "தமிழ்",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  bn: "বাংলা",
  mr: "मराठी",
  gu: "ગુજરાતી",
  pa: "ਪੰਜਾਬੀ",
  or: "ଓଡ଼ିଆ",
};

const translations: Record<Language, Record<string, string>> = {
  en,
  hi,
  te,
  ta,
  kn,
  ml,
  bn,
  mr,
  gu,
  pa,
  or: or_,
};

export default translations;
