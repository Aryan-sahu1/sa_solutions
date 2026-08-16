 
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
// import Staff from "./component/Staff";
// import Customers from "./component/Customers";
import ChangePassword from "./component/ChangePassword";
// import Product from "./component/Product";
import HeadMaster from "./component/HeadMaster";
import Party from "./component/Party";
import ProductCategory from "./component/ProductCategory";
import StockItem from "./component/StockItem";
import StaffMember from "./component/StaffMember";
import VehicleMaster from "./component/VehicleMaster";
import { AuthProvider } from "./context/AuthContext";
import AddItem from "./component/AddItem";

 

 
const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
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

                        {/* <Route
                            path="/customers"
                            element={<Customers />}
                        /> */}

                        {/* <Route
                            path="/staff"
                            element={<Staff />}
                        /> */}
                        <Route
                            path="/change-password"
                            element={<ChangePassword />}
                        />

                        {/* <Route
                            path="/product"
                            element={<Product />}
                        /> */}

                        <Route
                            path="/head-master"
                            element={<HeadMaster />}
                        />

                        <Route
                            path="/party"
                            element={<Party />}
                        />

                        <Route
                            path="/product-category"
                            element={<ProductCategory />}
                        />

                        <Route
                            path="/stock-item"
                            element={<StockItem />}
                        />

                        <Route
                            path="/staff-member"
                            element={<StaffMember />}
                        />

                        <Route
                            path="/vehicle-master"
                            element={<VehicleMaster />}
                        />
                         <Route
                            path="/add-data"
                            element={<AddItem />}
                        />
                    </Route>

                    {/* Default */}
                    <Route
                        path="*"
                        element={<Navigate to="/login" replace />}
                    />

                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;
 
