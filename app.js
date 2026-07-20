import { auth, provider, db } from "./firebase.js";

import {
    signInWithPopup,
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
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";




// ================= LOGIN =================


document.getElementById("googleLogin").onclick = async()=>{

    try{

        await signInWithPopup(auth, provider);

    }

    catch(error){

        console.log(error);

        alert(error.message);

    }

};




// ================= LOGOUT =================


document.getElementById("logout").onclick = async()=>{

    await signOut(auth);

};





// ================= USER CHECK =================


onAuthStateChanged(auth,(user)=>{


    if(user){


        document.getElementById("loginBox").style.display="none";

        document.getElementById("dashboard").style.display="block";


        document.getElementById("userRole").innerText =
        user.displayName || "Operator";


        loadParts();


    }

    else{


        document.getElementById("loginBox").style.display="block";

        document.getElementById("dashboard").style.display="none";


    }


});






let editingId = null;





// ================= SAVE / UPDATE =================


document.getElementById("savePart").onclick = async()=>{


let data={


partName:
document.getElementById("partName").value,


buyerName:
document.getElementById("buyerName").value,


styleNo:
document.getElementById("styleNo").value,


poNo:
document.getElementById("poNo").value,


orderQty:
Number(document.getElementById("orderQty").value),


color:
document.getElementById("color").value,


print:
document.getElementById("print").value,


embroidery:
document.getElementById("embroidery").value,


deliveryDate:
document.getElementById("deliveryDate").value



};




if(editingId){


await updateDoc(

doc(db,"parts",editingId),

data

);


alert("Updated Successfully ✅");


editingId=null;


document.getElementById("savePart").innerHTML="💾 Save Part";


document.getElementById("cancelEdit").style.display="none";



}

else{


data.createdAt = serverTimestamp();


await addDoc(

collection(db,"parts"),

data

);



alert("Saved Successfully ✅");


}




clearForm();


loadParts();



};









// ================= LOAD PART =================



async function loadParts(){


let table=document.getElementById("partTable");


table.innerHTML="";


let snapshot = await getDocs(collection(db,"parts"));



let total=0;

let totalQty=0;



snapshot.forEach((docSnap)=>{


let p=docSnap.data();


total++;

totalQty += Number(p.orderQty || 0);




table.innerHTML += `


<tr>


<td>${p.partName || ""}</td>


<td>${p.buyerName || ""}</td>


<td>${p.styleNo || ""}</td>


<td>${p.orderQty || 0}</td>


<td>${p.color || ""}</td>


<td>${p.print || ""}</td>


<td>${p.embroidery || ""}</td>


<td>${p.deliveryDate || ""}</td>


<td>${p.poNo || ""}</td>



<td>


<button class="edit-btn"
onclick="editPart('${docSnap.id}')">

✏️ Edit

</button>



<button class="delete-btn"
onclick="deletePart('${docSnap.id}')">

🗑 Delete

</button>


</td>



</tr>


`;



});




document.getElementById("totalPart").innerText=total;


document.getElementById("totalQty").innerText=totalQty;



}









// ================= EDIT =================


window.editPart = async(id)=>{


let snapshot =
await getDocs(collection(db,"parts"));



snapshot.forEach((docSnap)=>{


if(docSnap.id === id){


let p=docSnap.data();



document.getElementById("partName").value=p.partName;

document.getElementById("buyerName").value=p.buyerName;

document.getElementById("styleNo").value=p.styleNo;

document.getElementById("poNo").value=p.poNo;

document.getElementById("orderQty").value=p.orderQty;

document.getElementById("color").value=p.color;

document.getElementById("print").value=p.print;

document.getElementById("embroidery").value=p.embroidery;

document.getElementById("deliveryDate").value=p.deliveryDate;



editingId=id;


document.getElementById("savePart").innerHTML="✏️ Update";


document.getElementById("cancelEdit").style.display="inline-block";



}


});


};







// ================= DELETE =================


window.deletePart = async(id)=>{


if(confirm("Delete this Part?")){


await deleteDoc(

doc(db,"parts",id)

);



alert("Deleted Successfully 🗑");


loadParts();


}


};







// ================= CANCEL EDIT =================


document.getElementById("cancelEdit").onclick=()=>{


editingId=null;


clearForm();


document.getElementById("savePart").innerHTML="💾 Save Part";


document.getElementById("cancelEdit").style.display="none";


};






// ================= SEARCH =================


document.getElementById("searchBox").addEventListener("keyup",()=>{


let value =
document.getElementById("searchBox").value.toLowerCase();



let rows =
document.querySelectorAll("#partTable tr");



rows.forEach(row=>{


let text=row.innerText.toLowerCase();


row.style.display =
text.includes(value) ? "" : "none";


});


});







// ================= CLEAR =================


function clearForm(){


document.getElementById("partName").value="";

document.getElementById("buyerName").value="";

document.getElementById("styleNo").value="";

document.getElementById("poNo").value="";

document.getElementById("orderQty").value="";

document.getElementById("color").value="";

document.getElementById("print").value="";

document.getElementById("embroidery").value="";

document.getElementById("deliveryDate").value="";


}