import React, { useEffect, useState } from 'react'
import axios from "axios";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const [isChecking, setIsChecking] = useState(true);
    const [isVerified, setIsVerified] = useState(false);
    const token = localStorage.getItem("token");
    const location = useLocation();

    useEffect(() => {
        const verifyCompany = async () => {
            setIsChecking(true);

            if (!token) {
                setIsChecking(false);
                return;
            }

            try {
                await axios.get("http://localhost:4000/api/auth/verify-company", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setIsVerified(true);
            } catch (error) {
                localStorage.removeItem("token");
                setIsVerified(false);
            } finally {
                setIsChecking(false);
            }
        };

        verifyCompany();
    }, [token, location.pathname]);

    if (isChecking) {
        return <div className="p-4 text-center">Checking login...</div>;
    }

    if (!token || !isVerified) {
        return <Navigate to="/login" replace />
    }

    return children
}

export default ProtectedRoute
