import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../component/Sidebar";

const DashboardLayout = () => {
    return (
        <div>
            <Sidebar />

            <main
                className="dashboard-main"
                style={{
                    minHeight: "100vh",
                    padding: "30px",
                    backgroundColor: "#f5f6fa",
                }}
            >
                <Outlet />
            </main>

            <style>{`
                .dashboard-main {
                    margin-left: 250px;
                }

                @media (max-width: 767.98px) {
                    .dashboard-main {
                        margin-left: 0;
                        padding: 20px;
                    }
                }
            `}</style>
        </div>
    );
};

export default DashboardLayout;