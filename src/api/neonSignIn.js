const DEFAULT_TIMEOUT_MS = 12_000;

export async function signInWithEmail({
  authClient,
  email,
  password,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error('Sign in is taking too long. Please try again.')),
      timeoutMs,
    );
  });

  try {
    const result = await Promise.race([
      authClient.signIn.email({ email, password }),
      timeoutPromise,
    ]);

    if (result?.error) {
      throw new Error(result.error.message || 'Unable to sign in.');
    }

    return result?.data;
  } finally {
    clearTimeout(timeout);
  }
}
