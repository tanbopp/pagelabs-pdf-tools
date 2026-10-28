export async function parseApiError(response: Response, defaultMessage: string = "Request failed"): Promise<string> {
  if (response.status === 429) {
    return "You have reached the limit. Please try again in an hour.";
  }
  try {
    const data = await response.json();
    return data.error_message || data.message || defaultMessage;
  } catch {
    return defaultMessage;
  }
}

