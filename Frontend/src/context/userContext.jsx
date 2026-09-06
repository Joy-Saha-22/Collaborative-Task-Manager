// import React, { createContext, useState, useEffect } from "react";
// import axiosInstance from "../utils/axiosInstance";
// import { API_PATHS } from "../utils/apiPaths";
// import { connectSocket, disconnectSocket } from "../utils/socket";

// export const UserContext = createContext();

// const UserProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(true);  //new state to track loading

//     useEffect(() => {
//         if (user) return;
//         const accessToken = localStorage.getItem("token");
//         if (!accessToken) {
//             setLoading(false);
//             connectSocket();
//             return;
//         }

//         const fetchUser = async () => {
//             try {
//                 const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
//                 setUser(response.data);
//             } catch (error) {
//                 console.error("User not authenticated", error);
//                 clearUser();
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchUser();
//     }, []);
//     const updateUser = (userData) => {
//         setUser(userData);
//         localStorage.setItem("token", userData.token); //save token
//         setLoading(false);
//     };
//     const clearUser = () => {
//         setUser(null);
//         localStorage.removeItem("token");
//     };
//     return (
//         <UserContext.Provider value={{ user, loading, updateUser, clearUser }}>{children}</UserContext.Provider>
//     );
// }
// export default UserProvider


import React, { createContext, useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import { connectSocket, disconnectSocket } from "../utils/socket";

export const UserContext = createContext();

const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) return;
        const accessToken = localStorage.getItem("token");
        if (!accessToken) {
            setLoading(false);
            return; // no token, no user — nothing to connect
        }

        const fetchUser = async () => {
            try {
                const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
                setUser(response.data);
                connectSocket(); // token is valid and user is confirmed — connect now
            } catch (error) {
                console.error("User not authenticated", error);
                clearUser();
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem("token", userData.token);
        setLoading(false);
        connectSocket(); // fresh login — connect here too
    };

    const clearUser = () => {
        setUser(null);
        localStorage.removeItem("token");
        disconnectSocket(); // logout — tear down the connection
    };

    return (
        <UserContext.Provider value={{ user, loading, updateUser, clearUser }}>{children}</UserContext.Provider>
    );
}
export default UserProvider