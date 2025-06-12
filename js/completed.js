import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDtyJOEYKBfOHfIVuJVlZcONg4kn56EK7E",
    authDomain: "deliveryweb-9b674.firebaseapp.com",
    databaseURL: "https://deliveryweb-9b674-default-rtdb.firebaseio.com",
    projectId: "deliveryweb-9b674",
    storageBucket: "deliveryweb-9b674.appspot.com",
    messagingSenderId: "207216653138",
    appId: "1:207216653138:web:272fe92f54eab2329c408b"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const deliveriesRef = ref(db, "deliveries");

const monthTabs = document.getElementById("monthTabs");
const completedContainer = document.getElementById("completedContainer");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");

const monthNames = [
    "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
let currentMonthIndex = 0;
let deliveriesByMonth = {};

onValue(deliveriesRef, (snapshot) => {
    const data = snapshot.val() || {};
    deliveriesByMonth = {};

    Object.values(data).forEach(delivery => {
        if (delivery.signature && delivery.date) {
            const d = new Date(delivery.date + "T00:00:00-05:00");
            const year = d.getFullYear();
            if (year === 2025) {
                const month = d.getMonth();
                if (!deliveriesByMonth[month]) deliveriesByMonth[month] = [];
                deliveriesByMonth[month].push(delivery);
            }
        }
    });

    Object.keys(deliveriesByMonth).forEach(month => {
        deliveriesByMonth[month].sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    createMonthTabs();
    renderDeliveriesForMonth(currentMonthIndex);
});

function createMonthTabs() {
    monthTabs.innerHTML = "";
    monthNames.forEach((month, i) => {
        const btn = document.createElement("button");
        btn.textContent = month;
        btn.className = i === currentMonthIndex ? "active" : "";
        btn.style.color = i === currentMonthIndex ? "#000" : "#555";
        btn.onmouseover = () => btn.style.color = "#007BFF";
        btn.onmouseout = () => btn.style.color = i === currentMonthIndex ? "#000" : "#555";
        btn.onclick = () => {
            currentMonthIndex = i;
            renderDeliveriesForMonth(i);
            updateActiveTab();
        };
        monthTabs.appendChild(btn);
    });
}

function updateActiveTab() {
    Array.from(monthTabs.children).forEach((btn, i) => {
        btn.className = i === currentMonthIndex ? "active" : "";
        btn.style.color = i === currentMonthIndex ? "#000" : "#555";
    });
}

function renderDeliveriesForMonth(monthIndex) {
    completedContainer.innerHTML = "";
    const firebaseMonthIndex = monthIndex + 5;
    const deliveries = deliveriesByMonth[firebaseMonthIndex] || [];

    if (deliveries.length === 0) {
        completedContainer.textContent = "Looks like the packages are still in the waiting room for month of " + monthNames[monthIndex];
        return;
    }

    const table = document.createElement("table");
    table.className = "completed-table";

    const headerRow = table.insertRow();
    ["Date", "Name", "Phone", "Address", "RX Details", "Driver", "Signature"].forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        headerRow.appendChild(th);
    });

    deliveries.forEach(delivery => {
        const row = table.insertRow();

        const dateCell = row.insertCell();
        const d = new Date(delivery.date + "T00:00:00-05:00");
        const options = { month: "long", day: "numeric", year: "numeric", timeZone: "America/Toronto" };
        dateCell.textContent = d.toLocaleDateString("en-US", options);

        row.insertCell().textContent = delivery.name || "";
        row.insertCell().textContent = delivery.phone || "";
        row.insertCell().textContent = delivery.address || "";
        row.insertCell().textContent = delivery.rxDetails || "";
        row.insertCell().textContent = delivery.driver || "";

        const signatureCell = row.insertCell();
        if (delivery.signature) {
            const img = document.createElement("img");
            img.src = delivery.signature;
            img.style.width = "100px";
            signatureCell.appendChild(img);
        } else {
            signatureCell.textContent = "-";
        }
    });

    completedContainer.appendChild(table);
}

downloadPdfBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;

    html2canvas(completedContainer).then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");

        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save("completed_deliveries.pdf");
    });
});
