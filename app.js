import { auth, provider, db } from "./firebase.js";

import {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword
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


// ================= GOOGLE LOGIN =================
document.getElementById("googleLogin").onclick = async () => {
    try { await signInWithPopup(auth, provider); }
    catch (error) { console.log(error); alert(error.message); }
};


// ================= EMAIL / PASSWORD LOGIN =================
document.getElementById("emailLogin").onclick = async () => {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const msg = document.getElementById("loginMessage");
    msg.textContent = ""; msg.style.color = "#ff6b6b";

    if (!email || !password) { msg.textContent = "Please enter email and password."; return; }

    try { await signInWithEmailAndPassword(auth, email, password); }
    catch (error) { console.log(error); msg.textContent = error.message; }
};


// ================= LOGOUT =================
document.getElementById("logout").onclick = async () => { await signOut(auth); };


// ================= USER CHECK =================
onAuthStateChanged(auth, (user) => {
    document.getElementById("loadingScreen").style.display = "none";

    if (user) {
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("dashboard").style.display = "block";
        document.getElementById("userRole").innerText = user.displayName || user.email || "Operator";
        loadParts();
    } else {
        document.getElementById("loginBox").style.display = "flex";
        document.getElementById("dashboard").style.display = "none";
    }
});


let editingId = null;


// ================= CHECKBOX HELPERS =================
function getCheckedValues(className) {
    const checked = document.querySelectorAll(`.${className}:checked`);
    const values = [];
    checked.forEach(cb => values.push(cb.value));
    return values.join(", ");
}

function setCheckedValues(className, valueString) {
    document.querySelectorAll(`.${className}`).forEach(cb => cb.checked = false);
    if (!valueString) return;
    const values = valueString.split(",").map(v => v.trim()).filter(Boolean);
    values.forEach(val => {
        document.querySelectorAll(`.${className}`).forEach(cb => {
            if (cb.value === val) cb.checked = true;
        });
    });
}


// ================= SAVE / UPDATE =================
document.getElementById("savePart").onclick = async () => {

    let data = {
        partName: document.getElementById("partName").value.trim(),
        buyerName: document.getElementById("buyerName").value.trim(),
        styleNo: document.getElementById("styleNo").value.trim(),
        poNo: document.getElementById("poNo").value.trim(),
        orderQty: document.getElementById("orderQty").value,   // Table No
        color: document.getElementById("color").value.trim(),
        print: getCheckedValues("print-cb"),
        embroidery: getCheckedValues("embroidery-cb"),
        deliveryDate: document.getElementById("deliveryDate").value
    };

    if (editingId) {
        await updateDoc(doc(db, "parts", editingId), data);
        showToast("Updated Successfully", "success");
        editingId = null;
        document.getElementById("savePart").innerHTML = " Save Part";
        document.getElementById("cancelEdit").style.display = "none";
    } else {
        data.createdAt = serverTimestamp();
        await addDoc(collection(db, "parts"), data);
        showToast("Saved Successfully", "success");
    }

    clearForm();
    loadParts();
};


// ================= LOAD PART =================
async function loadParts() {
    let table = document.getElementById("partTable");
    table.innerHTML = "";

    let snapshot = await getDocs(query(collection(db, "parts"), orderBy("createdAt", "desc")));

    let total = 0;
    let totalQty = 0;

    snapshot.forEach((docSnap) => {
        let p = docSnap.data();
        total++;
        totalQty += Number(p.orderQty || 0);

        table.innerHTML += `
            <tr>
                <td>${p.partName || ""}</td>
                <td>${p.buyerName || ""}</td>
                <td>${p.styleNo || ""}</td>
                <td>${p.poNo || ""}</td>
                <td>${p.orderQty || ""}</td>
                <td>${p.color || ""}</td>
                <td>${p.print || ""}</td>
                <td>${p.embroidery || ""}</td>
                <td>${p.deliveryDate || ""}</td>
                <td>
                    <button class="edit-btn" onclick="editPart('${docSnap.id}')">✏️ Edit</button>
                    <button class="delete-btn" onclick="deletePart('${docSnap.id}')">🗑 Delete</button>
                </td>
            </tr>
        `;
    });

    document.getElementById("totalPart").innerText = total;
    document.getElementById("totalQty").innerText = totalQty;
}


// ================= EDIT =================
window.editPart = async (id) => {
    let snapshot = await getDocs(collection(db, "parts"));
    snapshot.forEach((docSnap) => {
        if (docSnap.id === id) {
            let p = docSnap.data();

            document.getElementById("partName").value = p.partName || "";
            document.getElementById("buyerName").value = p.buyerName || "";
            document.getElementById("styleNo").value = p.styleNo || "";
            document.getElementById("poNo").value = p.poNo || "";
            document.getElementById("orderQty").value = p.orderQty || "";
            document.getElementById("color").value = p.color || "";
            document.getElementById("deliveryDate").value = p.deliveryDate || "";

            setCheckedValues("print-cb", p.print || "");
            setCheckedValues("embroidery-cb", p.embroidery || "");

            editingId = id;
            document.getElementById("savePart").innerHTML = "✏️ Update";
            document.getElementById("cancelEdit").style.display = "inline-block";

            if (typeof showSection === 'function') showSection('entry');
        }
    });
};


// ================= DELETE =================
window.deletePart = async (id) => {
    if (confirm("Delete this Part?")) {
        await deleteDoc(doc(db, "parts", id));
        showToast("Deleted Successfully", "success");
        loadParts();
    }
};


// ================= CANCEL EDIT =================
document.getElementById("cancelEdit").onclick = () => {
    editingId = null;
    clearForm();
    document.getElementById("savePart").innerHTML = " Save Part";
    document.getElementById("cancelEdit").style.display = "none";
};


// ================= SEARCH =================
document.getElementById("searchBox").addEventListener("keyup", () => {
    let value = document.getElementById("searchBox").value.toLowerCase();
    let rows = document.querySelectorAll("#partTable tr");
    rows.forEach(row => {
        let text = row.innerText.toLowerCase();
        row.style.display = text.includes(value) ? "" : "none";
    });
});


// ================= CLEAR =================
function clearForm() {
    document.getElementById("partName").value = "";
    document.getElementById("buyerName").value = "";
    document.getElementById("styleNo").value = "";
    document.getElementById("poNo").value = "";
    document.getElementById("orderQty").value = "";
    document.getElementById("color").value = "";
    document.getElementById("deliveryDate").value = "";

    document.querySelectorAll(".print-cb").forEach(cb => cb.checked = false);
    document.querySelectorAll(".embroidery-cb").forEach(cb => cb.checked = false);
}
