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

let selectedBuyer = "";
let selectedSR = "";
let selectedStyle = "";
let selectedColor = "";


// ================= INIT =================
async function initReport() {
    await loadAllData();
    renderOptions("buyer", getAllValues("buyerName"));
    renderOptions("sr", getAllValues("srNo"));
    renderOptions("style", getAllValues("styleNo"));
    renderOptions("color", getAllValues("color"));

    document.getElementById("reportArea").innerHTML = `
        <div class="entry">
            <div class="empty" style="padding:40px; text-align:center; color:#8e8f96;">
                Select filters above and click <strong style="color:#4d8aea;">Apply Filters</strong> to see the report.
            </div>
        </div>
    `;
    resetStats();
}



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


// ================= GET ALL UNIQUE VALUES =================
function getAllValues(field) {
    const set = new Set();
    allData.forEach(i => {
        const v = (i[field] || "").trim();
        if (v) set.add(v);
    });
    return [...set].sort();
}


// ================= RENDER OPTIONS =================
function renderOptions(type, values) {
    const container = document.getElementById(type + "Options");
    if (!container) return;

    // "All" অপশন
    let html = `<div class="custom-select-option" onclick="selectOption('${type}', '', 'All ${capitalize(type)}')">All</div>`;

    values.forEach(v => {
        html += `<div class="custom-select-option" onclick="selectOption('${type}', '${escapeHtml(v)}', '${escapeHtml(v)}')">${escapeHtml(v)}</div>`;
    });

    container.innerHTML = html;
}


// ================= SELECT OPTION =================
window.selectOption = function (type, value, label) {
    const display = document.getElementById(type + "Display");

    // মান সেট করুন
    if (type === "buyer") selectedBuyer = value;
    if (type === "sr") selectedSR = value;
    if (type === "style") selectedStyle = value;
    if (type === "color") selectedColor = value;

    // ডিসপ্লে আপডেট
    if (value === "") {
        display.classList.add("placeholder");
        display.textContent = "All " + capitalize(type);
    } else {
        display.classList.remove("placeholder");
        display.textContent = label;
    }

    // প্যানেল বন্ধ
    document.getElementById(type + "Panel").classList.remove("open");
    display.classList.remove("open");

    // Cascade আপডেট
    if (type === "buyer") {
        selectedSR = ""; selectedStyle = ""; selectedColor = "";
        document.getElementById("srDisplay").textContent = "All Sr";
        document.getElementById("srDisplay").classList.add("placeholder");
        document.getElementById("styleDisplay").textContent = "All Styles";
        document.getElementById("styleDisplay").classList.add("placeholder");
        document.getElementById("colorDisplay").textContent = "All Colors";
        document.getElementById("colorDisplay").classList.add("placeholder");

        renderOptions("sr", getFilteredValues("srNo"));
        renderOptions("style", getFilteredValues("styleNo"));
        renderOptions("color", getFilteredValues("color"));
    }
    if (type === "sr") {
        selectedStyle = ""; selectedColor = "";
        document.getElementById("styleDisplay").textContent = "All Styles";
        document.getElementById("styleDisplay").classList.add("placeholder");
        document.getElementById("colorDisplay").textContent = "All Colors";
        document.getElementById("colorDisplay").classList.add("placeholder");

        renderOptions("style", getFilteredValues("styleNo"));
        renderOptions("color", getFilteredValues("color"));
    }
    if (type === "style") {
        selectedColor = "";
        document.getElementById("colorDisplay").textContent = "All Colors";
        document.getElementById("colorDisplay").classList.add("placeholder");

        renderOptions("color", getFilteredValues("color"));
    }
};


// ================= FILTERED VALUES (CASCADE) =================
function getFilteredValues(field) {
    const set = new Set();
    allData.forEach(i => {
        if (selectedBuyer && (i.buyerName || "").trim() !== selectedBuyer) return;
        if (selectedSR && (i.srNo || "").trim() !== selectedSR) return;
        if (field === "color" && selectedStyle && (i.styleNo || "").trim() !== selectedStyle) return;

        const v = (i[field] || "").trim();
        if (v) set.add(v);
    });
    return [...set].sort();
}


// ================= HELPERS =================
function capitalize(str) {
    if (str === "sr") return "Sr";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
    return String(str).replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

function resetStats() {
    document.getElementById("statEntries").innerText = 0;
    document.getElementById("statCutQty").innerText = 0;
    document.getElementById("statExcessQty").innerText = 0;
    document.getElementById("statStyles").innerText = 0;
}


// ================= APPLY FILTERS =================
window.applyFilters = function () {
    filteredData = allData.filter((item) => {
        if (selectedBuyer && (item.buyerName || "").trim() !== selectedBuyer) return false;
        if (selectedSR && (item.srNo || "").trim() !== selectedSR) return false;
        if (selectedStyle && (item.styleNo || "").trim() !== selectedStyle) return false;
        if (selectedColor && (item.color || "").trim() !== selectedColor) return false;
        return true;
    });

    renderReport();
};


// ================= CLEAR FILTERS =================
window.clearFilters = function () {
    selectedBuyer = ""; selectedSR = ""; selectedStyle = ""; selectedColor = "";

    ["buyer", "sr", "style", "color"].forEach(type => {
        const display = document.getElementById(type + "Display");
        const label = type === "sr" ? "Sr" : capitalize(type);
        display.textContent = "All " + label + (type === "style" || type === "color" ? "s" : (type === "buyer" ? "s" : ""));
        display.classList.add("placeholder");
    });

    document.getElementById("buyerDisplay").textContent = "All Buyers";
    document.getElementById("srDisplay").textContent = "All SR";
    document.getElementById("styleDisplay").textContent = "All Styles";
    document.getElementById("colorDisplay").textContent = "All Colors";

    renderOptions("buyer", getAllValues("buyerName"));
    renderOptions("sr", getAllValues("srNo"));
    renderOptions("style", getAllValues("styleNo"));
    renderOptions("color", getAllValues("color"));

    document.getElementById("reportArea").innerHTML = `
        <div class="entry">
            <div class="empty" style="padding:40px; text-align:center; color:#8e8f96;">
                 Select filters above and click <strong style="color:#4d8aea;">Apply Filters</strong> to see the report.
            </div>
        </div>
    `;
    resetStats();
};


// ================= RENDER REPORT =================
function renderReport() {
    const area = document.getElementById("reportArea");

    const totalCut = filteredData.reduce((s, i) => s + (Number(i.cutQty) || 0), 0);
    const totalExcess = filteredData.reduce((s, i) => s + (Number(i.excessQty) || 0), 0);
    const totalStyles = new Set(filteredData.map(i => (i.styleNo || "").trim()).filter(Boolean)).size;

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

    // Buyer → SR → Style গ্রুপ
    const buyerGroups = {};
    filteredData.forEach(item => {
        const key = (item.buyerName || "").trim() || "— Unknown —";
        if (!buyerGroups[key]) buyerGroups[key] = [];
        buyerGroups[key].push(item);
    });

    let html = "";

    Object.keys(buyerGroups).sort().forEach(buyerName => {
        const buyerItems = buyerGroups[buyerName];

        html += `
            <div class="entry" style="border-left:5px solid #4d8aea;">
                <h2 style="color:#4d8aea; font-size:18px;">
                    👤 Buyer: <span style="color:#fff;">${buyerName}</span>
                </h2>
        `;

        const srGroups = {};
        buyerItems.forEach(item => {
            const key = (item.srNo || "").trim() || "— Unknown —";
            if (!srGroups[key]) srGroups[key] = [];
            srGroups[key].push(item);
        });

        Object.keys(srGroups).sort().forEach(srNo => {
            const srItems = srGroups[srNo];

            html += `
                <div style="margin:18px 0 22px 15px; padding:14px; background:#121316; border-radius:10px; border:1px solid #2a2b30;">
                    <h3 style="color:#f39c12; font-size:15px; padding-bottom:8px; border-bottom:1px solid #2a2b30;">
                        SR No: <span style="color:#fff;">${srNo}</span>
                    </h3>
            `;

            const styleGroups = {};
            srItems.forEach(item => {
                const key = (item.styleNo || "").trim() || "— Unknown —";
                if (!styleGroups[key]) styleGroups[key] = [];
                styleGroups[key].push(item);
            });

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
                                    <th>Color</th><th>Cut Qty</th><th>Excess Qty</th>
                                    <th>Table No</th><th>Floor</th><th>Delivery</th><th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${styleItems.map(i => `
                                    <tr>
                                        <td>${(i.color || "").trim()}</td>
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
                            <div> Entries: <strong style="color:#4d8aea;">${styleItems.length}</strong></div>
                            <div> Cut Qty: <strong style="color:#2ecc71;">${styleCut}</strong></div>
                            <div> Excess Qty: <strong style="color:#f39c12;">${styleExcess}</strong></div>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        });

        html += `</div>`;
    });

    area.innerHTML = html;
}


// ================= EXPORT PDF =================
window.exportReportPDF = function () {
    if (filteredData.length === 0) {
        window.showToast("Apply filters first to export", "error");
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

    let filterText = "Filters: ";
    if (selectedBuyer) filterText += `Buyer=${selectedBuyer} `;
    if (selectedSR) filterText += `SR=${selectedSR} `;
    if (selectedStyle) filterText += `Style=${selectedStyle} `;
    if (selectedColor) filterText += `Color=${selectedColor} `;
    if (!selectedBuyer && !selectedSR && !selectedStyle && !selectedColor) filterText += "None";

    doc.text(filterText, 14, 33);

    let startY = 42;

    const buyerGroups = {};
    filteredData.forEach(item => {
        const key = (item.buyerName || "").trim() || "— Unknown —";
        if (!buyerGroups[key]) buyerGroups[key] = [];
        buyerGroups[key].push(item);
    });

    Object.keys(buyerGroups).sort().forEach(buyerName => {
        const buyerItems = buyerGroups[buyerName];

        if (startY > 180) { doc.addPage(); startY = 20; }
        doc.setFontSize(13);
        doc.setTextColor(77, 138, 234);
        doc.text(`Buyer: ${buyerName}`, 14, startY);
        startY += 6;

        const srGroups = {};
        buyerItems.forEach(item => {
            const key = (item.srNo || "").trim() || "— Unknown —";
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
                const key = (item.styleNo || "").trim() || "— Unknown —";
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
                    (i.color || "").trim(),
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

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`excess-report-${new Date().toISOString().split("T")[0]}.pdf`);
};
