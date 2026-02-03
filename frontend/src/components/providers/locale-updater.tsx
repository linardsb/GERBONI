"use client";

import { useEffect } from "react";

interface LocaleUpdaterProps {
  locale: string;
}

export function LocaleUpdater({ locale }: LocaleUpdaterProps) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
