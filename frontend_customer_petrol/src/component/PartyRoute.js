import React from "react";
import { getProductConfig } from "../config/productConfig";
import { useAuth } from "../context/AuthContext";
import BrickParty from "../brick/BrickParty";
import Party from "./Party";

const PartyRoute = () => {
    const { customer } = useAuth();
    const productConfig = getProductConfig(customer);

    if (productConfig.key === "bricks") {
        return <BrickParty />;
    }

    return <Party />;
};

export default PartyRoute;
