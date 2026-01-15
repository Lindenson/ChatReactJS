import contacts from "@/features/chat/rest/contacts.json";
import type { Contact, DomainChatMessage } from "@/features/chat/model/types.ts";

/* ======================
   Fetch contacts excluding self
====================== */
export async function fetchChatContacts(): Promise<Contact[]> {
    return contacts;
}

/* ======================
   Check if myId exists in contacts
====================== */
export async function checkLogin(myName: string): Promise<Contact | null> {
    return contacts.find((contact: Contact) => contact.name === myName) as Contact;
}

/* ======================
   Fetch chat history with a contact
====================== */
export async function fetchChatHistory(
    myId: string,
    chatName: string
): Promise<DomainChatMessage[]> {
    const res = await fetch(`/api/chat/${myId}/${chatName}`);
    if (!res.ok) throw new Error("Failed to load chat");
    return res.json();
}

/* ======================
   Delete chat history with a contact
====================== */
export async function deleteChatHistory(
    myId: string,
    chatName: string
): Promise<void> {
    const res = await fetch(`/api/chat/${myId}/${chatName}`, {
        method: "DELETE",
    });

    if (!res.ok && res.status !== 204) {
        throw new Error("Failed to delete chat");
    }
}
