import "./App.css";
import {useState} from "react";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Messenger from "@/pages/Messenger";
import LoginPage from "@/pages/LoginPage";
import LogoutPage from "@/pages/LogoutPage";

import {initNotificationSound} from "@/shared/sound/sound.js";
import {LS_NAME} from "@/shared/config/ls.ts";

function App() {
    const [userId, setUserId] = useState(localStorage.getItem(LS_NAME));

    function handleLogin(id: string) {
        localStorage.setItem(LS_NAME, id);
        initNotificationSound();
        setUserId(id);
    }

    function handleLogout() {
        localStorage.removeItem(LS_NAME);
        setUserId("");
    }

    return (
        <BrowserRouter>
            <Routes>
                {!userId && (
                    <Route path="/*" element={<LoginPage onLogin={handleLogin}/>}/>
                )}
                {!!userId && <Route path="/*" element={<Messenger myId={userId}/>}/>}
                {!!userId && (
                    <Route
                        path="/logout"
                        element={<LogoutPage onLogout={handleLogout}/>}
                    />
                )}
            </Routes>
        </BrowserRouter>
    );
}

export default App;
