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


// ================= INIT REPORT =================
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
    const buyersSet = new Set();
    const floorsSet = new Set();

    allData.forEach((item) => {
        if (item.buyerName) buyersSet.add(item.buyerName.trim());
        if (item.floor) floorsSet.add(item.floor.trim());
    });

    const buyers = [...buyersSet].sort();
    const floors = [...floorsSet].sort();

    const buyerSelect = document.getElementById("filterBuyer");
    buyerSelect.innerHTML = '<option value="">All Buyers</option>';
    buyers.forEach(b => {
        buyerSelect.innerHTML += `<option value="${b}">${b}</option>`;
    });

    const floorSelect = document.getElementById("filterFloor");
    floorSelect.innerHTML = '<option value="">All Floors</option>';
    floors.forEach(f => {
        floorSelect.innerHTML += `<option value="${f}">${f}</option>`;
    });
}


// ================= APPLY FILTERS =================
window.applyFilters = function () {
    const dateFrom = document.getElementById("filterDateFrom").value;
    const dateTo = document.getElementById("filterDateTo").value;
    const floor = document.getElementById("filterFloor").value;
    const buyer = document.getElementById("filterBuyer").value;

    filteredData = allData.filter((item) => {
        // Floor
        if (floor && item.floor !== floor) return false;
        // Buyer
        if (buyer && item.buyerName !== buyer) return false;
        // Date From
        if (dateFrom && item.deliveryDate && item.deliveryDate < dateFrom) return false;
        // Date To
        if (dateTo && item.deliveryDate && item.deliveryDate > dateTo) return false;
        return true;
    });

    renderReport();
};


// ================= CLEAR FILTERS =================
window.clearFilters = function () {
    document.getElementById("filterDateFrom").value = "";
    document.getElementById("filterDateTo").value = "";
    document.getElementById("filterFloor").value = "";
    document.getElementById("filterBuyer").value = "";
    document.getElementById("groupBy").value = "srNo";
    applyFilters();
};


// ================= RENDER REPORT =================
function renderReport() {
    const groupBy = document.getElementById("groupBy").value;
    const area = document.getElementById("reportArea");

    // Stats
    const totalCut = filteredData.reduce((sum, i) => sum + (Number(i.cutQty) || 0), 0);
    const totalExcess = filteredData.reduce((sum, i) => sum + (Number(i.excessQty) || 0), 0);

    document.getElementById("statEntries").innerText = filteredData.length;
    document.getElementById("statCutQty").innerText = totalCut;
    document.getElementById("statExcessQty").innerText = totalExcess;

    if (filteredData.length === 0) {
        document.getElementById("statGroups").innerText = 0;
        area.innerHTML = `
            <div class="entry">
                <div class="empty" style="padding:40px;">No data found for the selected filters.</div>
            </div>
        `;
        return;
    }

    // Group data
    const groups = {};
    filteredData.forEach((item) => {
        const key = item[groupBy] || "— Unknown —";
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    });

    const groupKeys = Object.keys(groups).sort();
    document.getElementById("statGroups").innerText = groupKeys.length;

    // Column setup based on groupBy
    let columns = [];
    if (groupBy === "srNo") {
        columns = ["Buyer", "Style", "Color", "Cut Qty", "Excess Qty"];
    } else if (groupBy === "buyerName") {
        columns = ["SR No", "Style", "Color", "Cut Qty", "Excess Qty"];
    } else if (groupBy === "styleNo") {
        columns = ["SR No", "Buyer", "Color", "Cut Qty", "Excess Qty"];
    } else if (groupBy === "color") {
        columns = ["SR No", "Buyer", "Style", "Cut Qty", "Excess Qty"];
    }

    // Build HTML
    let html = "";

    groupKeys.forEach((key) => {
        const items = groups[key];
        const groupCut = items.reduce((sum, i) => sum + (Number(i.cutQty) || 0), 0);
        const groupExcess = items.reduce((sum, i) => sum + (Number(i.excessQty) || 0), 0);

        const groupLabel = {
            srNo: "SR No",
            buyerName: "Buyer",
            styleNo: "Style",
            color: "Color"
        }[groupBy];

        html += `
            <div class="entry" style="margin-bottom:18px;">
                <h2 style="color:#4d8aea; font-size:16px; padding-bottom:10px; border-bottom:2px solid #4d8aea;">
                    ${groupLabel}: <span style="color:#fff;">${key}</span>
                </h2>

                <table style="margin-top:12px;">
                    <thead>
                        <tr>${columns.map(c => `<th>${c}</th>`).join("")}</tr>
                    </thead>
                    <tbody>
                        ${items.map(i => `
                            <tr>
                                ${groupBy === "srNo" ? `
                                    <td>${i.buyerName || ""}</td>
                                    <td>${i.styleNo || ""}</td>
                                    <td>${i.color || ""}</td>
                                    <td>${i.cutQty || 0}</td>
                                    <td>${i.excessQty || 0}</td>
                                ` : groupBy === "buyerName" ? `
                                    <td>${i.srNo || ""}</td>
                                    <td>${i.styleNo || ""}</td>
                                    <td>${i.color || ""}</td>
                                    <td>${i.cutQty || 0}</td>
                                    <td>${i.excessQty || 0}</td>
                                ` : groupBy === "styleNo" ? `
                                    <td>${i.srNo || ""}</td>
                                    <td>${i.buyerName || ""}</td>
                                    <td>${i.color || ""}</td>
                                    <td>${i.cutQty || 0}</td>
                                    <td>${i.excessQty || 0}</td>
                                ` : `
                                    <td>${i.srNo || ""}</td>
                                    <td>${i.buyerName || ""}</td>
                                    <td>${i.styleNo || ""}</td>
                                    <td>${i.cutQty || 0}</td>
                                    <td>${i.excessQty || 0}</td>
                                `}
                            </tr>
                        `).join("")}
                    </tbody>
                </table>

                <div style="margin-top:14px; padding:12px 16px; background:#121316; border-radius:8px; border:1px solid #2a2b30; display:flex; gap:30px; flex-wrap:wrap; font-size:14px;">
                    <div>📦 <strong style="color:#4d8aea;">Total Entries:</strong> <span style="color:#fff;">${items.length}</span></div>
                    <div>✂️ <strong style="color:#2ecc71;">Total Cut Qty:</strong> <span style="color:#fff;">${groupCut}</span></div>
                    <div>📊 <strong style="color:#f39c12;">Total Excess Qty:</strong> <span style="color:#fff;">${groupExcess}</span></div>
                </div>
            </div>
        `;
    });

    area.innerHTML = html;
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
    const groupBy = document.getElementById("groupBy").value;

    doc.setFontSize(18);
    doc.setTextColor(77, 138, 234);
    doc.text("EXCESS CUTTING REPORT", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("Generated: " + new Date().toLocaleString("en-US"), 14, 27);
    doc.text("Grouped by: " + ({
        srNo: "SR No",
        buyerName: "Buyer",
        styleNo: "Style",
        color: "Color"
    })[groupBy], 14, 32);

    let startY = 40;

    // Group data
    const groups = {};
    filteredData.forEach((item) => {
        const key = item[groupBy] || "— Unknown —";
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    });

    const groupKeys = Object.keys(groups).sort();

    // Column setup
    let columns = [];
    if (groupBy === "srNo") {
        columns = ["Buyer", "Style", "Color", "Cut Qty", "Excess Qty"];
    } else if (groupBy === "buyerName") {
        columns = ["SR No", "Style", "Color", "Cut Qty", "Excess Qty"];
    } else if (groupBy === "styleNo") {
        columns = ["SR No", "Buyer", "Color", "Cut Qty", "Excess Qty"];
    } else {
        columns = ["SR No", "Buyer", "Style", "Cut Qty", "Excess Qty"];
    }

    const groupLabel = {
        srNo: "SR No",
        buyerName: "Buyer",
        styleNo: "Style",
        color: "Color"
    }[groupBy];

    groupKeys.forEach((key, index) => {
        const items = groups[key];
        const groupCut = items.reduce((sum, i) => sum + (Number(i.cutQty) || 0), 0);
        const groupExcess = items.reduce((sum, i) => sum + (Number(i.excessQty) || 0), 0);

        // Group heading
        doc.setFontSize(12);
        doc.setTextColor(77, 138, 234);
        doc.text(`${groupLabel}: ${key}`, 14, startY);

        // Table data
        const body = items.map(i => {
            if (groupBy === "srNo") return [i.buyerName || "", i.styleNo || "", i.color || "", i.cutQty || 0, i.excessQty || 0];
            if (groupBy === "buyerName") return [i.srNo || "", i.styleNo || "", i.color || "", i.cutQty || 0, i.excessQty || 0];
            if (groupBy === "styleNo") return [i.srNo || "", i.buyerName || "", i.color || "", i.cutQty || 0, i.excessQty || 0];
            return [i.srNo || "", i.buyerName || "", i.styleNo || "", i.cutQty || 0, i.excessQty || 0];
        });

        doc.autoTable({
            head: [columns],
            body: body,
            startY: startY + 4,
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [77, 138, 234], textColor: 255, fontStyle: "bold" },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            didDrawPage: (data) => {
                startY = data.cursor.y;
            }
        });

        // Group totals
        const finalY = doc.lastAutoTable.finalY + 6;
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.text(`Total Entries: ${items.length}   |   Total Cut Qty: ${groupCut}   |   Total Excess Qty: ${groupExcess}`, 14, finalY);

        startY = finalY + 12;
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


// Auto refresh when Group By changes
document.getElementById("groupBy").addEventListener("change", renderReport);
