import React from 'react'
import UI_IMG from "../../assets/images/login-img.jpg"
const AuthLayout = ({ children }) => {
    return <div className="flex bg-indigo-300">
        <div className="w-screen h-screen md:w-[50vw] px-12 pt-8 pb-12">
            <h2 className="text-lg font-bold text-[#172554]">Collaborative Task Manager</h2>
            {children}
        </div>
        <div className="hidden md:flex w-[50vw] h-screen items-center justify-center  overflow-hidden">
            <img src={UI_IMG} className="w-full max-w-175 h-screen" />
        </div>
    </div>
}

export default AuthLayout;