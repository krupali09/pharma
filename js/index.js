// import { db } from "./firebase-config.js";
// import { ref, push, update, onValue } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

// const deliveriesRef = ref(db, "deliveries");
// const deliverySelect = document.getElementById("deliverySelect");
// const nameI = document.getElementById("name");
// const phoneI = document.getElementById("phone");
// const addressI = document.getElementById("address");
// const dateI = document.getElementById("date");
// const rxDetailsI = document.getElementById("rxDetails");
// const addBtn = document.getElementById("addBtn");
// const updateBtn = document.getElementById("updateBtn");
// const messageEl = document.getElementById("message");

// let deliveriesData = {};
// let selectedKey = null;

// // function extractYMD(dateString) {
// //     if (!dateString) return "";
// //     if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

// //     const d = new Date(dateString);
// //     if (isNaN(d)) return "";

// //     const year = d.getFullYear();
// //     const month = String(d.getMonth() + 1).padStart(2, "0");
// //     const day = String(d.getDate()).padStart(2, "0");
// //     return `${year}-${month}-${day}`;
// // }


// onValue(deliveriesRef, (snapshot) => {
//     deliveriesData = snapshot.val() || {};

//     const latestPerName = {};
//     Object.entries(deliveriesData).forEach(([key, delivery]) => {
//         if (!latestPerName[delivery.name] || delivery.timestamp > latestPerName[delivery.name].timestamp) {
//             latestPerName[delivery.name] = { key, ...delivery };
//         }
//     });

//     deliverySelect.innerHTML = `<option value="">-- New Entry --</option>`;
//     Object.values(latestPerName).forEach(({ key, name }) => {
//         const opt = document.createElement("option");
//         opt.value = key;
//         opt.textContent = name;
//         deliverySelect.appendChild(opt);
//     });

//     resetForm();
// });

// deliverySelect.addEventListener("change", () => {
//     const key = deliverySelect.value;
//     if (!key) {
//         resetForm();
//         return;
//     }

//     const d = deliveriesData[key];
//     nameI.value = d.name;
//     phoneI.value = d.phone;
//     addressI.value = d.address;
//     rxDetailsI.value = "";
//     dateI.value = extractYMD(d.date);

//     selectedKey = key;
//     updateBtn.disabled = false;
//     messageEl.textContent = `Editing ${d.name}.`;
//     messageEl.style.color = "blue";
// });

// document.getElementById("deliveryForm").addEventListener("submit", (e) => {
//     e.preventDefault();
//     if (!updateBtn.disabled) return;
//     addDelivery();
// });

// addBtn.addEventListener("click", addDelivery);

// function addDelivery() {
//     const name = nameI.value.trim();
//     const phone = phoneI.value.trim();
//     const address = addressI.value.trim();
//     const date = dateI.value; // Keep this as string only
//     const rxDetails = rxDetailsI.value.trim();

//     if (!name || !phone || !address || !date || !rxDetails) {
//         messageEl.textContent = "Please fill all fields.";
//         messageEl.style.color = "red";
//         return;
//     }

//     push(deliveriesRef, {
//         name,
//         phone,
//         address,
//         date,
//         rxDetails,
//         timestamp: Date.now()
//     })
//         .then(() => {
//             messageEl.textContent = "Delivery added successfully!";
//             messageEl.style.color = "green";
//             setTimeout(() => resetForm(), 2000);
//         })
//         .catch((err) => {
//             messageEl.textContent = "Error: " + err.message;
//             messageEl.style.color = "red";
//         });
// }

// updateBtn.addEventListener("click", () => {
//     if (!selectedKey) return;

//     const name = nameI.value.trim();
//     const phone = phoneI.value.trim();
//     const address = addressI.value.trim();

//     if (!name || !phone || !address) {
//         messageEl.textContent = "Name, phone, and address required for update.";
//         messageEl.style.color = "red";
//         return;
//     }

//     update(ref(db, "deliveries/" + selectedKey), {
//         name,
//         phone,
//         address,
//         timestamp: Date.now()
//     })
//         .then(() => {
//             messageEl.textContent = "Details updated!";
//             messageEl.style.color = "green";
//             setTimeout(() => resetForm(), 2000);
//         })
//         .catch((err) => {
//             messageEl.textContent = "Error: " + err.message;
//             messageEl.style.color = "red";
//         });
// });

// function resetForm() {
//     nameI.value = "";
//     phoneI.value = "";
//     addressI.value = "";
//     dateI.value = "";
//     rxDetailsI.value = "";
//     addBtn.disabled = false;
//     updateBtn.disabled = true;
//     messageEl.textContent = "";
//     selectedKey = null;
//     deliverySelect.value = "";
// }

// document.getElementById("goScheduledBtn").addEventListener("click", () => {
//     window.location.href = "scheduled.html";
// });



import { db } from "./firebase-config.js";
import { ref, push, update, onValue } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

const deliveriesRef = ref(db, "deliveries");
const deliverySelect = document.getElementById("deliverySelect");
const nameI = document.getElementById("name");
const phoneI = document.getElementById("phone");
const addressI = document.getElementById("address");
const dateI = document.getElementById("date");
const rxDetailsI = document.getElementById("rxDetails");
const addBtn = document.getElementById("addBtn");
const updateBtn = document.getElementById("updateBtn");
const messageEl = document.getElementById("message");

let deliveriesData = {};
let selectedKey = null;

function extractYMD(dateString) {
    if (!dateString) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    const d = new Date(dateString);
    if (isNaN(d)) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// 🔁 Load and populate dropdown
onValue(deliveriesRef, (snapshot) => {
    deliveriesData = snapshot.val() || {};

    const latestPerName = {};
    Object.entries(deliveriesData).forEach(([key, delivery]) => {
        if (!latestPerName[delivery.name] || delivery.timestamp > latestPerName[delivery.name].timestamp) {
            latestPerName[delivery.name] = { key, ...delivery };
        }
    });

    deliverySelect.innerHTML = `<option value="">-- New Entry --</option>`;
    Object.values(latestPerName).forEach(({ key, name }) => {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = name;
        deliverySelect.appendChild(opt);
    });

    resetForm();
});

// 📥 Handle selection change
deliverySelect.addEventListener("change", () => {
    const key = deliverySelect.value;
    if (!key) {
        resetForm();
        return;
    }

    const d = deliveriesData[key];
    nameI.value = d.name;
    phoneI.value = d.phone;
    addressI.value = d.address;
    rxDetailsI.value = "";
    dateI.value = extractYMD(d.date);

    selectedKey = key;
    messageEl.textContent = `Editing ${d.name}.`;
    messageEl.style.color = "blue";
});

// 📤 Handle form submit
document.getElementById("deliveryForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (selectedKey) {
        updateDelivery(); // 👈 calls update
    } else {
        addDelivery(); // 👈 calls add
    }
});

// ➕ Add Delivery Function
function addDelivery() {
    const name = nameI.value.trim();
    const phone = phoneI.value.trim();
    const address = addressI.value.trim();
    const date = dateI.value;
    const rxDetails = rxDetailsI.value.trim();

    if (!name || !phone || !address || !date || !rxDetails) {
        messageEl.textContent = "Please fill all fields.";
        messageEl.style.color = "red";
        return;
    }

    push(deliveriesRef, {
        name,
        phone,
        address,
        date,
        rxDetails,
        timestamp: Date.now()
    })
        .then(() => {
            messageEl.textContent = "Delivery added successfully!";
            messageEl.style.color = "green";
            setTimeout(() => resetForm(), 2000);
        })
        .catch((err) => {
            messageEl.textContent = "Error: " + err.message;
            messageEl.style.color = "red";
        });
}

// ✏️ Update Delivery Function
function updateDelivery() {
    if (!selectedKey) return;

    const name = nameI.value.trim();
    const phone = phoneI.value.trim();
    const address = addressI.value.trim();

    if (!name || !phone || !address) {
        messageEl.textContent = "Name, phone, and address required for update.";
        messageEl.style.color = "red";
        return;
    }

    update(ref(db, "deliveries/" + selectedKey), {
        name,
        phone,
        address,
        timestamp: Date.now()
    })
        .then(() => {
            messageEl.textContent = "Details updated!";
            messageEl.style.color = "green";
            setTimeout(() => resetForm(), 2000);
        })
        .catch((err) => {
            messageEl.textContent = "Error: " + err.message;
            messageEl.style.color = "red";
        });
}

// 🔄 Reset Form Function
function resetForm() {
    nameI.value = "";
    phoneI.value = "";
    addressI.value = "";
    dateI.value = "";
    rxDetailsI.value = "";
    messageEl.textContent = "";
    selectedKey = null;
    deliverySelect.value = "";
}

// 🔗 Go to scheduled.html
document.getElementById("goScheduledBtn").addEventListener("click", () => {
    window.location.href = "scheduled.html";
});

// 👆 You can also call `addDelivery()` and `updateDelivery()` manually as needed
addBtn.addEventListener("click", addDelivery);
updateBtn.addEventListener("click", updateDelivery);
