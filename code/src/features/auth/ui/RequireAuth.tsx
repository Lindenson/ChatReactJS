import {useSelector} from "react-redux";
import type {RootState} from "@/store/store";
import {Navigate} from "react-router-dom";
import {isNotLogged} from "@/shared/utils/checks.ts";

export function RequireAuth({children}: { children: React.ReactNode }) {
    const {id, initialized} = useSelector((s: RootState) => s.user);

    if (!initialized) {
        return null;
    }

    if (!id || isNotLogged(id)) {
        return <Navigate to="/login" replace/>;
    }

    console.debug("user found", id);
    return <>{children}</>;
}
