import { auth, provider, db } from "./firebase.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { 
    doc, 
    getDoc, 
    updateDoc, 
    addDoc, 
    collection, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


let editingId = null;

// ================= USER CHECK =================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById("userRole").innerText = user.displayName || "Operator";
        
        // URL-এ ?edit=xxx থাকলে ডেটা লোড করুন
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        if (editId) {
            await loadEditData(editId);
        }
    } else {
        window.location.href = "index.html";
    }
});


// ================= LOGOUT =================
document.getElementById("logout").onclick = async () => {
    await signOut(auth);
    window.location.href = "index.html";
};


// ================= LOAD EDIT DATA =================
async function loadEditData(id) {
    try {
        const docRef = doc(db, "excessCutting", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
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

            editingId = id;
            document.getElementById("saveExcess").innerHTML = "✏️ Update";
            document.getElementById("cancelExcessEdit").style.display = "inline-block";
            showToast("Editing mode enabled", "success");
        }
    } catch (err) {
        console.error(err);
        showToast("Failed to load data", "error");
    }
}


// ================= SAVE / UPDATE =================
document.getElementById("saveExcess").onclick = async () => {
    let data = {
        srNo: document.getElementById("srNo").value.trim(),
        floor: document.getElementById("floor").value.trim(),
        buyerName: document.getElementById("buyerName").value.trim(),
        styleNo: document.getElementById("styleNo").value.trim(),
        tableNo: document.getElementById("tableNo").value.trim(),
        cutQty: Number(document.getElementById("cutQty").value) || 0,
        excessQty: Number(document.getElementById("excessQty").value) || 0,
        color: document.getElementById("color").value.trim(),
        deliveryDate: document.getElementById("deliveryDate").value,
        remarks: document.getElementById("remarks").value.trim()
    };

    if (editingId) {
        // আপডেট
        await updateDoc(doc(db, "excessCutting", editingId), data);
        showToast("Updated Successfully", "success");
        
        // আপডেট শেষে ১ সেকেন্ড পর View Data পেজে ফিরে যাবে
        setTimeout(() => {
            window.location.href = "excess-view.html";
        }, 1000);
    } else {
        // নতুন এন্ট্রি
        data.createdAt = serverTimestamp();
        await addDoc(collection(db, "excessCutting"), data);
        showToast("Saved Successfully", "success");
        clearForm();
    }
};


// ================= CANCEL EDIT =================
document.getElementById("cancelExcessEdit").onclick = () => {
    editingId = null;
    clearForm();
    document.getElementById("saveExcess").innerHTML = "💾 Save Entry";
    document.getElementById("cancelExcessEdit").style.display = "none";
    
    // URL থেকে edit প্যারামিটার মুছে ফেলুন
    const url = new URL(window.location);
    url.searchParams.delete('edit');
    window.history.replaceState({}, '', url);
};


// ================= CLEAR =================
function clearForm() {
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
