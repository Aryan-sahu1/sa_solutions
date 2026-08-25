import React from "react";
import {
    FaBars,
    FaBook,
    FaBookOpen,
    FaBoxOpen,
    FaCalendarAlt,
    FaCalendarCheck,
    FaCashRegister,
    FaCertificate,
    FaChevronDown,
    FaChevronRight,
    FaClipboardCheck,
    FaClipboardList,
    FaDatabase,
    FaFileInvoice,
    FaFileInvoiceDollar,
    FaGasPump,
    FaIdCard,
    FaKey,
    FaLayerGroup,
    FaList,
    FaMoneyBillWave,
    FaPhoneAlt,
    FaShip,
    FaShoppingCart,
    FaSignOutAlt,
    FaTable,
    FaTachometerAlt,
    FaTimes,
    FaTint,
    FaTools,
    FaTruck,
    FaTruckLoading,
    FaTruckMoving,
    FaUserCheck,
    FaUserGraduate,
    FaUserTie,
    FaUsers,
} from "react-icons/fa";

export const commonIcons = {
    bars: <FaBars />,
    chevronDown: <FaChevronDown />,
    chevronRight: <FaChevronRight />,
    logout: <FaSignOutAlt />,
    times: <FaTimes />,
};

const petrolMenuItems = [
    { to: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    {
        label: "Entry",
        icon: <FaLayerGroup />,
        children: [
            { to: "/sale", label: "Sale", icon: <FaShoppingCart /> },
            { to: "/purchase", label: "Purchase", icon: <FaTruckLoading /> },
            { to: "/meter", label: "Meter", icon: <FaTachometerAlt /> },
            { to: "/leak", label: "Leak", icon: <FaTint /> },
            { to: "/cash-receipt", label: "Cash Receipt / Payment", icon: <FaMoneyBillWave /> },
            { to: "/voucher-entry", label: "Voucher Entry", icon: <FaClipboardList /> },
            { to: "/bill-generation", label: "Bill Generation", icon: <FaFileInvoice /> },
            { to: "/ship-entry", label: "Ship Entry", icon: <FaShip /> },
        ],
    },
    {
        label: "Master",
        icon: <FaLayerGroup />,
        children: [
            { to: "/product-category", label: "Product Category", icon: <FaBoxOpen /> },
            { to: "/stock-item", label: "Stock Item", icon: <FaUserTie /> },
            { to: "/staff-member", label: "Staff", icon: <FaUserTie /> },
            { to: "/head-master", label: "Head Master", icon: <FaUsers /> },
            { to: "/party", label: "Party", icon: <FaUsers /> },
            { to: "/vehicle-master", label: "Vehicle", icon: <FaUsers /> },
            { to: "/nozel", label: "Nozel", icon: <FaUsers /> },
        ],
    },
    { to: "/reports", label: "Reports", icon: <FaKey /> },
    { to: "/change-password", label: "Change Password", icon: <FaKey /> },

];

const schoolMenuItems = [
    { to: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    {
        label: "Entry",
        icon: <FaLayerGroup />,
        children: [
            { to: "/enquiry", label: "Enquiry", icon: <FaClipboardList /> },
            { to: "/fees-receipt", label: "Fees Receipt", icon: <FaMoneyBillWave /> },
            { to: "/cash-receipt-payment", label: "Cash Receipt/Payment", icon: <FaCashRegister /> },
            { to: "/journal-voucher", label: "Journal Voucher", icon: <FaFileInvoiceDollar /> },
            { to: "/staff-salary", label: "Staff Salary", icon: <FaUserTie /> },
            { to: "/staff-attendance", label: "Staff Attendance", icon: <FaUserCheck /> },
            { to: "/student-attendance", label: "Student Attendance", icon: <FaUserGraduate /> },
            { to: "/petrolpump-slip", label: "Petrolpump Slip", icon: <FaGasPump /> },
            { to: "/transfer-certificate", label: "Transfer Certificate", icon: <FaCertificate /> },
            { to: "/character-certificate", label: "Character Certificate", icon: <FaIdCard /> },
            { to: "/follow-up-fees", label: "Follow Up for Fees", icon: <FaPhoneAlt /> },
        ],
    },
    {
        label: "Master",
        icon: <FaLayerGroup />,
        children: [
            { to: "/students", label: "Students", icon: <FaUserGraduate /> },
            { to: "/ledgers", label: "Ledgers", icon: <FaBook /> },
            { to: "/head-master", label: "Head Master", icon: <FaUsers /> },
            { to: "/fees-structure", label: "Fees Structure", icon: <FaMoneyBillWave /> },
            { to: "/master", label: "Master", icon: <FaDatabase /> },
            { to: "/class-subject-master", label: "Class Subject Master", icon: <FaBookOpen /> },
            { to: "/master-list", label: "MasterList", icon: <FaList /> },
            { to: "/exams-schedule", label: "Exams Schedule", icon: <FaCalendarAlt /> },
            { to: "/result-entry", label: "Result Entry", icon: <FaClipboardCheck /> },
            { to: "/time-table", label: "Time Table", icon: <FaTable /> },
            { to: "/time-table-allotment", label: "Time Table Allotment", icon: <FaCalendarCheck /> },
        ],
    },
    { to: "/change-password", label: "Change Password", icon: <FaKey /> },
];

const bricksMenuItems = [
    { to: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    {
        label: "Entry",
        icon: <FaLayerGroup />,
        children: [
            { to: "/brick-delivery", label: "BRICK DELIVERY", icon: <FaTruck /> },
            { to: "/dumper-entry", label: "Dumper Entry", icon: <FaTruckMoving /> },
            { to: "/jcb-entry", label: "JCB Entry", icon: <FaTools /> },
            { to: "/purchase", label: "Purchase", icon: <FaShoppingCart /> },
            { to: "/cash-receipt-payment", label: "Cash Receipt/Payment", icon: <FaCashRegister /> },
            { to: "/voucher-entry", label: "Voucher Entry", icon: <FaFileInvoiceDollar /> },
            { to: "/only-bill", label: "Only Bill", icon: <FaFileInvoice /> },
        ],
    },
    {
        label: "Brick Work",
        icon: <FaLayerGroup />,
        children: [
            { to: "/pathai-dhoyee-nikasee", label: "Pathai/Dhoyee/Nikasee", icon: <FaTruck /> },
            { to: "/actual-data", label: "Actual data", icon: <FaDatabase /> },
        ],
    },
    {
        label: "Master",
        icon: <FaLayerGroup />,
        children: [
            { to: "/customer", label: "Customer", icon: <FaUsers /> },
            { to: "/stock-item", label: "Stock Item", icon: <FaBoxOpen /> },
            { to: "/head-master", label: "Head Master", icon: <FaBook /> },
            { to: "/vehicle-master", label: "Vehicle", icon: <FaTruck /> },
        ],
    },
    { to: "/change-password", label: "Change Password", icon: <FaKey /> },
];

export const productConfigs = {
    petrol: {
        key: "petrol",
        title: "Petrol Dashboard",
        shortName: "Petrol",
        heroClass: "dashboard-hero-petrol",
        menuItems: petrolMenuItems,
    },
    school: {
        key: "school",
        title: "School Dashboard",
        shortName: "School",
        heroClass: "dashboard-hero-school",
        menuItems: schoolMenuItems,
    },
    bricks: {
        key: "bricks",
        title: "Bricks Dashboard",
        shortName: "Bricks",
        heroClass: "dashboard-hero-bricks",
        menuItems: bricksMenuItems,
    },
};

export const normalizeProductName = (value = "") =>
    String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, "");

export const getCustomerProductName = (customer) =>
    customer?.product?.name || customer?.product_name || "";

export const getProductConfig = (customer) => {
    const productName = normalizeProductName(getCustomerProductName(customer));

    if (productName.includes("school")) {
        return productConfigs.school;
    }

    if (productName.includes("brick")) {
        return productConfigs.bricks;
    }

    return productConfigs.petrol;
};

export const mergedProductRoutes = Array.from(
    new Set(
        Object.values(productConfigs).flatMap((config) =>
            config.menuItems.flatMap((item) =>
                item.children ? item.children.map((child) => child.to) : [item.to]
            )
        )
    )
).filter((path) => !["/dashboard", "/change-password"].includes(path));
