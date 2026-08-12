 
import React from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import CompanyLogin from "./component/CompanyLogin";
import DashboardLayout from "./Dashboard/DashboardLayout";
import Dashboard from "./Dashboard/Dashboard";
import ProtectedRoute from "./ProtectedRoute/ProtectedRoute";
import Staff from "./component/Staff";
import Customers from "./component/Customers";
import ChangePassword from "./component/ChangePassword";
import Product from "./component/Product";
import THeadMaster from "./component/THeadMaster";

 

 
const App = () => {
    return (
        <BrowserRouter>
            <Routes>

                {/* Public */}
                <Route
                    path="/login"
                    element={<CompanyLogin />}
                />

                {/* Protected */}
                <Route
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/customers"
                        element={<Customers />}
                    />

                    <Route
                        path="/staff"
                        element={<Staff />}
                    />
                    <Route
                        path="/change-password"
                        element={<ChangePassword />}
                    />

                    <Route
                        path="/product"
                        element={<Product />}
                    />

                    <Route
                        path="/t-head-master"
                        element={<THeadMaster />}
                    />
                </Route>

                {/* Default */}
                <Route
                    path="*"
                    element={<Navigate to="/login" replace />}
                />

            </Routes>
        </BrowserRouter>
    );
};

export default App;
 
