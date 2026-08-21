const SCHEDULING_SERVICE_URL =
  process.env.SCHEDULING_SERVICE_URL ||
  "http://localhost:8002";

export async function requestBestSchedulingSlot(
  payload: unknown
) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 5000);

  try {
    const response = await fetch(
      `${SCHEDULING_SERVICE_URL}/recommend`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),

        signal: controller.signal,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message ||
          `Scheduling service error (${response.status})`
      );
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}