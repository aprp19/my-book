"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LibraryHashRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (window.location.hash === "#library") {
      router.replace("/library");
    }
  }, [router]);

  return null;
}
