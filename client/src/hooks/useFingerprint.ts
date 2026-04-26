import { useEffect, useState } from 'react';

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    `${screen.width}x${screen.height}`,
    `${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    String(navigator.hardwareConcurrency ?? 0),
    String(navigator.maxTouchPoints ?? 0),
  ].join('|');
  return sha256(components);
}

export function useFingerprint(): string | null {
  const [uid, setUid] = useState<string | null>(() => localStorage.getItem('design-journal-uid'));

  useEffect(() => {
    if (uid) return;
    generateFingerprint().then(fp => {
      localStorage.setItem('design-journal-uid', fp);
      setUid(fp);
    });
  }, [uid]);

  return uid;
}
