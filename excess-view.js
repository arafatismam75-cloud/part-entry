import { auth, db } from "./firebase.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { collection, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


// ================= STATE =================
const ITEMS_PER_PAGE = 20;
let allExcessData = [];
let filteredExcessData = [];
let currentPage = 1;


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


// ================= LOAD DATA =================
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


// ================= RENDER TABLE =================
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

    // Previous Button
    html += `<button type="button" class="page-btn" onclick="changePage(${currentPage - 1}, event)" ${currentPage === 1 ? "disabled" : ""}>◀</button>`;

    // Page Numbers
    const pages = getPageNumbers(currentPage, totalPages);
    pages.forEach(p => {
        if (p === "...") {
            html += `<button type="button" class="page-btn dots" disabled>...</button>`;
        } else {
            html += `<button type="button" class="page-btn ${p === currentPage ? "active" : ""}" onclick="changePage(${p}, event)">${p}</button>`;
        }
    });

    // Next Button
    html += `<button type="button" class="page-btn" onclick="changePage(${currentPage + 1}, event)" ${currentPage === totalPages ? "disabled" : ""}>▶</button>`;

    controls.innerHTML = html;
}


// ================= SMART PAGINATION LOGIC =================
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


// ================= CHANGE PAGE (URL Reload) =================
window.changePage = function (page, event) {
    if (event) { 
        event.preventDefault(); 
        event.stopPropagation(); 
    }
    
    const totalPages = Math.ceil(filteredExcessData.length / ITEMS_PER_PAGE);
    if (page < 1 || page > totalPages) return;

    const url = new URL(window.location.href);
    if (page === 1) {
        url.searchParams.delete('page');
    } else {
        url.searchParams.set('page', page);
    }

    window.location.href = url.toString();
};


// ================= EDIT (Redirect to Entry Page) =================
window.editExcess = (id) => {
    window.location.href = `excess.html?edit=${id}`;
};


// ================= DELETE =================
window.deleteExcess = async (id) => {
    if (confirm("Delete this entry?")) {
        await deleteDoc(doc(db, "excessCutting", id));
        showToast("Deleted Successfully", "success");
        
        // ডিলিটের পর ১ম পেজে ফিরে যাবে
        const url = new URL(window.location.href);
        url.searchParams.delete('page');
        window.location.href = url.toString();
    }
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

    // সার্চ করলে ১ম পেজে ফিরে যাবে এবং URL রিসেট হবে
    currentPage = 1;
    const url = new URL(window.location.href);
    url.searchParams.delete('page');
    window.history.replaceState({}, '', url);

    renderPage();
});


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


// ================= TOAST =================
function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✅' : '⚠️'}</span><span class="toast-msg">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { 
        toast.classList.remove('show'); 
        setTimeout(() => toast.remove(), 400); 
    }, 3000);
}
