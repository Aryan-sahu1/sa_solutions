import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API_BASE_URL = "http://localhost:4000/api";
const TOKEN_KEY = "token";
const VERIFIED_TOKEN_KEY = "verifiedToken";

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
    const [customer, setCustomer] = useState(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const clearAuth = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(VERIFIED_TOKEN_KEY);
        setToken(null);
        setCustomer(null);
    }, []);

    const verifyCustomer = useCallback(
        async (tokenToVerify) => {
            const currentToken = tokenToVerify || localStorage.getItem(TOKEN_KEY);

            if (!currentToken) {
                clearAuth();
                return false;
            }

            try {
                const response = await axios.get(
                    `${API_BASE_URL}/customers/verify-customer`,
                    {
                        headers: {
                            Authorization: `Bearer ${currentToken}`,
                        },
                    }
                );

                sessionStorage.setItem(VERIFIED_TOKEN_KEY, currentToken);
                setToken(currentToken);
                setCustomer(response.data?.data || null);

                return true;
            } catch (error) {
                clearAuth();
                return false;
            }
        },
        [clearAuth]
    );

    const login = useCallback(
        async (credentials) => {
            const response = await axios.post(
                `${API_BASE_URL}/customers/customer-login`,
                credentials,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const nextToken = response.data?.token;

            if (!nextToken) {
                throw new Error("Token not received from server");
            }

            localStorage.setItem(TOKEN_KEY, nextToken);
            setToken(nextToken);

            const verified = await verifyCustomer(nextToken);

            if (!verified) {
                throw new Error("Unable to verify customer");
            }

            return response.data;
        },
        [verifyCustomer]
    );

    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            const savedToken = localStorage.getItem(TOKEN_KEY);

            if (!savedToken) {
                clearAuth();
                if (isMounted) {
                    setIsCheckingAuth(false);
                }
                return;
            }

            await verifyCustomer(savedToken);

            if (isMounted) {
                setIsCheckingAuth(false);
            }
        };

        checkAuth();

        return () => {
            isMounted = false;
        };
    }, [clearAuth, verifyCustomer]);

    const authHeaders = useMemo(() => {
        if (!token) {
            return {};
        }

        return {
            Authorization: `Bearer ${token}`,
        };
    }, [token]);

    const value = useMemo(
        () => ({
            token,
            customer,
            authHeaders,
            isAuthenticated: Boolean(token && customer),
            isCheckingAuth,
            login,
            logout: clearAuth,
            verifyCustomer,
        }),
        [
            authHeaders,
            clearAuth,
            customer,
            isCheckingAuth,
            login,
            token,
            verifyCustomer,
        ]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
};
