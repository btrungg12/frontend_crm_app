import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "personal_crm_token";

let memoryToken: string | null = null;

async function canUseSecureStore() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

function localStorageSafe() {
  try {
    return typeof globalThis !== "undefined" && "localStorage" in globalThis ? globalThis.localStorage : null;
  } catch {
    return null;
  }
}

export async function saveToken(token: string) {
  memoryToken = token;

  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return;
  }

  localStorageSafe()?.setItem(TOKEN_KEY, token);
}

export async function getToken() {
  if (memoryToken) return memoryToken;

  if (await canUseSecureStore()) {
    memoryToken = await SecureStore.getItemAsync(TOKEN_KEY);
    return memoryToken;
  }

  memoryToken = localStorageSafe()?.getItem(TOKEN_KEY) ?? null;
  return memoryToken;
}

export async function removeToken() {
  memoryToken = null;

  if (await canUseSecureStore()) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return;
  }

  localStorageSafe()?.removeItem(TOKEN_KEY);
}
