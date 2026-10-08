

import { auth, provider, db } from "./firebase.js";

import {
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


// =====================================================
// GLOBAL VARIABLES
// =====================================================

let allParts = [];

let currentPage = 1;

const itemsPerPage = 20;


// =====================================================
// GET ELEMENTS
// =====================================================

const googleLogin = document.getElementById("googleLogin");
const logout = document.getElementById("logout");

const loginBox = document.getElementById("loginBox");
const dashboard = document.getElementById("dashboard");

const userRole = document.getElementById("userRole");

const partTable = document.getElementById("partTable");

const searchInput =
    document.getElementById("searchInput") ||
    document.getElementById("search");


// =====================================================
// GOOGLE LOGIN
// =====================================================

if (googleLogin) {

    googleLogin.addEventListener("click", async () => {

        try {

            await signInWithPopup(auth, provider);

        } catch (error) {

            console.error("Google Login Error:", error);

            alert(
                "Login failed!\n\n" +
                error.message
            );

        }

    });

}


// =====================================================
// LOGOUT
// =====================================================

if (logout) {

    logout.addEventListener("click", async () => {

        try {

            await signOut(auth);

        } catch (error) {

            console.error("Logout Error:", error);

            alert("Logout failed!");

        }

    });

}


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(auth, async (user) => {

    if (user) {

        console.log("Logged in:", user.email);

        // Login hide
        if (loginBox) {
            loginBox.style.display = "none";
        }

        // Dashboard show
        if (dashboard) {
            dashboard.style.display = "block";
        }

        // User name
        if (userRole) {

            userRole.textContent =
                user.displayName || "Operator";

        }

        // Load Firebase data
        await loadParts();

    } else {

        console.log("User logged out");

        // Login show
        if (loginBox) {
            loginBox.style.display = "";
        }

        // Dashboard hide
        if (dashboard) {
            dashboard.style.display = "none";
        }

    }

});


// =====================================================
// LOAD ALL PARTS FROM FIREBASE
// =====================================================

async function loadParts() {

    try {

        const querySnapshot =
            await getDocs(collection(db, "parts"));

        allParts = [];

        querySnapshot.forEach((docSnap) => {

            allParts.push({

                id: docSnap.id,

                ...docSnap.data()

            });

        });


        // -------------------------------------------------
        // SORT
        // Latest Entry First
        // -------------------------------------------------

        allParts.sort((a, b) => {

            const timeA = getCreatedTime(a);
            const timeB = getCreatedTime(b);

            return timeB - timeA;

        });


        console.log(
            "Total Firebase Records:",
            allParts.length
        );


        // -------------------------------------------------
        // Serial Header
        // -------------------------------------------------

        ensureSerialHeader();


        // -------------------------------------------------
        // Reset page
        // -------------------------------------------------

        currentPage = 1;


        // -------------------------------------------------
        // Render
        // -------------------------------------------------

        renderCurrentView();


        // -------------------------------------------------
        // Total
        // -------------------------------------------------

        updateTotals();


    } catch (error) {

        console.error(
            "Load Parts Error:",
            error
        );

        alert(
            "Data load failed!\n\n" +
            error.message
        );

    }

}


// =====================================================
// GET CREATED TIME
// =====================================================

function getCreatedTime(part) {

    if (!part || !part.createdAt) {
        return 0;
    }


    // Firestore Timestamp
    if (
        typeof part.createdAt.toMillis === "function"
    ) {

        return part.createdAt.toMillis();

    }


    // Firestore Timestamp seconds
    if (
        typeof part.createdAt.seconds === "number"
    ) {

        return part.createdAt.seconds * 1000;

    }


    // JavaScript Date
    if (
        part.createdAt instanceof Date
    ) {

        return part.createdAt.getTime();

    }


    // Number
    if (
        typeof part.createdAt === "number"
    ) {

        return part.createdAt;

    }


    return 0;

}


// =====================================================
// DYNAMIC SERIAL HEADER
// No HTML change required
// =====================================================

function ensureSerialHeader() {

    const tbody =
        document.getElementById("partTable");

    if (!tbody) {
        return;
    }


    const table =
        tbody.closest("table");

    if (!table) {
        return;
    }


    const headerRow =
        table.querySelector("thead tr");

    if (!headerRow) {
        return;
    }


    const alreadyExists =
        headerRow.querySelector(".serial-header");


    if (alreadyExists) {
        return;
    }


    const th =
        document.createElement("th");

    th.className =
        "serial-header";

    th.textContent =
        "Serial No";


    headerRow.prepend(th);

}


// =====================================================
// RENDER CURRENT VIEW
// =====================================================

function renderCurrentView() {

    if (!partTable) {
        return;
    }


    const searchValue =
        getSearchValue();


    // -------------------------------------------------
    // SEARCH MODE
    // -------------------------------------------------

    if (searchValue !== "") {

        const filteredParts =
            filterParts(searchValue);


        renderSearchResults(filteredParts);

        return;

    }


    // -------------------------------------------------
    // NORMAL PAGINATION MODE
    // -------------------------------------------------

    renderPaginatedParts();

}


// =====================================================
// GET SEARCH VALUE
// =====================================================

function getSearchValue() {

    if (!searchInput) {
        return "";
    }


    return searchInput.value
        .trim()
        .toLowerCase();

}


// =====================================================
// FILTER PARTS
// =====================================================

function filterParts(searchValue) {

    return allParts.filter((part) => {

        const searchableText = [

            part.partName,
            part.buyerName,
            part.styleNo,
            part.orderQty,
            part.color,
            part.print,
            part.embroidery,
            part.deliveryDate,
            part.poNo

        ]
            .map(value =>
                value === undefined ||
                value === null
                    ? ""
                    : String(value)
            )
            .join(" ")
            .toLowerCase();


        return searchableText.includes(
            searchValue
        );

    });

}


// =====================================================
// NORMAL PAGINATION RENDER
// =====================================================

function renderPaginatedParts() {

    const totalItems =
        allParts.length;


    const totalPages =
        Math.ceil(
            totalItems / itemsPerPage
        );


    // Page correction
    if (
        totalPages > 0 &&
        currentPage > totalPages
    ) {

        currentPage =
            totalPages;

    }


    if (currentPage < 1) {
        currentPage = 1;
    }


    // Clear table
    partTable.innerHTML = "";


    // No data
    if (totalItems === 0) {

        partTable.innerHTML = `
            <tr>
                <td colspan="20"
                    style="text-align:center;">
                    No data found
                </td>
            </tr>
        `;

        removePagination();

        return;

    }


    // -------------------------------------------------
    // Calculate data
    // -------------------------------------------------

    const startIndex =
        (currentPage - 1) *
        itemsPerPage;


    const endIndex =
        Math.min(
            startIndex + itemsPerPage,
            totalItems
        );


    const pageParts =
        allParts.slice(
            startIndex,
            endIndex
        );


    // -------------------------------------------------
    // Create rows
    // -------------------------------------------------

    pageParts.forEach((part, index) => {

        const serial =
            startIndex + index + 1;


        createTableRow(
            part,
            serial
        );

    });


    // -------------------------------------------------
    // Pagination
    // -------------------------------------------------

    renderPagination(
        totalPages
    );

}


// =====================================================
// SEARCH RESULTS
// =====================================================

function renderSearchResults(
    filteredParts
) {

    partTable.innerHTML = "";


    removePagination();


    // No result
    if (filteredParts.length === 0) {

        partTable.innerHTML = `
            <tr>
                <td colspan="20"
                    style="text-align:center;">
                    No matching data found
                </td>
            </tr>
        `;

        return;

    }


    // -------------------------------------------------
    // Original Serial
    // -------------------------------------------------

    filteredParts.forEach((part) => {

        const originalIndex =
            allParts.findIndex(
                item => item.id === part.id
            );


        const serial =
            originalIndex + 1;


        createTableRow(
            part,
            serial
        );

    });

}


// =====================================================
// CREATE TABLE ROW
// =====================================================

function createTableRow(
    part,
    serial
) {

    const tr =
        document.createElement("tr");


    tr.innerHTML = `

        <td>${serial}</td>

        <td>
            ${safeValue(part.partName)}
        </td>

        <td>
            ${safeValue(part.buyerName)}
        </td>

        <td>
            ${safeValue(part.styleNo)}
        </td>

        <td>
            ${safeValue(part.orderQty)}
        </td>

        <td>
            ${safeValue(part.color)}
        </td>

        <td>
            ${safeValue(part.print)}
        </td>

        <td>
            ${safeValue(part.embroidery)}
        </td>

        <td>
            ${safeValue(part.deliveryDate)}
        </td>

        <td>
            ${safeValue(part.poNo)}
        </td>

        <td>

            <button
                type="button"
                onclick="editPart('${part.id}')"
            >
                ✏️ Edit
            </button>

            <button
                type="button"
                onclick="deletePart('${part.id}')"
                style="color:red;"
            >
                🗑 Delete
            </button>

        </td>

    `;


    partTable.appendChild(tr);

}


// =====================================================
// SAFE VALUE
// =====================================================

function safeValue(value) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =====================================================
// PAGINATION
// =====================================================

function renderPagination(
    totalPages
) {

    removePagination();


    if (totalPages <= 1) {
        return;
    }


    const pagination =
        document.createElement("div");


    pagination.id =
        "pagination";


    pagination.style.display =
        "flex";

    pagination.style.justifyContent =
        "center";

    pagination.style.alignItems =
        "center";

    pagination.style.gap =
        "6px";

    pagination.style.margin =
        "20px 0";

    pagination.style.flexWrap =
        "wrap";


    // -------------------------------------------------
    // Previous
    // -------------------------------------------------

    const prevButton =
        createPageButton(
            "‹ Prev",
            currentPage - 1,
            currentPage === 1
        );


    pagination.appendChild(
        prevButton
    );


    // -------------------------------------------------
    // Page numbers
    // -------------------------------------------------

    const pages =
        getPageNumbers(
            totalPages,
            currentPage
        );


    pages.forEach((page) => {

        if (page === "...") {

            const span =
                document.createElement("span");

            span.textContent =
                "...";

            span.style.padding =
                "6px 8px";

            pagination.appendChild(
                span
            );

            return;

        }


        const button =
            createPageButton(
                String(page),
                page,
                false
            );


        if (page === currentPage) {

            button.style.fontWeight =
                "bold";

            button.style.border =
                "2px solid #333";

        }


        pagination.appendChild(
            button
        );

    });


    // -------------------------------------------------
    // Next
    // -------------------------------------------------

    const nextButton =
        createPageButton(
            "Next ›",
            currentPage + 1,
            currentPage === totalPages
        );


    pagination.appendChild(
        nextButton
    );


    // -------------------------------------------------
    // Add below table
    // -------------------------------------------------

    const table =
        partTable.closest("table");


    if (table && table.parentElement) {

        table.parentElement.appendChild(
            pagination
        );

    } else {

        partTable.parentElement.appendChild(
            pagination
        );

    }

}


// =====================================================
// CREATE PAGE BUTTON
// =====================================================

function createPageButton(
    text,
    page,
    disabled
) {

    const button =
        document.createElement("button");


    button.type =
        "button";


    button.textContent =
        text;


    button.disabled =
        disabled;


    button.style.cursor =
        disabled
            ? "default"
            : "pointer";


    button.style.padding =
        "6px 10px";


    button.style.border =
        "1px solid #ccc";


    button.style.borderRadius =
        "5px";


    button.style.background =
        disabled
            ? "#eee"
            : "#fff";


    button.addEventListener(
        "click",
        () => {

            if (disabled) {
                return;
            }


            currentPage =
                page;


            renderPaginatedParts();


            // Scroll to table
            const table =
                partTable.closest("table");

            if (table) {

                table.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        }
    );


    return button;

}


// =====================================================
// PAGE NUMBER SYSTEM
// =====================================================

function getPageNumbers(
    totalPages,
    current
) {

    // Small number of pages
    if (totalPages <= 7) {

        return Array.from(
            {
                length: totalPages
            },
            (_, i) => i + 1
        );

    }


    const pages = [];


    // First page
    pages.push(1);


    // Left dots
    if (current > 4) {

        pages.push("...");

    }


    // Middle pages
    const start =
        Math.max(
            2,
            current - 1
        );


    const end =
        Math.min(
            totalPages - 1,
            current + 1
        );


    for (
        let i = start;
        i <= end;
        i++
    ) {

        pages.push(i);

    }


    // Right dots
    if (
        current <
        totalPages - 3
    ) {

        pages.push("...");

    }


    // Last page
    pages.push(
        totalPages
    );


    return pages;

}


// =====================================================
// REMOVE PAGINATION
// =====================================================

function removePagination() {

    const oldPagination =
        document.getElementById(
            "pagination"
        );


    if (oldPagination) {

        oldPagination.remove();

    }

}


// =====================================================
// SEARCH
// =====================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            currentPage = 1;

            renderCurrentView();

        }
    );

}


// =====================================================
// UPDATE TOTALS
// =====================================================

function updateTotals() {

    let totalQty = 0;


    allParts.forEach((part) => {

        const qty =
            Number(
                part.orderQty
            );


        if (!isNaN(qty)) {

            totalQty += qty;

        }

    });


    // Total Part
    const totalPartElement =
        document.getElementById(
            "totalPart"
        );


    if (totalPartElement) {

        totalPartElement.textContent =
            allParts.length;

    }


    // Total Qty
    const totalQtyElement =
        document.getElementById(
            "totalQty"
        );


    if (totalQtyElement) {

        totalQtyElement.textContent =
            totalQty.toLocaleString();

    }

}


// =====================================================
// ADD PART
// =====================================================

async function savePart() {

    try {

        const partName =
            getValue("partName");

        const buyerName =
            getValue("buyerName");

        const styleNo =
            getValue("styleNo");

        const orderQty =
            getValue("orderQty");

        const color =
            getValue("color");

        const print =
            getValue("print");

        const embroidery =
            getValue("embroidery");

        const deliveryDate =
            getValue("deliveryDate");

        const poNo =
            getValue("poNo");


        // -------------------------------------------------
        // Validation
        // -------------------------------------------------

        if (!partName) {

            alert(
                "Part Name required!"
            );

            return;

        }


        // -------------------------------------------------
        // Save Firebase
        // -------------------------------------------------

        await addDoc(
            collection(db, "parts"),
            {

                partName: partName,

                buyerName: buyerName,

                styleNo: styleNo,

                orderQty: orderQty,

                color: color,

                print: print,

                embroidery: embroidery,

                deliveryDate: deliveryDate,

                poNo: poNo,

                createdAt:
                    serverTimestamp()

            }
        );


        alert(
            "Entry saved successfully!"
        );


        // -------------------------------------------------
        // Clear form
        // -------------------------------------------------

        clearEntryForm();


        // -------------------------------------------------
        // Reload
        // -------------------------------------------------

        await loadParts();


    } catch (error) {

        console.error(
            "Save Error:",
            error
        );

        alert(
            "Save failed!\n\n" +
            error.message
        );

    }

}


// =====================================================
// GET INPUT VALUE
// =====================================================

function getValue(id) {

    const element =
        document.getElementById(id);


    if (!element) {
        return "";
    }


    return element.value.trim();

}


// =====================================================
// CLEAR ENTRY FORM
// =====================================================

function clearEntryForm() {

    const ids = [

        "partName",
        "buyerName",
        "styleNo",
        "orderQty",
        "color",
        "print",
        "embroidery",
        "deliveryDate",
        "poNo"

    ];


    ids.forEach((id) => {

        const element =
            document.getElementById(id);


        if (element) {

            element.value = "";

        }

    });

}


// =====================================================
// DELETE PART
// =====================================================

async function deletePart(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this entry?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        await deleteDoc(
            doc(db, "parts", id)
        );


        alert(
            "Deleted successfully!"
        );


        await loadParts();


    } catch (error) {

        console.error(
            "Delete Error:",
            error
        );


        alert(
            "Delete failed!\n\n" +
            error.message
        );

    }

}




async function editPart(id) {

    const part =
        allParts.find(
            item => item.id === id
        );


    if (!part) {

        alert(
            "Data not found!"
        );

        return;

    }


    const partName =
        prompt(
            "Part Name:",
            part.partName || ""
        );


    if (partName === null) {
        return;
    }


    const buyerName =
        prompt(
            "Buyer Name:",
            part.buyerName || ""
        );


    if (buyerName === null) {
        return;
    }


    const styleNo =
        prompt(
            "Style No:",
            part.styleNo || ""
        );


    if (styleNo === null) {
        return;
    }


    const orderQty =
        prompt(
            "Order Qty:",
            part.orderQty || ""
        );


    if (orderQty === null) {
        return;
    }


    const color =
        prompt(
            "Color:",
            part.color || ""
        );


    if (color === null) {
        return;
    }


    const print =
        prompt(
            "Print:",
            part.print || ""
        );


    if (print === null) {
        return;
    }


    const embroidery =
        prompt(
            "Embroidery:",
            part.embroidery || ""
        );


    if (embroidery === null) {
        return;
    }


    const deliveryDate =
        prompt(
            "Delivery Date:",
            part.deliveryDate || ""
        );


    if (deliveryDate === null) {
        return;
    }


    const poNo =
        prompt(
            "PO No:",
            part.poNo || ""
        );


    if (poNo === null) {
        return;
    }


    try {

        await updateDoc(
            doc(db, "parts", id),
            {

                partName: partName.trim(),

                buyerName: buyerName.trim(),

                styleNo: styleNo.trim(),

                orderQty: orderQty.trim(),

                color: color.trim(),

                print: print.trim(),

                embroidery: embroidery.trim(),

                deliveryDate:
                    deliveryDate.trim(),

                poNo: poNo.trim()

            }
        );


        alert(
            "Updated successfully!"
        );


        await loadParts();


    } catch (error) {

        console.error(
            "Update Error:",
            error
        );


        alert(
            "Update failed!\n\n" +
            error.message
        );

    }

}


// =====================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// =====================================================

window.savePart =
    savePart;

window.deletePart =
    deletePart;

window.editPart =
    editPart;


// =====================================================
// END OF APP.JS
// =====================================================
```
