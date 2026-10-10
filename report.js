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
    populateBuyerDropdown();
    populateSRDropdown();
    populateStyleDropdown();
    applyFilters();
}


// ================= LOAD DATA =================
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


// ================= POPULATE BUYER DROPDOWN =================
function populateBuyerDropdown() {
    const set = new Set();
    allData.forEach(i => { if (i.buyerName) set.add(i.buyerName.trim()); });
    const list = [...set].sort();

    const sel = document.getElementById("filterBuyer");
    sel.innerHTML = '<option value="">All Buyers</option>';
    list.forEach(b => {
        sel.innerHTML += `<option value="${b}">${b}</option>`;
    });
}


// ================= POPULATE SR DROPDOWN (নির্ভর করে Buyer-এর উপর) =================
function populateSRDropdown() {
    const selectedBuyer = document.getElementById("filterBuyer").value;

    const set = new Set();
    allData.forEach(i => {
        if (selectedBuyer && i.buyerName !== selectedBuyer) return;
        if (i.srNo) set.add(i.srNo.trim());
    });
    const list = [...set].sort();

    const sel = document.getElementById("filterSR");
    sel.innerHTML = '<option value="">All SR</option>';
    list.forEach(s => {
        sel.innerHTML += `<option value="${s}">${s}</option>`;
    });

    // SR dropdown পরিবর্তন হলে Style dropdown আপডেট হবে
    populateStyleDropdown();
}


// ================= POPULATE STYLE DROPDOWN (নির্ভর করে Buyer + SR-এর উপর) =================
function populateStyleDropdown() {
    const selectedBuyer = document.getElementById("filterBuyer").value;
    const selectedSR = document.getElementById("filterSR").value;

    const set = new Set();
    allData.forEach(i => {
        if (selectedBuyer && i.buyerName !== selectedBuyer) return;
        if (selectedSR && i.srNo !== selectedSR) return;
        if (i.styleNo) set.add(i.styleNo.trim());
    });
    const list = [...set].sort();

    const sel = document.getElementById("filterStyle");
    sel.innerHTML = '<option value="">All Styles</option>';
    list.forEach(s => {
        sel.innerHTML += `<option value="${s}">${s}</option>`;
    });
}


// ================= APPLY FILTERS =================
window.applyFilters = function () {
    const dateFrom = document.getElementById("filterDateFrom").value;
    const dateTo = document.getElementById("filterDateTo").value;
    const buyer = document.getElementById("filterBuyer").value;
    const srNo = document.getElementById("filterSR").value;
    const styleNo = document.getElementById("filterStyle").value;

    filteredData = allData.filter((item) => {
        if (buyer && item.buyerName !== buyer) return false;
        if (srNo && item.srNo !== srNo) return false;
        if (styleNo && item.styleNo !== styleNo) return false;
        if (dateFrom && item.deliveryDate && item.deliveryDate < dateFrom) return false;
        if (dateTo && item.deliveryDate && item.deliveryDate > dateTo) return false;
        return true;
    });

    renderReport();
};


// ================= CLEAR FILTERS =================
window.clearFilters = function () {
    document.getElementById("filterDateFrom").value = "";
    document.getElementById("filterDateTo").value = "";
    document.getElementById("filterBuyer").value = "";
    document.getElementById("filterSR").value = "";
    document.getElementById("filterStyle").value = "";

    populateSRDropdown();
    populateStyleDropdown();
    applyFilters();
};


// ================= RENDER REPORT =================
function renderReport() {
    const area = document.getElementById("reportArea");

    const totalCut = filteredData.reduce((s, i) => s + (Number(i.cutQty) || 0), 0);
    const totalExcess = filteredData.reduce((s, i) => s + (Number(i.excessQty) || 0), 0);
    const totalStyles = new Set(filteredData.map(i => i.styleNo).filter(Boolean)).size;

    document.getElementById("statEntries").innerText = filteredData.length;
    document.getElementById("statCutQty").innerText = totalCut;
    document.getElementById("statExcessQty").innerText = totalExcess;
    document.getElementById("statStyles").innerText = totalStyles;

    if (filteredData.length === 0) {
        area.innerHTML = `
            <div class="entry">
                <div class="empty" style="padding:40px;">No data found for the selected filters.</div>
            </div>
        `;
        return;
    }

    // Buyer অনুযায়ী গ্রুপ
    const buyerGroups = {};
    filteredData.forEach(item => {
        const key = item.buyerName || "— Unknown —";
        if (!buyerGroups[key]) buyerGroups[key] = [];
        buyerGroups[key].push(item);
    });

    let html = "";

    Object.keys(buyerGroups).sort().forEach(buyerName => {
        const buyerItems = buyerGroups[buyerName];

        // SR অনুযায়ী গ্রুপ
        const srGroups = {};
        buyerItems.forEach(item => {
            const key = item.srNo || "— Unknown —";
            if (!srGroups[key]) srGroups[key] = [];
            srGroups[key].push(item);
        });

        html += `
            <div class="entry" style="border-left:5px solid #4d8aea;">
                <h2 style="color:#4d8aea; font-size:18px;">
                    👤 Buyer: <span style="color:#fff;">${buyerName}</span>
                </h2>
        `;

        Object.keys(srGroups).sort().forEach(srNo => {
            const srItems = srGroups[srNo];

            // Style অনুযায়ী গ্রুপ
            const styleGroups = {};
            srItems.forEach(item => {
                const key = item.styleNo || "— Unknown —";
                if (!styleGroups[key]) styleGroups[key] = [];
                styleGroups[key].push(item);
            });

            html += `
                <div style="margin:20px 0 25px 15px; padding:15px; background:#121316; border-radius:10px; border:1px solid #2a2b30;">
                    <h3 style="color:#f39c12; font-size:15px; padding-bottom:8px; border-bottom:1px solid #2a2b30;">
                        📋 SR No: <span style="color:#fff;">${srNo}</span>
                    </h3>
            `;

            Object.keys(styleGroups).sort().forEach(styleNo => {
                const styleItems = styleGroups[styleNo];
                const styleCut = styleItems.reduce((s, i) => s + (Number(i.cutQty) || 0), 0);
                const styleExcess = styleItems.reduce((s, i) => s + (Number(i.excessQty) || 0), 0);

                html += `
                    <div style="margin:15px 0 20px 15px;">
                        <h4 style="color:#2ecc71; font-size:14px; margin-bottom:10px;">
                            ✂️ Style: <span style="color:#fff;">${styleNo}</span>
                        </h4>

                        <table style="margin-top:8px;">
                            <thead>
                                <tr>
                                    <th>Color</th>
                                    <th>Cut Qty</th>
                                    <th>Excess Qty</th>
                                    <th>Table No</th>
                                    <th>Floor</th>
                                    <th>Delivery</th>
                                    <th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${styleItems.map(i => `
                                    <tr>
                                        <td>${i.color || ""}</td>
                                        <td>${i.cutQty || 0}</td>
                                        <td>${i.excessQty || 0}</td>
                                        <td>${i.tableNo || ""}</td>
                                        <td>${i.floor || ""}</td>
                                        <td>${i.deliveryDate || ""}</td>
                                        <td>${i.remarks || ""}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>

                        <div style="margin-top:10px; padding:10px 14px; background:#1a1b1f; border-radius:8px; border:1px solid #2a2b30; display:flex; gap:22px; flex-wrap:wrap; font-size:13px;">
                            <div>📦 Entries: <strong style="color:#4d8aea;">${styleItems.length}</strong></div>
                            <div>✂️ Cut Qty: <strong style="color:#2ecc71;">${styleCut}</strong></div>
                            <div>📊 Excess Qty: <strong style="color:#f39c12;">${styleExcess}</strong></div>
                        </div>
                    </div>
                `;
            });

            html += `</div>`; // close SR box
        });

        html += `</div>`; // close Buyer box
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

    doc.setFontSize(18);
    doc.setTextColor(77, 138, 234);
    doc.text("EXCESS CUTTING REPORT", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("Generated: " + new Date().toLocaleString("en-US"), 14, 27);

    // Filter info
    const fBuyer = document.getElementById("filterBuyer").value;
    const fSR = document.getElementById("filterSR").value;
    const fStyle = document.getElementById("filterStyle").value;
    const fFrom = document.getElementById("filterDateFrom").value;
    const fTo = document.getElementById("filterDateTo").value;

    let filterText = "Filters: ";
    if (fBuyer) filterText += `Buyer=${fBuyer} `;
    if (fSR) filterText += `SR=${fSR} `;
    if (fStyle) filterText += `Style=${fStyle} `;
    if (fFrom) filterText += `From=${fFrom} `;
    if (fTo) filterText += `To=${fTo} `;
    if (!fBuyer && !fSR && !fStyle && !fFrom && !fTo) filterText += "None";

    doc.text(filterText, 14, 33);

    let startY = 42;

    // Buyer → SR → Style গ্রুপ
    const buyerGroups = {};
    filteredData.forEach(item => {
        const key = item.buyerName || "— Unknown —";
        if (!buyerGroups[key]) buyerGroups[key] = [];
        buyerGroups[key].push(item);
    });

    Object.keys(buyerGroups).sort().forEach(buyerName => {
        const buyerItems = buyerGroups[buyerName];

        // Buyer heading
        if (startY > 180) { doc.addPage(); startY = 20; }
        doc.setFontSize(13);
        doc.setTextColor(77, 138, 234);
        doc.text(`Buyer: ${buyerName}`, 14, startY);
        startY += 6;

        const srGroups = {};
        buyerItems.forEach(item => {
            const key = item.srNo || "— Unknown —";
            if (!srGroups[key]) srGroups[key] = [];
            srGroups[key].push(item);
        });

        Object.keys(srGroups).sort().forEach(srNo => {
            const srItems = srGroups[srNo];

            if (startY > 180) { doc.addPage(); startY = 20; }
            doc.setFontSize(11);
            doc.setTextColor(243, 156, 18);
            doc.text(`  SR No: ${srNo}`, 14, startY);
            startY += 5;

            const styleGroups = {};
            srItems.forEach(item => {
                const key = item.styleNo || "— Unknown —";
                if (!styleGroups[key]) styleGroups[key] = [];
                styleGroups[key].push(item);
            });

            Object.keys(styleGroups).sort().forEach(styleNo => {
                const styleItems = styleGroups[styleNo];
                const styleCut = styleItems.reduce((s, i) => s + (Number(i.cutQty) || 0), 0);
                const styleExcess = styleItems.reduce((s, i) => s + (Number(i.excessQty) || 0), 0);

                if (startY > 170) { doc.addPage(); startY = 20; }
                doc.setFontSize(10);
                doc.setTextColor(46, 204, 113);
                doc.text(`    Style: ${styleNo}`, 14, startY);

                const body = styleItems.map(i => [
                    i.color || "",
                    i.cutQty || 0,
                    i.excessQty || 0,
                    i.tableNo || "",
                    i.floor || "",
                    i.deliveryDate || "",
                    i.remarks || ""
                ]);

                doc.autoTable({
                    head: [["Color", "Cut Qty", "Excess Qty", "Table No", "Floor", "Delivery", "Remarks"]],
                    body: body,
                    startY: startY + 3,
                    styles: { fontSize: 8, cellPadding: 2 },
                    headStyles: { fillColor: [77, 138, 234], textColor: 255, fontStyle: "bold" },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                    margin: { left: 20 }
                });

                startY = doc.lastAutoTable.finalY + 5;

                doc.setFontSize(9);
                doc.setTextColor(80, 80, 80);
                doc.text(`      Total Entries: ${styleItems.length}   |   Cut Qty: ${styleCut}   |   Excess Qty: ${styleExcess}`, 14, startY);
                startY += 8;
            });
        });

        startY += 4;
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


// ================= CASCADING DROPDOWN LISTENERS =================
document.getElementById("filterBuyer").addEventListener("change", () => {
    populateSRDropdown();       // SR dropdown আপডেট হবে
    document.getElementById("filterStyle").value = ""; // Style reset
    populateStyleDropdown();
});

document.getElementById("filterSR").addEventListener("change", () => {
    populateStyleDropdown();    // Style dropdown আপডেট হবে
});
