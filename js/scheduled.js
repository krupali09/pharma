import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

window.addEventListener("DOMContentLoaded", () => {
    const firebaseConfig = {
        apiKey: "AIzaSyDtyJOEYKBfOHfIVuJVlZcONg4kn56EK7E",
        authDomain: "deliveryweb-9b674.firebaseapp.com",
        databaseURL: "https://deliveryweb-9b674-default-rtdb.firebaseio.com",
        projectId: "deliveryweb-9b674",
        storageBucket: "deliveryweb-9b674.appspot.com",
        messagingSenderId: "207216653138",
        appId: "1:207216653138:web:272fe92f54eab2329c408b"
    };

    initializeApp(firebaseConfig);
    const db = getDatabase();
    const deliveriesRef = ref(db, "deliveries");

    const container = document.getElementById("deliveriesContainer");
    const messageEl = document.getElementById("message");
    const goBackBtn = document.getElementById("goBackBtn");
    const downloadCsvBtn = document.getElementById("downloadCsvBtn");
    const downloadPdfBtn = document.getElementById("downloadPdfBtn");

    // Signature modal elements
    const rxModal = document.getElementById("rxModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const clearSignatureBtn = document.getElementById("clearSignatureBtn");
    const rxForm = document.getElementById("rxForm");
    const entryKeyInput = document.getElementById("entryKeyInput");
    const rxDetails = document.getElementById("rxDetails");
    const canvas = document.getElementById("signatureCanvas");
    const signaturePad = new SignaturePad(canvas);

    // Reschedule modal elements
    const editModal = document.getElementById("editModal");
    const editForm = document.getElementById("editForm");
    const editKeyInput = document.getElementById("editKeyInput");
    const editDateInput = document.getElementById("editDate");
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    const deleteEntryBtn = document.getElementById("deleteEntryBtn");
    const editModalTitle = document.getElementById("editModalTitle");
    const closeEditModalBtn = document.getElementById("closeEditModalBtn");

    // Helper functions to open/close modal + disable scroll on body
    function openModal(modal) {
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
    }

    function closeModal(modal) {
        modal.style.display = "none";
        document.body.style.overflow = "";
    }

    closeModalBtn?.addEventListener("click", () => closeModal(rxModal));
    closeEditModalBtn?.addEventListener("click", () => closeModal(editModal));
    cancelEditBtn?.addEventListener("click", () => closeModal(editModal));

    goBackBtn?.addEventListener("click", () => (window.location.href = "index.html"));
    clearSignatureBtn?.addEventListener("click", () => signaturePad.clear());

    deleteEntryBtn?.addEventListener("click", () => {
        const key = editKeyInput.value;
        if (confirm("Are you sure you want to delete this entry?")) {
            update(ref(db, "deliveries/" + key), { deleted: true })
                .then(() => {
                    showMessage("Entry deleted", "green");
                    closeModal(editModal);
                })
                .catch((err) => showMessage(err.message, "red"));
        }
    });

    onValue(deliveriesRef, (snapshot) => {
        const data = snapshot.val() || {};
        renderGroupedTable(data);
    });

    function renderGroupedTable(data) {
        const entries = Object.entries(data)
            .map(([key, d]) => ({ key, ...d }))
            .filter((e) => !e.deleted && new Date(e.date).getTime() >= todayMidnight())
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        container.innerHTML = "";
        if (entries.length === 0) {
            container.textContent = "No upcoming deliveries.";
            return;
        }

        const table = document.createElement("table");
        table.className = "schedule-table";

        const headerRow = table.insertRow();
        const headers = ["Name", "Phone", "Address", "RX Details", "Driver", "Signature", "Actions"];
        headers.forEach((headerText) => {
            const th = document.createElement("th");
            th.textContent = headerText;
            headerRow.appendChild(th);
        });

        const groupedEntries = {};
        entries.forEach((entry) => {
            const entryDate = new Date(entry.date);
            const day = entryDate.getDate();
            const formattedDate = formatDate(entry.date);

            if (!groupedEntries[day]) {
                groupedEntries[day] = [];
            }

            groupedEntries[day].push({ ...entry, formattedDate });
        });

        const sortedDays = Object.keys(groupedEntries).sort((a, b) => a - b);
        sortedDays.forEach((day) => {
            const groupHeaderRow = table.insertRow();
            const cell = groupHeaderRow.insertCell();
            cell.colSpan = 7;
            cell.className = "date-group-header";
            cell.textContent = `${groupedEntries[day][0].formattedDate}`;

            groupedEntries[day].forEach((entry) => {
                const row = table.insertRow();
                row.innerHTML = `
          <td>${entry.name}</td>
          <td>${entry.phone}</td>
          <td>${entry.address}</td>
          <td>${entry.rxDetails || "-"}</td>
          <td>${entry.driver || "-"}</td>
          <td>${entry.signature ? `<img src="${entry.signature}" width="100">` : "-"}</td>
          <td>
            <button data-key="${entry.key}" class="loadBtn" ${entry.signature ? "disabled" : ""}>Sign</button>
            <button data-key="${entry.key}" class="editBtn" ${entry.signature ? "disabled" : ""}>Reschedule</button>
          </td>
        `;
            });
        });

        container.appendChild(table);
        attachRowHandlers(data);
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr + "T00:00:00-05:00");
        return d.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            timeZone: "America/Toronto",
        });
    }

    function todayMidnight() {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return t.getTime();
    }

    function attachRowHandlers(data) {
        // Inside attachRowHandlers -> loadBtn
        container.querySelectorAll(".loadBtn").forEach((btn) =>
            btn.addEventListener("click", () => {
                const key = btn.dataset.key;
                const entry = data[key];

                entryKeyInput.value = key;
                signaturePad.clear();

                if (entry.signature) {
                    const image = new Image();
                    image.onload = () => {
                        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
                    };
                    image.src = entry.signature;
                }

                document.getElementById("rxModalTitle").textContent = `Received and Signed`;
                // document.getElementById("signatureLabel").childNodes[0].textContent = `Signature for ${entry.name}:\n`;

                openModal(rxModal);
            })
        );

        // Inside rxForm submit
        rxForm?.addEventListener("submit", (e) => {
            e.preventDefault();
            const key = entryKeyInput.value;
            const updated = {
                signature: signaturePad.isEmpty() ? "" : signaturePad.toDataURL(),
            };
            update(ref(db, "deliveries/" + key), updated)
                .then(() => {
                    showMessage("Signature saved", "green");
                    closeModal(rxModal);
                    signaturePad.clear();
                })
                .catch((err) => showMessage(err.message, "red"));
        });


        container.querySelectorAll(".editBtn").forEach((btn) =>
            btn.addEventListener("click", () => {
                const key = btn.dataset.key;
                const entry = data[key];

                editKeyInput.value = key;
                editDateInput.value = entry.date || "";
                if (editModalTitle) {
                    editModalTitle.textContent = `Reschedule Delivery for ${entry.name || ""}`;
                }

                openModal(editModal);
            })
        );
    }

    rxForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        const key = entryKeyInput.value;
        const updated = {
            rxDetails: rxDetails.value.trim(),
            signature: signaturePad.isEmpty() ? "" : signaturePad.toDataURL(),
        };
        update(ref(db, "deliveries/" + key), updated)
            .then(() => {
                showMessage("Updated successfully", "green");
                closeModal(rxModal);
                signaturePad.clear();
            })
            .catch((err) => showMessage(err.message, "red"));
    });

    editForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        const key = editKeyInput.value;
        const newDate = editDateInput.value;

        if (!newDate) {
            showMessage("Please select a valid date.", "red");
            return;
        }

        update(ref(db, "deliveries/" + key), { date: newDate })
            .then(() => {
                showMessage("Delivery rescheduled successfully.", "green");
                closeModal(editModal);
            })
            .catch((err) => showMessage(err.message, "red"));
    });

    downloadCsvBtn?.addEventListener("click", () => {
        onValue(
            deliveriesRef,
            (snap) => {
                const data = snap.val() || {};
                const now = Date.now();
                const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
                const rows = [["Name", "Phone", "Address", "Date", "RX Details", "Driver"]];
                Object.values(data).forEach((ent) => {
                    if (ent.timestamp >= weekAgo) {
                        rows.push([ent.name, ent.phone, ent.address, ent.date, ent.rxDetails, ent.driver]);
                    }
                });
                const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "weekly_deliveries.csv";
                link.click();
            },
            { onlyOnce: true }
        );
    });

    downloadPdfBtn?.addEventListener("click", () => {
        const content = document.body;

        html2canvas(content).then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jspdf.jsPDF("p", "mm", "a4");

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

            pdf.save("deliveries.pdf");
        });
    });

    function showMessage(txt, col) {
        messageEl.textContent = txt;
        messageEl.style.color = col;
    }
});
