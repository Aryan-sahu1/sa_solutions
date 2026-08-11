import React, { useEffect, useState } from 'react'
import axios from "axios";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    const cachedToken = sessionStorage.getItem("verifiedToken");
    const hasCachedVerification = Boolean(token && cachedToken === token);
    const [isChecking, setIsChecking] = useState(!hasCachedVerification);
    const [isVerified, setIsVerified] = useState(hasCachedVerification);

    useEffect(() => {
        const verifyCompany = async () => {
            if (!token) {
                sessionStorage.removeItem("verifiedToken");
                setIsChecking(false);
                return;
            }

            if (sessionStorage.getItem("verifiedToken") === token) {
                setIsVerified(true);
                setIsChecking(false);
                return;
            }

            try {
                await axios.get("http://localhost:4000/api/auth/verify-company", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                sessionStorage.setItem("verifiedToken", token);
                setIsVerified(true);
            } catch (error) {
                localStorage.removeItem("token");
                sessionStorage.removeItem("verifiedToken");
                setIsVerified(false);
            } finally {
                setIsChecking(false);
            }
        };

        verifyCompany();
    }, [token]);

    if (isChecking) {
        return <div className="p-4 text-center">Checking login...</div>;
    }

    if (!token || !isVerified) {
        return <Navigate to="/login" replace />
    }

    return children
}

export default ProtectedRoute
