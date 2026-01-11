import contacts from "@/features/chat/lib/contacts.json";

export async function fetchChatContacts(myId) {
  return contacts.filter((contact) => contact.name !== myId);
}

export async function checkChatContacts(myId) {
  return contacts.some((contact) => contact.name === myId);
}

export async function fetchChatHistory(myId, chatName) {
  const res = await fetch(`/api/chat/${myId}/${chatName}`);
  if (!res.ok) throw new Error("Failed to load chat");
  return res.json();
}

export async function sendChatMessage({ from, to, text }) {
  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, text }),
  });

  if (!res.ok) throw new Error("Failed to send message");
}

export async function deleteChatHistory(myId, chatName) {
  const res = await fetch(`/api/chat/${myId}/${chatName}`, {
    method: "DELETE",
  });

  if (!res.ok && res.status !== 204) {
    throw new Error("Failed to delete chat");
  }
}
