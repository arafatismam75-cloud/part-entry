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
    query,        // ← নতুন
    orderBy       // ← নতুন
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

// ================= SAVE / UPDATE =================
document.getElementById("saveExcess").onclick = async () => {
    let data = {
        srNo: document.getElementById("srNo").value,
        floor: document.getElementById("floor").value,
        buyerName: document.getElementById("buyerName").value,
        styleNo: document.getElementById("styleNo").value,
        tableNo: document.getElementById("tableNo").value,
        cutQty: Number(document.getElementById("cutQty").value),
        excessQty: Number(document.getElementById("excessQty").value),
        color: document.getElementById("color").value,
        deliveryDate: document.getElementById("deliveryDate").value,
        remarks: document.getElementById("remarks").value
    };

    if (editingExcessId) {
        await updateDoc(doc(db, "excessCutting", editingExcessId), data);
        showToast("Updated Successfully", "success");
        editingExcessId = null;
        document.getElementById("saveExcess").innerHTML = "💾 Save Entry";
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
    let table = document.getElementById("excessTable");
    table.innerHTML = "";

    // ✅ orderBy যোগ — নতুন এন্ট্রি সবার উপরে
    let snapshot = await getDocs(
        query(collection(db, "excessCutting"), orderBy("createdAt", "desc"))
    );

    if (snapshot.empty) {
        table.innerHTML = '<tr><td colspan="11" class="empty">No data available</td></tr>';
        return;
    }

    snapshot.forEach((docSnap) => {
        let p = docSnap.data();
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
                    <button class="edit-btn" onclick="editExcess('${docSnap.id}')">✏️ Edit</button>
                    <button class="delete-btn" onclick="deleteExcess('${docSnap.id}')">🗑 Delete</button>
                </td>
            </tr>
        `;
    });
}


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
    document.getElementById("saveExcess").innerHTML = "💾 Save Entry";
    document.getElementById("cancelExcessEdit").style.display = "none";
};


// ================= SEARCH =================
document.getElementById("excessSearchBox").addEventListener("keyup", () => {
    let value = document.getElementById("excessSearchBox").value.toLowerCase();
    let rows = document.querySelectorAll("#excessTable tr");
    rows.forEach(row => {
        let text = row.innerText.toLowerCase();
        row.style.display = text.includes(value) ? "" : "none";
    });
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
