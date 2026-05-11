import { apiRequest } from "./client";

type ContactQuery = {
  search?: string;
  statusId?: string;
};

export async function getContacts(params: ContactQuery = {}) {
  return await apiRequest("/contacts", {
    query: {
      search: params.search,
      statusId: params.statusId
    }
  });
}

export async function getContactById(contactId: string) {
  return await apiRequest(`/contacts/${contactId}`);
}

export async function createContact(payload: Record<string, unknown>) {
  return await apiRequest("/contacts", {
    body: payload,
    method: "POST"
  });
}

export async function quickCreateContact(name: string) {
  return await apiRequest("/contacts/quick", {
    body: { name },
    method: "POST"
  });
}

export async function updateContact(contactId: string, payload: Record<string, unknown>) {
  return await apiRequest(`/contacts/${contactId}`, {
    body: payload,
    method: "PATCH"
  });
}

export async function deleteContact(contactId: string) {
  return await apiRequest(`/contacts/${contactId}`, {
    method: "DELETE"
  });
}

export async function getContactTimeline(contactId: string) {
  return await apiRequest(`/contacts/${contactId}/timeline`);
}

export async function addSpecialDay(contactId: string, payload: Record<string, unknown>) {
  return await apiRequest(`/contacts/${contactId}/special-days`, {
    body: payload,
    method: "POST"
  });
}

export async function updateSpecialDay(contactId: string, specialDayId: string, payload: Record<string, unknown>) {
  return await apiRequest(`/contacts/${contactId}/special-days/${specialDayId}`, {
    body: payload,
    method: "PATCH"
  });
}

export async function deleteSpecialDay(contactId: string, specialDayId: string) {
  return await apiRequest(`/contacts/${contactId}/special-days/${specialDayId}`, {
    method: "DELETE"
  });
}
