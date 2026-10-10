import { auth, db } from "./firebase.js";

import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


// ================= USER CHECK =================
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById("userRole").innerText = user.displayName || "Operator";
        initReport();
    } else {
        window.location.href = "index.html";
    }
});


// ================= LOGOUT =================
document.getElementById("logout").onclick = async () => {
    await signOut(auth);
    window.location.href = "index.html";
};


// ================= GLOBAL STATE =================
let allData = [];
let filteredData = [];


// ================= INIT =================
async function initReport() {
    await loadAllData();
    populateDropdowns();
    applyFilters();
}


// ================= LOAD ALL DATA =================
async function loadAllData() {
    try {
        const snapshot = await getDocs(
            query(collection(db, "excessCutting"), orderBy("createdAt", "desc"))
        );
        allData = [];
        snapshot.forEach((docSnap) => {
            allData.push({ id: docSnap.id, ...docSnap.data() });
        });
    } catch (err) {
        console.error(err);
        window.showToast("Failed to load data", "error");
    }
}


// ================= POPULATE DROPDOWNS =================
function populateDropdowns() {
    const buyers = new Set();
    const srNos = new Set();
    const styles = new Set();
    const colors = new Set();

    allData.forEach((item) => {
        if (item.buyerName) buyers.add(item.buyerName.trim());
        if (item.srNo) srNos.add(item.srNo.trim());
        if (item.styleNo) styles.add(item.styleNo.trim());
        if (item.color) colors.add(item.color.trim());
    });

    // Buyer
    const buyerSelect = document.getElementById("filterBuyer");
    buyerSelect.innerHTML = '<option value="">All Buyers</option>';
    [...buyers].sort().forEach(b => {
        buyerSelect.innerHTML += `<option value="${b}">${b}</option>`;
    });

    // SR No
    const srSelect = document.getElementById("filterSrNo");
    srSelect.innerHTML = '<option value="">All SR No</option>';
    [...srNos].sort().forEach(s => {
        srSelect.innerHTML += `<option value="${s}">${s}</option>`;
    });

    // Style
    const styleSelect = document.getElementById("filterStyle");
    styleSelect.innerHTML = '<option value="">All Styles</option>';
    [...styles].sort().forEach(s => {
        styleSelect.innerHTML += `<option value="${s}">${s}</option>`;
    });

    // Color
    const colorSelect = document.getElementById("filterColor");
    colorSelect.innerHTML = '<option value="">All Colors</option>';
    [...colors].sort().forEach(c => {
        colorSelect.innerHTML += `<option value="${c}">${c}</option>`;
    });
}


// ================= APPLY FILTERS =================
window.applyFilters = function () {
    const buyer = document.getElementById("filterBuyer").value;
    const srNo = document.getElementById("filterSrNo").value;
    const style = document.getElementById("filterStyle").value;
    const color = document.getElementById("filterColor").value;

    filteredData = allData.filter((item) => {
        if (buyer && item.buyerName !== buyer) return false;
        if (srNo && item.srNo !== srNo) return false;
        if (style && item.styleNo !== style) return false;
        if (color && item.color !== color) return false;
        return true;
    });

    renderReport();
};


// ================= CLEAR FILTERS =================
window.clearFilters = function () {
    document.getElementById("filterBuyer").value = "";
    document.getElementById("filterSrNo").value = "";
    document.getElementById("filterStyle").value = "";
    document.getElementById("filterColor").value = "";
    applyFilters();
};


// ================= RENDER REPORT =================
function renderReport() {
    const tbody = document.getElementById("reportBody");
    const tfoot = document.getElementById("reportFooter");

    // Stats
    const totalCut = filteredData.reduce((sum, i) => sum + (Number(i.cutQty) || 0), 0);
    const totalExcess = filteredData.reduce((sum, i) => sum + (Number(i.excessQty) || 0), 0);

    document.getElementById("statEntries").innerText = filteredData.length;
    document.getElementById("statCutQty").innerText = totalCut;
    document.getElementById("statExcessQty").innerText = totalExcess;

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty">No data found</td></tr>';
        tfoot.innerHTML = "";
        return;
    }

    tbody.innerHTML = filteredData.map(i => `
        <tr>
            <td>${i.srNo || ""}</td>
            <td>${i.floor || ""}</td>
            <td>${i.buyerName || ""}</td>
            <td>${i.styleNo || ""}</td>
            <td>${i.tableNo || ""}</td>
            <td>${i.cutQty || 0}</td>
            <td>${i.excessQty || 0}</td>
            <td>${i.color || ""}</td>
            <td>${i.deliveryDate || ""}</td>
            <td>${i.remarks || ""}</td>
        </tr>
    `).join("");

    // Footer total
    tfoot.innerHTML = `
        <tr style="background:#232429; font-weight:700;">
            <td colspan="5" style="text-align:right; color:#4d8aea;">TOTAL:</td>
            <td style="color:#2ecc71;">${totalCut}</td>
            <td style="color:#f39c12;">${totalExcess}</td>
            <td colspan="3"></td>
        </tr>
    `;
}


// ================= EXPORT PDF =================
window.exportReportPDF = function () {
    if (filteredData.length === 0) {
        window.showToast("No data to export", "error");
        return;
    }
    if (typeof window.jspdf === "undefined") {
        window.showToast("PDF library loading...", "error");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape" });

    // Title
    doc.setFontSize(18);
    doc.setTextColor(77, 138, 234);
    doc.text("EXCESS CUTTING REPORT", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("Generated: " + new Date().toLocaleString("en-US"), 14, 27);

    // Active filters
    const buyer = document.getElementById("filterBuyer").value || "All";
    const srNo = document.getElementById("filterSrNo").value || "All";
    const style = document.getElementById("filterStyle").value || "All";
    const color = document.getElementById("filterColor").value || "All";

    doc.text(`Filters — Buyer: ${buyer} | SR No: ${srNo} | Style: ${style} | Color: ${color}`, 14, 33);

    // Table
    const body = filteredData.map(i => [
        i.srNo || "",
        i.floor || "",
        i.buyerName || "",
        i.styleNo || "",
        i.tableNo || "",
        i.cutQty || 0,
        i.excessQty || 0,
        i.color || "",
        i.deliveryDate || "",
        i.remarks || ""
    ]);

    const totalCut = filteredData.reduce((sum, i) => sum + (Number(i.cutQty) || 0), 0);
    const totalExcess = filteredData.reduce((sum, i) => sum + (Number(i.excessQty) || 0), 0);

    doc.autoTable({
        head: [["SR No", "Floor", "Buyer", "Style", "Table No", "Cut Qty", "Excess Qty", "Color", "Delivery", "Remarks"]],
        body: body,
        foot: [["", "", "", "", "TOTAL:", totalCut, totalExcess, "", "", ""]],
        startY: 40,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [77, 138, 234], textColor: 255, fontStyle: "bold" },
        footStyles: { fillColor: [35, 36, 41], textColor: [46, 204, 113], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // Page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`excess-report-${new Date().toISOString().split("T")[0]}.pdf`);
};
