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
    const goCompletedBtn = document.getElementById("goCompletedBtn");

    const rxModal = document.getElementById("rxModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const clearSignatureBtn = document.getElementById("clearSignatureBtn");
    const rxForm = document.getElementById("rxForm");
    const entryKeyInput = document.getElementById("entryKeyInput");
    const canvas = document.getElementById("signatureCanvas");

    let signaturePad;

    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        const ctx = canvas.getContext("2d");
        ctx.scale(ratio, ratio);
    }

    function initSignaturePad() {
        resizeCanvas();
        if (signaturePad) {
            signaturePad.off();
        }
        signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgba(255, 255, 255, 0)',
            penColor: 'black',
            minWidth: 1,
            maxWidth: 2.5,
        });
    }

    window.addEventListener("resize", () => {
        resizeCanvas();
        signaturePad.clear();
    });

    initSignaturePad();

    // Modal and button setup
    const editModal = document.getElementById("editModal");
    const editForm = document.getElementById("editForm");
    const editKeyInput = document.getElementById("editKeyInput");
    const editDateInput = document.getElementById("editDate");
    const deleteEntryBtn = document.getElementById("deleteEntryBtn");
    const editModalTitle = document.getElementById("editModalTitle");
    const closeEditModalBtn = document.getElementById("closeEditModalBtn");

    function openModal(modal) {
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
        if (modal === rxModal) {
            setTimeout(() => {
                resizeCanvas();
                signaturePad.clear();
            }, 100); // ensure canvas is properly resized when modal appears
        }
    }

    function closeModal(modal) {
        modal.style.display = "none";
        document.body.style.overflow = "";
    }

    closeModalBtn?.addEventListener("click", () => closeModal(rxModal));
    closeEditModalBtn?.addEventListener("click", () => closeModal(editModal));
    goBackBtn?.addEventListener("click", () => (window.location.href = "index.html"));
    goCompletedBtn?.addEventListener("click", () => (window.location.href = "completed.html"));
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

    function formatDate(dateStr) {
        const d = new Date(dateStr + "T00:00:00-05:00");
        return d.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            timeZone: "America/Toronto",
        });
    }

    function renderGroupedTable(data) {
        const entries = Object.entries(data)
            .map(([key, d]) => ({ key, ...d }))
            .filter(e => !e.deleted && !e.signature)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        container.innerHTML = "";
        if (entries.length === 0) {
            container.textContent = "No deliveries available.";
            return;
        }

        const table = document.createElement("table");
        table.className = "schedule-table";

        const headerRow = table.insertRow();
        const headers = ["Name", "Phone", "Address", "RX Details", "Driver", "Signature", "Actions"];
        headers.forEach(headerText => {
            const th = document.createElement("th");
            th.textContent = headerText;
            headerRow.appendChild(th);
        });

        const groupedEntries = {};
        entries.forEach(entry => {
            const formattedDate = formatDate(entry.date);
            if (!groupedEntries[formattedDate]) groupedEntries[formattedDate] = [];
            groupedEntries[formattedDate].push(entry);
        });

        const sortedDates = Object.keys(groupedEntries).sort((a, b) => new Date(a) - new Date(b));

        sortedDates.forEach(date => {
            const groupHeaderRow = table.insertRow();
            const cell = groupHeaderRow.insertCell();
            cell.colSpan = headers.length;
            cell.className = "date-group-header";
            cell.textContent = date;

            groupedEntries[date].forEach(entry => {
                const row = table.insertRow();
                row.innerHTML = `
                    <td><span class="label">Name: </span>${entry.name}</td>
                    <td><span class="label">Phone: </span>${entry.phone}</td>
                    <td><span class="label">Location: </span>${entry.address}</td>
                    <td><span class="label">RxDetails: </span>${entry.rxDetails || "-"}</td>
                    <td><span class="label">Driver: </span>${entry.driver || "-"}</td>
                    <td><span class="label">Sign: </span>${entry.signature ? `<img src="${entry.signature}" width="100">` : "-"}</td>
                    <td class="tdclass">
                        <button data-key="${entry.key}" class="loadBtn" ${entry.signature ? "disabled" : ""}>Sign</button>
                        <button data-key="${entry.key}" class="editBtn" ${entry.signature ? "disabled" : ""}>Reschedule</button>
                    </td>
                `;
            });
        });

        container.appendChild(table);
        attachRowHandlers(data);
    }

    function attachRowHandlers(data) {
        container.querySelectorAll(".loadBtn").forEach(btn => {
            btn.addEventListener("click", () => {
                const key = btn.dataset.key;
                const entry = data[key];
                entryKeyInput.value = key;
                signaturePad.clear();

                if (entry.signature) {
                    const image = new Image();
                    image.onload = () => {
                        resizeCanvas();
                        canvas.getContext("2d").drawImage(image, 0, 0);
                    };
                    image.src = entry.signature;
                }

                document.getElementById("rxModalTitle").textContent = `Signed For ${entry.name}`;
                openModal(rxModal);
            });
        });

        rxForm?.addEventListener("submit", e => {
            e.preventDefault();
            const key = entryKeyInput.value;

            if (signaturePad.isEmpty()) {
                showMessage("Please provide a signature before saving.", "red");
                return;
            }

            const updated = {
                signature: signaturePad.toDataURL(),
            };

            update(ref(db, "deliveries/" + key), updated)
                .then(() => {
                    showMessage("Signature saved", "green");
                    closeModal(rxModal);
                    signaturePad.clear();
                })
                .catch(err => showMessage(err.message, "red"));
        });

        container.querySelectorAll(".editBtn").forEach(btn => {
            btn.addEventListener("click", () => {
                const key = btn.dataset.key;
                const entry = data[key];
                editKeyInput.value = key;
                editDateInput.value = entry.date || "";
                if (editModalTitle) {
                    editModalTitle.textContent = `Reschedule Delivery for ${entry.name || ""}`;
                }
                openModal(editModal);
            });
        });
    }

    editForm?.addEventListener("submit", e => {
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
            .catch(err => showMessage(err.message, "red"));
    });

    function showMessage(txt, col) {
        messageEl.textContent = txt;
        messageEl.style.color = col;
        setTimeout(() => {
            messageEl.textContent = "";
        }, 3000);
    }
});
