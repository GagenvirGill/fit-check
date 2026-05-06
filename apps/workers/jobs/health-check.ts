type HealthResponse = {
  uptimeSeconds: number;
};

const REQUEST_TIMEOUT_MS = 8_000;

type Env = {
  API_HEALTH_URL: string;
};

const parseHealthResponse = (payload: unknown): HealthResponse | null => {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const uptimeSeconds = record.uptimeSeconds;
  if (typeof uptimeSeconds !== 'number' || !Number.isFinite(uptimeSeconds) || uptimeSeconds < 0) {
    return null;
  }

  return { uptimeSeconds };
};

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('Request timed out'), timeoutMs);

  try {
    return await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-fit-check-worker': 'health-check',
      },
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

export const healthCheckJob = {
  name: 'health-check',
  description: 'Calls the API health endpoint and validates the response payload.',
  cron: '*/5 * * * *',
  async run(env: Env) {
    if (!env.API_HEALTH_URL) {
      throw new Error('Missing required environment variable: API_HEALTH_URL');
    }

    const response = await fetchWithTimeout(env.API_HEALTH_URL, REQUEST_TIMEOUT_MS);
    if (!response.ok) {
      throw new Error(`Health endpoint returned status ${response.status}`);
    }

    const payload = parseHealthResponse(await response.json());
    if (!payload) {
      throw new Error('Health endpoint response did not match expected contract');
    }

    return {
      url: env.API_HEALTH_URL,
      statusCode: response.status,
      uptimeSeconds: payload.uptimeSeconds,
    };
  },
};
