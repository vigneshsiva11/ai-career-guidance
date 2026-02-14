"use client";

import { useEffect, useState } from "react";
import {
  getStoredLanguage,
  setStoredLanguage,
  type SupportedLanguage,
} from "@/lib/utils";

export function useLanguage(): SupportedLanguage {
  const [lang, setLang] = useState<SupportedLanguage>("en");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setLang(getStoredLanguage());

    const handler = (e: Event) => {
      // @ts-ignore
      const next = e?.detail?.lang as SupportedLanguage | undefined;
      setLang(next || getStoredLanguage());
    };
    window.addEventListener("classless:language-changed", handler);
    return () =>
      window.removeEventListener("classless:language-changed", handler);
  }, []);

  // Always return 'en' during SSR to prevent hydration mismatch
  return isClient ? lang : "en";
}

export { setStoredLanguage };
