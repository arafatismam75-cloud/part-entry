```javascript
// ======================================================
// PART ENTRY ERP
// app.js
// ======================================================

import {
    auth,
    provider,
    db
} from "./firebase.js";

import {
    signInWithEmailAndPassword,
    signInWithPopup,
    sendPasswordResetEmail,
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


// ======================================================
// ELEMENTS
// ======================================================

const loginPage = document.getElementById("loginPage");
const dashboard = document.getElementById("dashboard");

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");

const googleLogin = document.getElementById("googleLogin");
const forgotPassword = document.getElementById("forgotPassword");

const logoutBtn = document.getElementById("logoutBtn");
const sidebarLogout = document.getElementById("sidebarLogout");

const togglePassword = document.getElementById("togglePassword");

const entryForm = document.getElementById("entryForm");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");

const searchInput = document.getElementById("searchInput");
const partsTableBody = document.getElementById("partsTableBody");

const totalPart = document.getElementById("totalPart");
const totalQty = document.getElementById("totalQty");

const currentUser = document.getElementById("currentUser");
const userRole = document.getElementById("userRole");

const settingsEmail = document.getElementById("settingsEmail");
const settingsRole = document.getElementById("settingsRole");

const headerTitle = document.getElementById("headerTitle");

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");


// ======================================================
// VARIABLES
// ======================================================

let editingId = null;

let allParts = [];


// ======================================================
// PAGE NAVIGATION
// ======================================================

const menuItems = document.querySelectorAll(".menu-item");

const contentPages = document.querySelectorAll(".content-page");

const pageButtons = document.querySelectorAll("[data-page]");


function showPage(pageId) {

    contentPages.forEach(page => {

        page.classList.remove("active-page");

    });


    const selectedPage =
        document.getElementById(pageId);


    if (selectedPage) {

        selectedPage.classList.add("active-page");

    }


    menuItems.forEach(item => {

        item.classList.remove("active");

        if (
            item.dataset.page === pageId
        ) {

            item.classList.add("active");

        }

    });


    const titles = {

        dashboardPage: "Dashboard",

        entryPage: "Part Entry",

        partsPage: "All Parts",

        settingsPage: "Settings"

    };


    headerTitle.textContent =
        titles[pageId] || "Dashboard";


    // Mobile sidebar close

    if (
        window.innerWidth <= 700
    ) {

        sidebar.classList.remove("mobile-open");

    }

}


pageButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const page =
                button.dataset.page;

            if (page) {

                showPage(page);

            }

        }
    );

});


// ======================================================
// MOBILE MENU
// ======================================================

if (menuToggle) {

    menuToggle.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "mobile-open"
            );

        }
    );

}


// ======================================================
// PASSWORD SHOW / HIDE
// ======================================================

if (togglePassword) {

    togglePassword.addEventListener(
        "click",
        () => {

            if (
                loginPassword.type ===
                "password"
            ) {

                loginPassword.type =
                    "text";

                togglePassword.textContent =
                    "🙈";

            } else {

                loginPassword.type =
                    "password";

                togglePassword.textContent =
                    "👁";

            }

        }
    );

}


// ======================================================
// EMAIL LOGIN
// ======================================================

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const email =
            loginEmail.value.trim();

        const password =
            loginPassword.value;


        if (!email || !password) {

            alert(
                "Please enter email and password."
            );

            return;

        }


        try {

            loginBtn.disabled = true;

            loginBtn.textContent =
                "Logging in...";


            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        } catch (error) {

            console.error(
                "Login Error:",
                error
            );


            alert(
                getFirebaseErrorMessage(
                    error
                )
            );


        } finally {

            loginBtn.disabled = false;

            loginBtn.textContent =
                "Login";

        }

    }
);


// ======================================================
// GOOGLE LOGIN
// ======================================================

if (googleLogin) {

    googleLogin.addEventListener(
        "click",
        async () => {

            try {

                await signInWithPopup(
                    auth,
                    provider
                );


            } catch (error) {

                console.error(
                    "Google Login Error:",
                    error
                );


                alert(
                    getFirebaseErrorMessage(
                        error
                    )
                );

            }

        }
    );

}


// ======================================================
// FORGOT PASSWORD
// ======================================================

if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();


            const email =
                loginEmail.value.trim();


            if (!email) {

                alert(
                    "Please enter your email first."
                );

                loginEmail.focus();

                return;

            }


            try {

                await sendPasswordResetEmail(
                    auth,
                    email
                );


                alert(
                    "Password reset email sent successfully."
                );


            } catch (error) {

                console.error(
                    "Password Reset Error:",
                    error
                );


                alert(
                    getFirebaseErrorMessage(
                        error
                    )
                );

            }

        }
    );

}


// ======================================================
// LOGOUT
// ======================================================

async function logoutUser() {

    try {

        await signOut(auth);

    } catch (error) {

        console.error(
            "Logout Error:",
            error
        );

    }

}


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        logoutUser
    );

}


if (sidebarLogout) {

    sidebarLogout.addEventListener(
        "click",
        logoutUser
    );

}


// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (user) {

            loginPage.style.display =
                "none";

            dashboard.style.display =
                "block";


            const name =
                user.displayName ||
                user.email ||
                "Operator";


            userRole.textContent =
                name;

            currentUser.textContent =
                name;


            if (settingsEmail) {

                settingsEmail.textContent =
                    user.email || "-";

            }


            if (settingsRole) {

                settingsRole.textContent =
                    "Operator";

            }


            await loadParts();


            showPage("dashboardPage");


        } else {

            loginPage.style.display =
                "flex";

            dashboard.style.display =
                "none";

        }

    }
);


// ======================================================
// ENTRY FORM
// ======================================================

entryForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const data = {

            partName:
                getValue("partName"),

            buyerName:
                getValue("buyerName"),

            styleNo:
                getValue("styleNo"),

            orderQty:
                Number(
                    document.getElementById(
                        "orderQty"
                    ).value
                ) || 0,

            color:
                getValue("color"),

            print:
                getValue("print"),

            embroidery:
                getValue("embroidery"),

            deliveryDate:
                getValue("deliveryDate"),

            poNo:
                getValue("poNo"),

            updatedAt:
                serverTimestamp()

        };


        try {

            saveBtn.disabled = true;

            saveBtn.textContent =
                editingId
                ? "Updating..."
                : "Saving...";


            if (editingId) {

                await updateDoc(
                    doc(
                        db,
                        "parts",
                        editingId
                    ),
                    data
                );


                alert(
                    "Part updated successfully."
                );


            } else {

                await addDoc(
                    collection(
                        db,
                        "parts"
                    ),
                    {
                        ...data,

                        createdAt:
                            serverTimestamp()
                    }
                );


                alert(
                    "Part saved successfully."
                );

            }


            resetForm();

            await loadParts();

            showPage("partsPage");


        } catch (error) {

            console.error(
                "Firestore Save Error:",
                error
            );


            alert(
                "Operation failed:\n\n" +
                getFirebaseErrorMessage(
                    error
                )
            );


        } finally {

            saveBtn.disabled = false;

            saveBtn.textContent =
                "Save Part";

        }

    }
);


// ======================================================
// LOAD PARTS
// ======================================================

async function loadParts() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "parts"
                )
            );


        allParts = [];


        snapshot.forEach(
            item => {

                allParts.push({

                    id: item.id,

                    ...item.data()

                });

            }
        );


        // Newest first

        allParts.reverse();


        renderParts(
            allParts
        );


        updateTotals(
            allParts
        );


    } catch (error) {

        console.error(
            "Load Parts Error:",
            error
        );


        partsTableBody.innerHTML = `

            <tr>
                <td colspan="11"
                    style="padding:30px;color:#dc3545;">

                    Unable to load data.

                </td>
            </tr>

        `;


        alert(
            "Unable to load parts:\n\n" +
            getFirebaseErrorMessage(
                error
            )
        );

    }

}


// ======================================================
// RENDER TABLE
// ======================================================

function renderParts(parts) {

    partsTableBody.innerHTML = "";


    if (parts.length === 0) {

        partsTableBody.innerHTML = `

            <tr>

                <td
                    colspan="11"
                    style="
                        padding:35px;
                        color:#777c85;
                    "
                >

                    No part data found.

                </td>

            </tr>

        `;

        return;

    }


    parts.forEach(
        (part, index) => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${safe(part.partName)}
                </td>

                <td>
                    ${safe(part.buyerName)}
                </td>

                <td>
                    ${safe(part.styleNo)}
                </td>

                <td>
                    ${Number(
                        part.orderQty || 0
                    ).toLocaleString()}
                </td>

                <td>
                    ${safe(part.color)}
                </td>

                <td>
                    ${safe(part.print)}
                </td>

                <td>
                    ${safe(part.embroidery)}
                </td>

                <td>
                    ${safe(part.deliveryDate)}
                </td>

                <td>
                    ${safe(part.poNo)}
                </td>

                <td>

                    <button
                        class="edit-btn"
                        data-id="${part.id}"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        data-id="${part.id}"
                    >
                        Delete
                    </button>

                </td>

            `;


            partsTableBody.appendChild(
                row
            );

        }
    );

}


// ======================================================
// EDIT / DELETE
// ======================================================

partsTableBody.addEventListener(
    "click",
    async (event) => {

        const target =
            event.target;


        const id =
            target.dataset.id;


        if (!id) return;


        // EDIT

        if (
            target.classList.contains(
                "edit-btn"
            )
        ) {

            const part =
                allParts.find(
                    item =>
                        item.id === id
                );


            if (!part) return;


            fillForm(part);

            showPage(
                "entryPage"
            );

        }


        // DELETE

        if (
            target.classList.contains(
                "delete-btn"
            )
        ) {

            const confirmed =
                confirm(
                    "Are you sure you want to delete this part?"
                );


            if (!confirmed) return;


            try {

                target.disabled = true;

                target.textContent =
                    "Deleting...";


                await deleteDoc(
                    doc(
                        db,
                        "parts",
                        id
                    )
                );


                alert(
                    "Part deleted successfully."
                );


                await loadParts();


            } catch (error) {

                console.error(
                    "Delete Error:",
                    error
                );


                alert(
                    "Delete failed:\n\n" +
                    getFirebaseErrorMessage(
                        error
                    )
                );


            }

        }

    }
);


// ======================================================
// FILL FORM
// ======================================================

function fillForm(part) {

    setValue(
        "partName",
        part.partName
    );

    setValue(
        "buyerName",
        part.buyerName
    );

    setValue(
        "styleNo",
        part.styleNo
    );

    setValue(
        "orderQty",
        part.orderQty
    );

    setValue(
        "color",
        part.color
    );

    setValue(
        "print",
        part.print
    );

    setValue(
        "embroidery",
        part.embroidery
    );

    setValue(
        "deliveryDate",
        part.deliveryDate
    );

    setValue(
        "poNo",
        part.poNo
    );


    editingId =
        part.id;


    saveBtn.textContent =
        "Update Part";


    cancelBtn.style.display =
        "block";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ======================================================
// CANCEL EDIT
// ======================================================

cancelBtn.addEventListener(
    "click",
    () => {

        resetForm();

    }
);


// ======================================================
// RESET FORM
// ======================================================

function resetForm() {

    entryForm.reset();

    editingId = null;

    saveBtn.textContent =
        "Save Part";

    cancelBtn.style.display =
        "none";

}


// ======================================================
// SEARCH
// ======================================================

searchInput.addEventListener(
    "input",
    () => {

        const keyword =
            searchInput.value
                .trim()
                .toLowerCase();


        if (!keyword) {

            renderParts(
                allParts
            );

            return;

        }


        const filtered =
            allParts.filter(
                part => {

                    const searchable = [

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
                    .join(" ")
                    .toLowerCase();


                    return searchable.includes(
                        keyword
                    );

                }
            );


        renderParts(
            filtered
        );

    }
);


// ======================================================
// TOTALS
// ======================================================

function updateTotals(parts) {

    totalPart.textContent =
        parts.length;


    const quantity =
        parts.reduce(
            (total, part) => {

                return (
                    total +
                    Number(
                        part.orderQty || 0
                    )
                );

            },
            0
        );


    totalQty.textContent =
        quantity.toLocaleString();

}


// ======================================================
// HELPER: GET VALUE
// ======================================================

function getValue(id) {

    const element =
        document.getElementById(id);


    if (!element) return "";


    return element.value.trim();

}


// ======================================================
// HELPER: SET VALUE
// ======================================================

function setValue(id, value) {

    const element =
        document.getElementById(id);


    if (!element) return;


    element.value =
        value ?? "";

}


// ======================================================
// SAFE HTML
// ======================================================

function safe(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// ======================================================
// FIREBASE ERROR MESSAGE
// ======================================================

function getFirebaseErrorMessage(error) {

    const code =
        error?.code || "";


    const messages = {

        "auth/invalid-credential":
            "Email or password is incorrect.",

        "auth/invalid-email":
            "Invalid email address.",

        "auth/user-not-found":
            "No account found with this email.",

        "auth/wrong-password":
            "Incorrect password.",

        "auth/too-many-requests":
            "Too many attempts. Please try again later.",

        "auth/popup-closed-by-user":
            "Google login popup was closed.",

        "auth/popup-blocked":
            "The browser blocked the login popup.",

        "auth/unauthorized-domain":
            "This website domain is not authorized in Firebase.",

        "permission-denied":
            "Firebase permission denied. Check Firestore Rules.",

        "unavailable":
            "Firebase service is temporarily unavailable."

    };


    return (
        messages[code] ||
        error?.message ||
        "An unknown error occurred."
    );

}


// ======================================================
// INITIAL PAGE
// ======================================================

showPage(
    "dashboardPage"
);
```
