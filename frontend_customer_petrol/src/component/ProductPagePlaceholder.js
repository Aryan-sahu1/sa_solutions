import React from "react";
import { useLocation } from "react-router-dom";
import { getProductConfig } from "../config/productConfig";
import { useAuth } from "../context/AuthContext";

const titleFromPath = (path) =>
    path
        .replace(/^\//, "")
        .split("-")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const ProductPagePlaceholder = ({ title }) => {
    const { customer } = useAuth();
    const location = useLocation();
    const productConfig = getProductConfig(customer);
    const pageTitle = title || titleFromPath(location.pathname);

    return (
        <div className="container-fluid p-4">
            <div className="product-placeholder">
                <span className="badge text-bg-primary mb-3">
                    {productConfig.shortName}
                </span>
                <h3 className="mb-2">{pageTitle}</h3>
                <p className="mb-0 text-muted">
                    This page is connected in the merged product menu. Add the
                    form/list component here when this module screen is ready.
                </p>
            </div>

            <style>{`
                .product-placeholder {
                    min-height: 220px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 28px;
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
                }
            `}</style>
        </div>
    );
};

export default ProductPagePlaceholder;
