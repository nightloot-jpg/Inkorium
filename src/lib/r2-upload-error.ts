export async function readR2FunctionError(error: unknown): Promise<string> {
  const fallback = error instanceof Error ? error.message : 'No se pudo preparar el almacenamiento de media.';
  const context = (error as { context?: Response } | null)?.context;
  if (!(context instanceof Response)) return fallback;
  try {
    const payload = await context.clone().json() as { error?: string; message?: string; code?: string };
    const detail = payload.error || payload.message;
    if (detail) return payload.code ? `${detail} (${payload.code})` : detail;
  } catch {
    try {
      const text = await context.clone().text();
      if (text.trim()) return text.trim();
    } catch { /* keep fallback */ }
  }
  return fallback;
}
