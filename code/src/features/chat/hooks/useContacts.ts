import {useCallback, useEffect, useState} from "react";
import {fetchChatContacts} from "../rest/chatApi.ts";
import type {Contact} from "@/features/chat/model/types.ts";
import {useSelector} from "react-redux";
import type {RootState} from "@/store/store.ts";
import {isNotLogged} from "@/shared/utils/checks.ts";


export function useContacts() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const myId = useSelector((state: RootState) => state.user.id);

    useEffect(() => {
        let alive = true;
        if (isNotLogged(myId)) return;

        fetchChatContacts()
            .then(data => {
                if (alive) {
                    data = data.filter((contact) => contact.id !== myId);
                    setContacts(data);
                    console.debug("for", myId, "fetchedChatContacts", data)
                }
            })
            .catch(console.error);

        return () => {
            alive = false;
        };
    }, [myId]);


    const getContactById = useCallback(
        (id: string) => {
            console.debug("getContactById ", id, contacts);
            return contacts.find(c => c.id === id) ?? null;
        },
        [contacts]
    );

    const getContactByName = useCallback(
        (name: string)=> {
            console.debug("getContactByName ", name, contacts);
            return contacts.find(c => c.name === name) ?? null;
        },
        [contacts]
    );

    return {contacts, setContacts, getContactById, getContactByName};
}
