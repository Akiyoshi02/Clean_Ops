export async function postJson<T>(url: string, body: unknown) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        (data as { error?: string } | null)?.error ??
        `Request failed (${response.status})`;
      return { data: null, error: new Error(message) };
    }
    return { data: data as T, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return { data: null, error: new Error(message) };
  }
}

export async function getJson<T>(url: string) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        (data as { error?: string } | null)?.error ??
        `Request failed (${response.status})`;
      return { data: null, error: new Error(message) };
    }
    return { data: data as T, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return { data: null, error: new Error(message) };
  }
}

export async function patchJson<T>(url: string, body: unknown) {
  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        (data as { error?: string } | null)?.error ??
        `Request failed (${response.status})`;
      return { data: null, error: new Error(message) };
    }
    return { data: data as T, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return { data: null, error: new Error(message) };
  }
}

export async function deleteJson<T>(url: string) {
  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        (data as { error?: string } | null)?.error ??
        `Request failed (${response.status})`;
      return { data: null, error: new Error(message) };
    }
    return { data: data as T, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return { data: null, error: new Error(message) };
  }
}
