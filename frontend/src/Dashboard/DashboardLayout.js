 
import React from "react";
import { Outlet } from "react-router-dom"; 
import Sidebar from "../component/Sidebar";

const DashboardLayout = () => {
    return (
        <div>
            <Sidebar />

            <main
                style={{
                    marginLeft: "250px",
                    minHeight: "100vh",
                    padding: "30px",
                    backgroundColor: "#f5f6fa",
                }}
            >
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
 
