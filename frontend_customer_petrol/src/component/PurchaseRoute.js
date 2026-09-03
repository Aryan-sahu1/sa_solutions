import React from "react";
import { getProductConfig } from "../config/productConfig";
import { useAuth } from "../context/AuthContext";
import BrickPurchase from "../brick/BrickPurchase";
import Purchase from "./Purchase";

const PurchaseRoute = () => {
    const { customer } = useAuth();
    const productConfig = getProductConfig(customer);

    if (productConfig.key === "bricks") {
        return <BrickPurchase />;
    }

    return <Purchase />;
};

export default PurchaseRoute;
