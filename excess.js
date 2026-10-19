import { auth, provider, db } from "./firebase.js";

import {
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
    serverTimestamp,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


// ================= USER CHECK =================
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById("userRole").innerText = user.displayName || "Operator";
        loadExcess();
    } else {
        window.location.href = "index.html";
    }
});


// ================= LOGOUT =================
document.getElementById("logout").onclick = async () => {
    await signOut(auth);
    window.location.href = "index.html";
};


let editingExcessId = null;


// ================= PAGINATION STATE =================
const ITEMS_PER_PAGE = 20;
let allExcessData = [];
let filteredExcessData = [];
let currentPage = 1;


// ================= SAVE / UPDATE =================
document.getElementById("saveExcess").onclick = async () => {
    let data = {
        srNo: document.getElementById("srNo").value.trim(),
        floor: document.getElementById("floor").value.trim(),
        buyerName: document.getElementById("buyerName").value.trim(),
        styleNo: document.getElementById("styleNo").value.trim(),
        tableNo: document.getElementById("tableNo").value.trim(),
        cutQty: Number(document.getElementById("cutQty").value),
        excessQty: Number(document.getElementById("excessQty").value),
        color: document.getElementById("color").value.trim(),
        deliveryDate: document.getElementById("deliveryDate").value,
        remarks: document.getElementById("remarks").value.trim()
    };

    if (editingExcessId) {
        await updateDoc(doc(db, "excessCutting", editingExcessId), data);
        showToast("Updated Successfully", "success");
        editingExcessId = null;
        document.getElementById("saveExcess").innerHTML = " Save Entry";
        document.getElementById("cancelExcessEdit").style.display = "none";
    } else {
        data.createdAt = serverTimestamp();
        await addDoc(collection(db, "excessCutting"), data);
        showToast("Saved Successfully", "success");
    }
    clearExcessForm();
    loadExcess();
};


// ================= LOAD =================
async function loadExcess() {
    const table = document.getElementById("excessTable");
    table.innerHTML = '<tr><td colspan="11" class="empty">Loading...</td></tr>';

    try {
        const snapshot = await getDocs(
            query(collection(db, "excessCutting"), orderBy("createdAt", "desc"))
        );

        allExcessData = [];
        snapshot.forEach((docSnap) => {
            allExcessData.push({ id: docSnap.id, ...docSnap.data() });
        });

        filteredExcessData = [...allExcessData];

        // URL থেকে পেজ নম্বর চেক করুন
        const urlParams = new URLSearchParams(window.location.search);
        const pageParam = parseInt(urlParams.get('page'));

        if (pageParam && pageParam > 0) {
            currentPage = pageParam;
        } else {
            currentPage = 1;
        }

        renderPage();
    } catch (err) {
        console.error(err);
        table.innerHTML = '<tr><td colspan="11" class="empty">Error loading data</td></tr>';
    }
}


// ================= RENDER PAGE =================
function renderPage() {
    const table = document.getElementById("excessTable");
    table.innerHTML = "";

    if (filteredExcessData.length === 0) {
        table.innerHTML = '<tr><td colspan="11" class="empty">No data available</td></tr>';
        renderPagination();
        return;
    }

    const totalPages = Math.ceil(filteredExcessData.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = filteredExcessData.slice(start, end);

    pageItems.forEach((p) => {
        table.innerHTML += `
            <tr>
                <td>${p.srNo || ""}</td>
                <td>${p.floor || ""}</td>
                <td>${p.buyerName || ""}</td>
                <td>${p.styleNo || ""}</td>
                <td>${p.tableNo || ""}</td>
                <td>${p.cutQty || 0}</td>
                <td>${p.excessQty || 0}</td>
                <td>${p.color || ""}</td>
                <td>${p.deliveryDate || ""}</td>
                <td>${p.remarks || ""}</td>
                <td>
                    <button class="edit-btn" onclick="editExcess('${p.id}')">✏️ Edit</button>
                    <button class="delete-btn" onclick="deleteExcess('${p.id}')">🗑 Delete</button>
                </td>
            </tr>
        `;
    });

    renderPagination();
}


// ================= RENDER PAGINATION =================
function renderPagination() {
    const info = document.getElementById("paginationInfo");
    const controls = document.getElementById("paginationControls");

    const totalItems = filteredExcessData.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    if (totalItems === 0) {
        info.innerHTML = `Showing <strong>0</strong> of <strong>0</strong>`;
        controls.innerHTML = "";
        return;
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

    info.innerHTML = `Showing <strong>${start}-${end}</strong> of <strong>${totalItems}</strong>`;

    let html = "";

    // Previous
    html += `<button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>◀</button>`;

    // Page numbers (smart)
    const pages = getPageNumbers(currentPage, totalPages);

    pages.forEach(p => {
        if (p === "...") {
            html += `<button class="page-btn dots" disabled>...</button>`;
        } else {
            html += `<button class="page-btn ${p === currentPage ? "active" : ""}" onclick="changePage(${p})">${p}</button>`;
        }
    });

    // Next
    html += `<button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}>▶</button>`;

    controls.innerHTML = html;
}


// ================= GET PAGE NUMBERS =================
function getPageNumbers(current, total) {
    const pages = [];

    if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i);
        return pages;
    }

    pages.push(1);
    if (current > 3) pages.push("...");

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push("...");
    pages.push(total);

    return pages;
}


// ================= CHANGE PAGE (URL Update) =================
window.changePage = function (page) {
    const totalPages = Math.ceil(filteredExcessData.length / ITEMS_PER_PAGE);
    if (page < 1 || page > totalPages) return;

    currentPage = page;

    // 🔥 URL আপডেট করুন (History API)
    const url = new URL(window.location);
    if (page === 1) {
        url.searchParams.delete('page'); // ১ম পেজে লিংক পরিষ্কার
    } else {
        url.searchParams.set('page', page);
    }
    window.history.pushState({ page: page }, '', url);

    renderPage();

    const table = document.getElementById("excessTable");
    if (table) table.scrollIntoView({ behavior: "smooth", block: "start" });
};


// ================= BROWSER BACK/FORWARD =================
window.addEventListener('popstate', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = parseInt(urlParams.get('page')) || 1;

    if (currentPage !== pageParam) {
        currentPage = pageParam;
        renderPage();
    }
});


// ================= EDIT =================
window.editExcess = async (id) => {
    let snapshot = await getDocs(collection(db, "excessCutting"));
    snapshot.forEach((docSnap) => {
        if (docSnap.id === id) {
            let p = docSnap.data();
            document.getElementById("srNo").value = p.srNo || "";
            document.getElementById("floor").value = p.floor || "";
            document.getElementById("buyerName").value = p.buyerName || "";
            document.getElementById("styleNo").value = p.styleNo || "";
            document.getElementById("tableNo").value = p.tableNo || "";
            document.getElementById("cutQty").value = p.cutQty || "";
            document.getElementById("excessQty").value = p.excessQty || "";
            document.getElementById("color").value = p.color || "";
            document.getElementById("deliveryDate").value = p.deliveryDate || "";
            document.getElementById("remarks").value = p.remarks || "";

            editingExcessId = id;
            document.getElementById("saveExcess").innerHTML = "✏️ Update";
            document.getElementById("cancelExcessEdit").style.display = "inline-block";

            if (typeof showExcessSection === 'function') showExcessSection('entry');
        }
    });
};


// ================= DELETE =================
window.deleteExcess = async (id) => {
    if (confirm("Delete this entry?")) {
        await deleteDoc(doc(db, "excessCutting", id));
        showToast("Deleted Successfully", "success");
        loadExcess();
    }
};


// ================= CANCEL EDIT =================
document.getElementById("cancelExcessEdit").onclick = () => {
    editingExcessId = null;
    clearExcessForm();
    document.getElementById("saveExcess").innerHTML = " Save Entry";
    document.getElementById("cancelExcessEdit").style.display = "none";
};


// ================= SEARCH =================
document.getElementById("excessSearchBox").addEventListener("keyup", () => {
    let value = document.getElementById("excessSearchBox").value.toLowerCase().trim();

    if (!value) {
        filteredExcessData = [...allExcessData];
    } else {
        filteredExcessData = allExcessData.filter((p) => {
            return (
                (p.srNo || "").toLowerCase().includes(value) ||
                (p.buyerName || "").toLowerCase().includes(value) ||
                (p.styleNo || "").toLowerCase().includes(value) ||
                (p.floor || "").toLowerCase().includes(value)
            );
        });
    }

    currentPage = 1;

    // Search করলে URL থেকে page সরিয়ে দিন
    const url = new URL(window.location);
    url.searchParams.delete('page');
    window.history.pushState({ page: 1 }, '', url);

    renderPage();
});


// ================= CLEAR =================
function clearExcessForm() {
    document.getElementById("srNo").value = "";
    document.getElementById("floor").value = "";
    document.getElementById("buyerName").value = "";
    document.getElementById("styleNo").value = "";
    document.getElementById("tableNo").value = "";
    document.getElementById("cutQty").value = "";
    document.getElementById("excessQty").value = "";
    document.getElementById("color").value = "";
    document.getElementById("deliveryDate").value = "";
    document.getElementById("remarks").value = "";
}


// ================= EXPORT PDF =================
window.exportExcessPDF = function () {
    if (allExcessData.length === 0) {
        showToast("No data to export", "error");
        return;
    }
    if (typeof window.jspdf === "undefined") {
        showToast("PDF library loading...", "error");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(18);
    doc.setTextColor(77, 138, 234);
    doc.text("EXCESS CUTTING REPORT", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("Generated: " + new Date().toLocaleString("en-US"), 14, 27);

    const data = allExcessData.map(p => [
        p.srNo || "",
        p.floor || "",
        p.buyerName || "",
        p.styleNo || "",
        p.tableNo || "",
        p.cutQty || 0,
        p.excessQty || 0,
        p.color || ""
    ]);

    doc.autoTable({
        head: [["SR No", "Floor", "Buyer", "Style", "Table No", "Cut Qty", "Excess Qty", "Color"]],
        body: data,
        startY: 33,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [77, 138, 234], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`excess-cutting-${new Date().toISOString().split("T")[0]}.pdf`);
};
