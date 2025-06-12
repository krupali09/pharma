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
const driverI = document.getElementById("driver");

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

onValue(deliveriesRef, (snapshot) => {
    deliveriesData = snapshot.val() || {};

    const uniqueByName = {};
    Object.entries(deliveriesData).forEach(([key, delivery]) => {
        if (!uniqueByName[delivery.name]) {
            uniqueByName[delivery.name] = { key, data: delivery };
        }
    });

    deliverySelect.innerHTML = `<option value="">-- New Entry --</option>`;
    Object.values(uniqueByName).forEach(({ key, data }) => {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = data.name;
        deliverySelect.appendChild(opt);
    });

    if (selectedKey && deliveriesData[selectedKey]) {
        deliverySelect.value = selectedKey;
    } else {
        resetForm();
    }
});

// In deliverySelect change event, remove disabling addBtn:
deliverySelect.addEventListener("change", () => {
    const key = deliverySelect.value;

    if (!key) {
        resetForm();
        addBtn.disabled = false;
        updateBtn.disabled = true;
        return;
    }

    const d = deliveriesData[key];
    selectedKey = key;

    nameI.value = d.name || "";
    phoneI.value = d.phone || "";
    addressI.value = d.address || "";

    dateI.value = "";      // always blank for new schedule input
    rxDetailsI.value = "";
    driverI.value = "";

    // messageEl.textContent = `Editing ${d.name || "record"}. Only Name, Phone, and Address can be updated.`;
    messageEl.style.color = "blue";

    // Keep both buttons enabled so user can add new delivery after editing
    addBtn.disabled = false;
    updateBtn.disabled = false;
});


addBtn.addEventListener("click", (e) => {
    e.preventDefault();
    addDelivery();
});

updateBtn.addEventListener("click", (e) => {
    e.preventDefault();
    updateDelivery();
});

function addDelivery() {
    const name = nameI.value.trim();
    const phone = phoneI.value.trim();
    const address = addressI.value.trim();
    const date = dateI.value;
    const rxDetails = rxDetailsI.value.trim();
    const driver = driverI.value.trim();

    if (!name || !phone || !address || !date || !rxDetails || !driver) {
        messageEl.textContent = "Please fill all fields including driver.";
        messageEl.style.color = "red";
        return;
    }

    push(deliveriesRef, {
        name,
        phone,
        address,
        date,
        rxDetails,
        driver,
        timestamp: Date.now(),
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

function updateDelivery() {
    if (!selectedKey) {
        messageEl.textContent = "Please select a delivery to update.";
        messageEl.style.color = "red";
        return;
    }

    const name = nameI.value.trim();
    const phone = phoneI.value.trim();
    const address = addressI.value.trim();

    if (!name || !phone || !address) {
        messageEl.textContent = "Please fill Name, Phone, and Address fields.";
        messageEl.style.color = "red";
        return;
    }

    // Only update these three fields, leave others untouched
    update(ref(db, "deliveries/" + selectedKey), {
        name,
        phone,
        address,
        timestamp: Date.now(),
    })
        .then(() => {
            messageEl.textContent = "Details updated!";
            messageEl.style.color = "green";
        })
        .catch((err) => {
            messageEl.textContent = "Error: " + err.message;
            messageEl.style.color = "red";
        });
}

function resetForm() {
    nameI.value = "";
    phoneI.value = "";
    addressI.value = "";
    dateI.value = "";
    rxDetailsI.value = "";
    driverI.value = "";
    messageEl.textContent = "";
    selectedKey = null;
    deliverySelect.value = "";

    addBtn.disabled = false;
    updateBtn.disabled = true;
}

document.getElementById("goScheduledBtn").addEventListener("click", () => {
    window.location.href = "scheduled.html";
});
