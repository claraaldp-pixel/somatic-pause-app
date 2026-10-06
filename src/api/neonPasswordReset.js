const DEFAULT_TIMEOUT_MS = 12_000;

export async function resetPasswordWithToken({
  newPassword,
  token,
  authUrl = import.meta.env.VITE_NEON_AUTH_URL,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl = globalThis.fetch,
}) {
  if (!authUrl) throw new Error('Neon Auth is not configured.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(`${authUrl.replace(/\/$/, '')}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword, token }),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = result.message || result.error || 'Unable to reset your password.';
      throw new Error(message);
    }

    return result;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('The request took too long. Your password may already be saved—return to sign in and try it.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
