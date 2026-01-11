import "./App.css";
import {useState} from "react";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Messenger from "../pages/Messenger";
import LoginPage from "../pages/LoginPage";
import LogoutPage from "../pages/LogoutPage";

import {initNotificationSound} from "../share/sound/sound.js";

function App() {
    const [userId, setUserId] = useState(localStorage.getItem("userId"));

    function handleLogin(id: string) {
        localStorage.setItem("userId", id);
        initNotificationSound();
        setUserId(id);
    }

    function handleLogout() {
        localStorage.removeItem("");
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
