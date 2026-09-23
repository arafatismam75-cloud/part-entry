


import { auth, provider, db } from "./firebase.js";



import {
    signInWithEmailAndPassword,
    signInWithPopup,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";


// ======================================================
// Firebase Firestore
// ======================================================

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
// DOM Helper
// ======================================================

const $ = (id) => document.getElementById(id);


// ======================================================
// Login Elements
// ======================================================

const loginPage = $("loginPage");
const dashboard = $("dashboard");

const loginForm = $("loginForm");
const loginEmail = $("loginEmail");
const loginPassword = $("loginPassword");

const loginBtn = $("loginBtn");
const googleLogin = $("googleLogin");
const forgotPassword = $("forgotPassword");
const signupLink = $("signupLink");
const togglePassword = $("togglePassword");


// ======================================================
// Dashboard Elements
// ======================================================

const totalPart = $("totalPart");
const totalQty = $("totalQty");

const currentUser = $("currentUser");
const userRole = $("userRole");

const settingsEmail = $("settingsEmail");
const settingsRole = $("settingsRole");

const headerTitle = $("headerTitle");


// ======================================================
// Sidebar / Navigation
// ======================================================

const menuToggle = $("menuToggle");
const sidebarLogout = $("sidebarLogout");
const logoutBtn = $("logoutBtn");

const navItems = document.querySelectorAll("[data-page]");


// ======================================================
// Part Entry
// ======================================================

const entryForm = $("entryForm");

const partName = $("partName");
const buyerName = $("buyerName");
const styleNo = $("styleNo");
const orderQty = $("orderQty");
const color = $("color");
const print = $("print");
const embroidery = $("embroidery");
const deliveryDate = $("deliveryDate");
const poNo = $("poNo");

const saveBtn = $("saveBtn");
const cancelBtn = $("cancelBtn");


// ======================================================
// Parts Table
// ======================================================

const searchInput = $("searchInput");
const partsTableBody = $("partsTableBody");


// ======================================================
// Application State
// ======================================================

let allParts = [];
let editingPartId = null;


// ======================================================
// Utility
// ======================================================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ======================================================
// Firebase Error Message
// ======================================================

function firebaseError(error) {

    console.error("Firebase Error:", error);

    const code = error?.code || "";

    const messages = {

        "auth/invalid-credential":
            "Email অথবা Password সঠিক নয়।",

        "auth/invalid-email":
            "সঠিক Email Address দিন।",

        "auth/user-not-found":
            "এই Email দিয়ে কোনো Account পাওয়া যায়নি।",

        "auth/wrong-password":
            "Password ভুল হয়েছে।",

        "auth/popup-closed-by-user":
            "Google Login window বন্ধ করা হয়েছে।",

        "auth/popup-blocked":
            "Browser Popup Block করেছে। Popup Allow করুন।",

        "auth/cancelled-popup-request":
            "Google Login বাতিল হয়েছে।",

        "auth/unauthorized-domain":
            "এই Website Firebase Authentication-এ Authorized করা হয়নি।",

        "auth/network-request-failed":
            "Internet connection পরীক্ষা করুন।",

        "auth/too-many-requests":
            "অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।",

        "permission-denied":
            "Firestore permission denied।",

        "unavailable":
            "Firebase Server বর্তমানে পাওয়া যাচ্ছে না।"

    };

    return messages[code] || error?.message || "একটি সমস্যা হয়েছে।";
}


// ======================================================
// Loading Button
// ======================================================

function buttonLoading(button, loading, normalText) {

    if (!button) return;

    button.disabled = loading;

    if (loading) {

        button.dataset.oldText =
            button.innerHTML;

        button.innerHTML = "Please wait...";

    } else {

        button.innerHTML =
            button.dataset.oldText || normalText;
    }
}


// ======================================================
// Show Page
// ======================================================

function showPage(pageId) {

    const pages = document.querySelectorAll(".page");

    pages.forEach(page => {
        page.classList.remove("active");
    });

    const selectedPage = $(pageId);

    if (selectedPage) {
        selectedPage.classList.add("active");
    }


    // Sidebar active state

    navItems.forEach(item => {

        item.classList.remove("active");

        if (item.dataset.page === pageId) {
            item.classList.add("active");
        }
    });


    // Header title

    const titles = {

        dashboardPage: "Dashboard",

        entryPage: "Part Entry",

        partsPage: "All Parts",

        settingsPage: "Settings"

    };

    if (headerTitle) {
        headerTitle.textContent =
            titles[pageId] || "Dashboard";
    }


    // Mobile sidebar close

    const sidebar =
        document.querySelector(".sidebar");

    if (sidebar) {
        sidebar.classList.remove("mobile-open");
    }
}


// ======================================================
// Sidebar Navigation
// ======================================================

navItems.forEach(item => {

    item.addEventListener("click", () => {

        const pageId =
            item.dataset.page;

        if (!pageId) return;

        showPage(pageId);
    });

});


// ======================================================
// Mobile Menu
// ======================================================

if (menuToggle) {

    menuToggle.addEventListener("click", () => {

        const sidebar =
            document.querySelector(".sidebar");

        if (sidebar) {
            sidebar.classList.toggle("mobile-open");
        }

    });

}


// ======================================================
// Password Show / Hide
// ======================================================

if (togglePassword && loginPassword) {

    togglePassword.addEventListener("click", () => {

        if (loginPassword.type === "password") {

            loginPassword.type = "text";

            togglePassword.textContent = "🙈";

        } else {

            loginPassword.type = "password";

            togglePassword.textContent = "👁";
        }

    });

}


// ======================================================
// Email Login
// ======================================================

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email =
            loginEmail?.value.trim();

        const password =
            loginPassword?.value;


        if (!email || !password) {

            alert("Email এবং Password দিন।");

            return;
        }


        buttonLoading(
            loginBtn,
            true,
            "Login"
        );


        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            // onAuthStateChanged automatically
            // dashboard দেখাবে

        } catch (error) {

            alert(firebaseError(error));

        } finally {

            buttonLoading(
                loginBtn,
                false,
                "Login"
            );
        }

    });

}


// ======================================================
// GOOGLE LOGIN
// ======================================================

if (googleLogin) {

    googleLogin.addEventListener("click", async (event) => {

        event.preventDefault();


        buttonLoading(
            googleLogin,
            true,
            "Continue with Google"
        );


        try {

            // IMPORTANT:
            // firebase.js থেকে provider নেওয়া হয়েছে

            const result =
                await signInWithPopup(
                    auth,
                    provider
                );


            console.log(
                "Google Login Successful:",
                result.user
            );


            // onAuthStateChanged automatically
            // dashboard দেখাবে


        } catch (error) {

            console.error(
                "Google Login Error:",
                error
            );

            alert(
                "Google Login হয়নি:\n\n" +
                firebaseError(error)
            );

        } finally {

            buttonLoading(
                googleLogin,
                false,
                "Continue with Google"
            );
        }

    });

}


// ======================================================
// Forgot Password
// ======================================================

if (forgotPassword) {

    forgotPassword.addEventListener("click", async (event) => {

        event.preventDefault();

        const email =
            loginEmail?.value.trim();


        if (!email) {

            alert(
                "প্রথমে Email Address লিখুন।"
            );

            loginEmail?.focus();

            return;
        }


        try {

            await sendPasswordResetEmail(
                auth,
                email
            );

            alert(
                "Password reset link আপনার Email-এ পাঠানো হয়েছে।"
            );

        } catch (error) {

            alert(firebaseError(error));
        }

    });

}


// ======================================================
// Signup Link
// ======================================================

if (signupLink) {

    signupLink.addEventListener("click", (event) => {

        event.preventDefault();

        // signup.html এখনো থাকলে সেখানে যাবে

        window.location.href =
            "signup.html";

    });

}


// ======================================================
// Logout Function
// ======================================================

async function logoutUser() {

    try {

        await signOut(auth);

        console.log("Logged out");

    } catch (error) {

        console.error(
            "Logout Error:",
            error
        );

        alert(firebaseError(error));
    }

}


// ======================================================
// Logout Buttons
// ======================================================

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
// Current User Information
// ======================================================

function updateUserInformation(user) {

    if (!user) return;


    const name =
        user.displayName ||
        user.email?.split("@")[0] ||
        "User";


    if (currentUser) {
        currentUser.textContent = name;
    }


    if (userRole) {
        userRole.textContent = "Operator";
    }


    if (settingsEmail) {
        settingsEmail.textContent =
            user.email || "-";
    }


    if (settingsRole) {
        settingsRole.textContent =
            "Operator";
    }

}


// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(auth, async (user) => {

    if (user) {

        console.log(
            "User Logged In:",
            user.email
        );


        // Login hide

        if (loginPage) {
            loginPage.style.display = "none";
        }


        // Dashboard show

        if (dashboard) {
            dashboard.style.display = "flex";
        }


        updateUserInformation(user);


        // Default page

        showPage("dashboardPage");


        // Firestore data load

        await loadParts();


    } else {

        console.log("No user logged in");


        // Dashboard hide

        if (dashboard) {
            dashboard.style.display = "none";
        }


        // Login show

        if (loginPage) {
            loginPage.style.display = "flex";
        }

    }

});


// ======================================================
// LOAD PARTS FROM FIRESTORE
// ======================================================

async function loadParts() {

    try {

        const querySnapshot =
            await getDocs(
                collection(db, "parts")
            );


        allParts = [];


        querySnapshot.forEach((document) => {

            allParts.push({

                id: document.id,

                ...document.data()

            });

        });


        // Newest first

        allParts.reverse();


        updateDashboardTotals();

        renderPartsTable(
            allParts
        );


    } catch (error) {

        console.error(
            "Load Parts Error:",
            error
        );

        alert(
            "Parts data load হয়নি:\n\n" +
            firebaseError(error)
        );

    }

}


// ======================================================
// DASHBOARD TOTALS
// ======================================================

function updateDashboardTotals() {

    let totalPartCount =
        allParts.length;

    let totalQuantity = 0;


    allParts.forEach(part => {

        const qty =
            Number(part.orderQty) || 0;

        totalQuantity += qty;

    });


    if (totalPart) {
        totalPart.textContent =
            totalPartCount;
    }


    if (totalQty) {
        totalQty.textContent =
            totalQuantity.toLocaleString();
    }

}


// ======================================================
// RENDER PARTS TABLE
// ======================================================

function renderPartsTable(parts) {

    if (!partsTableBody) return;


    if (!parts.length) {

        partsTableBody.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    class="empty-state"
                >
                    No Part Data Found
                </td>

            </tr>

        `;

        return;
    }


    partsTableBody.innerHTML =
        parts.map((part, index) => {

            return `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(part.partName)}
                    </td>

                    <td>
                        ${escapeHTML(part.buyerName)}
                    </td>

                    <td>
                        ${escapeHTML(part.styleNo)}
                    </td>

                    <td>
                        ${escapeHTML(part.orderQty)}
                    </td>

                    <td>
                        ${escapeHTML(part.color)}
                    </td>

                    <td>
                        ${escapeHTML(part.print)}
                    </td>

                    <td>
                        ${escapeHTML(part.embroidery)}
                    </td>

                    <td>
                        ${escapeHTML(part.deliveryDate)}
                    </td>

                    <td>
                        ${escapeHTML(part.poNo)}
                    </td>

                    <td>

                        <button
                            class="table-btn edit-btn"
                            data-id="${part.id}"
                            type="button"
                        >
                            Edit
                        </button>

                        <button
                            class="table-btn delete-btn"
                            data-id="${part.id}"
                            type="button"
                        >
                            Delete
                        </button>

                    </td>

                </tr>

            `;

        }).join("");


    // Edit buttons

    document
        .querySelectorAll(".edit-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    editPart(
                        button.dataset.id
                    );

                }
            );

        });


    // Delete buttons

    document
        .querySelectorAll(".delete-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deletePart(
                        button.dataset.id
                    );

                }
            );

        });

}


// ======================================================
// PART ENTRY SAVE
// ======================================================

if (entryForm) {

    entryForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const data = {

                partName:
                    partName?.value.trim() || "",

                buyerName:
                    buyerName?.value.trim() || "",

                styleNo:
                    styleNo?.value.trim() || "",

                orderQty:
                    Number(orderQty?.value) || 0,

                color:
                    color?.value.trim() || "",

                print:
                    print?.value.trim() || "",

                embroidery:
                    embroidery?.value.trim() || "",

                deliveryDate:
                    deliveryDate?.value || "",

                poNo:
                    poNo?.value.trim() || "",

                updatedAt:
                    serverTimestamp()

            };


            // Basic validation

            if (!data.partName) {

                alert("Part Name দিন.");

                partName?.focus();

                return;
            }


            if (!data.buyerName) {

                alert("Buyer Name দিন.");

                buyerName?.focus();

                return;
            }


            if (!data.styleNo) {

                alert("Style No দিন.");

                styleNo?.focus();

                return;
            }


            if (data.orderQty <= 0) {

                alert("Order Qty সঠিকভাবে দিন.");

                orderQty?.focus();

                return;
            }


            buttonLoading(
                saveBtn,
                true,
                "Save Part"
            );


            try {

                // EDIT

                if (editingPartId) {

                    await updateDoc(
                        doc(
                            db,
                            "parts",
                            editingPartId
                        ),
                        data
                    );


                    alert(
                        "Part successfully updated."
                    );

                }

                // NEW ENTRY

                else {

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
                        "Part successfully saved."
                    );

                }


                // Reset

                resetEntryForm();


                // Reload

                await loadParts();


                // Go All Parts

                showPage(
                    "partsPage"
                );


            } catch (error) {

                console.error(
                    "Save Error:",
                    error
                );

                alert(
                    "Part save হয়নি:\n\n" +
                    firebaseError(error)
                );

            } finally {

                buttonLoading(
                    saveBtn,
                    false,
                    "Save Part"
                );

            }

        }
    );

}


// ======================================================
// RESET ENTRY FORM
// ======================================================

function resetEntryForm() {

    editingPartId = null;


    if (entryForm) {
        entryForm.reset();
    }


    if (saveBtn) {

        saveBtn.textContent =
            "Save Part";
    }


    if (cancelBtn) {

        cancelBtn.style.display =
            "none";
    }

}


// ======================================================
// CANCEL EDIT
// ======================================================

if (cancelBtn) {

    cancelBtn.addEventListener(
        "click",
        () => {

            resetEntryForm();

            showPage(
                "partsPage"
            );

        }
    );

}


// ======================================================
// EDIT PART
// ======================================================

function editPart(id) {

    const part =
        allParts.find(
            item => item.id === id
        );


    if (!part) {

        alert(
            "Part data পাওয়া যায়নি।"
        );

        return;
    }


    editingPartId = id;


    if (partName)
        partName.value =
            part.partName || "";

    if (buyerName)
        buyerName.value =
            part.buyerName || "";

    if (styleNo)
        styleNo.value =
            part.styleNo || "";

    if (orderQty)
        orderQty.value =
            part.orderQty || "";

    if (color)
        color.value =
            part.color || "";

    if (print)
        print.value =
            part.print || "";

    if (embroidery)
        embroidery.value =
            part.embroidery || "";

    if (deliveryDate)
        deliveryDate.value =
            part.deliveryDate || "";

    if (poNo)
        poNo.value =
            part.poNo || "";


    if (saveBtn) {

        saveBtn.textContent =
            "Update Part";

    }


    if (cancelBtn) {

        cancelBtn.style.display =
            "inline-flex";

    }


    showPage(
        "entryPage"
    );

}


// ======================================================
// DELETE PART
// ======================================================

async function deletePart(id) {

    const part =
        allParts.find(
            item => item.id === id
        );


    if (!part) return;


    const confirmed =
        confirm(
            `আপনি কি "${part.partName || "এই Part"}" Delete করতে চান?`
        );


    if (!confirmed) return;


    try {

        await deleteDoc(
            doc(
                db,
                "parts",
                id
            )
        );


        alert(
            "Part successfully deleted."
        );


        await loadParts();


    } catch (error) {

        console.error(
            "Delete Error:",
            error
        );

        alert(
            "Part delete হয়নি:\n\n" +
            firebaseError(error)
        );

    }

}


// ======================================================
// SEARCH
// ======================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            const keyword =
                searchInput.value
                    .trim()
                    .toLowerCase();


            if (!keyword) {

                renderPartsTable(
                    allParts
                );

                return;
            }


            const filtered =
                allParts.filter(part => {

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
                    .join(" ")
                    .toLowerCase();


                    return searchableText
                        .includes(keyword);

                });


            renderPartsTable(
                filtered
            );

        }
    );

}


// ======================================================
// QUICK ACTION SUPPORT
// ======================================================

// যদি Dashboard-এর কোনো button-এ
// data-page="entryPage" থাকে,
// সেটাও automatically কাজ করবে।

document
    .querySelectorAll("[data-page]")
    .forEach(button => {

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
// INITIAL STATE
// ======================================================

if (dashboard) {

    dashboard.style.display =
        "none";

}


if (loginPage) {

    loginPage.style.display =
        "flex";

}


// ======================================================
// APP READY
// ======================================================

console.log(
    "Part Entry ERP App Loaded Successfully."
);
```
