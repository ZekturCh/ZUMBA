import { doc, getDoc, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const codeLabel = document.querySelector("#codeLabel");
const qrContainer = document.querySelector("#qr");
const statusEl = document.querySelector("#status");
const guestNameInput = document.querySelector("#guestNameInput");
const reserveButton = document.querySelector("#reserveButton");

const params = new URLSearchParams(window.location.search);
const code = (params.get("c") || "").trim().toUpperCase();

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function getStatus(data) {
  if (data.status) return data.status;
  if (data.validated) return "validated";
  return "free";
}

function drawQr() {
  qrContainer.innerHTML = "";
  if (!code || !window.QRCode) return;
  const url = new URL(window.location.href);
  url.searchParams.set("c", code);
  new QRCode(qrContainer, {
    text: url.toString(),
    width: 220,
    height: 220,
    correctLevel: QRCode.CorrectLevel.H
  });
}

async function loadCode() {
  if (!/^[A-Z0-9]{5}$/.test(code)) {
    codeLabel.textContent = "Codigo invalido";
    setStatus("Este link no contiene un codigo valido.", "danger");
    return;
  }

  codeLabel.textContent = code;
  drawQr();

  const ref = doc(db, "codes", code);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    setStatus("QR no existe en el sistema.", "danger");
    return;
  }

  const data = snapshot.data();
  const status = getStatus(data);
  if (status === "validated") {
    setStatus("Este QR ya ha sido validado con otra persona.", "danger");
    return;
  }

  guestNameInput.classList.remove("hidden");
  reserveButton.disabled = false;

  if (status === "reserved") {
    guestNameInput.value = data.guestName || "";
    setStatus("Tu asistencia ya esta separada. Presenta este QR en la entrada.", "success");
    reserveButton.textContent = "Actualizar nombre";
    return;
  }

  setStatus("Este QR es unico. Presentalo en la entrada y no lo compartas con otra persona.", "success");
}

async function reserveCode() {
  reserveButton.disabled = true;
  setStatus("Confirmando asistencia...", "");

  try {
    const ref = doc(db, "codes", code);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error("missing");

      const data = snapshot.data();
      const status = getStatus(data);
      if (status === "validated") throw new Error("already-used");

      transaction.update(ref, {
        status: "reserved",
        guestName: guestNameInput.value.trim().slice(0, 60),
        reservedAt: serverTimestamp()
      });
    });

    reserveButton.textContent = "Actualizar nombre";
    reserveButton.disabled = false;
    setStatus("Asistencia separada. Guarda este QR para mostrarlo en la entrada.", "success");
  } catch (error) {
    if (error.message === "already-used") {
      setStatus("Este QR ya ha sido validado con otra persona.", "danger");
      return;
    }

    if (error.message === "missing") {
      setStatus("QR no existe en el sistema.", "danger");
      return;
    }

    reserveButton.disabled = false;
    setStatus("No se pudo confirmar. Revisa la conexion e intenta de nuevo.", "danger");
  }
}

reserveButton.addEventListener("click", reserveCode);
loadCode().catch(() => {
  setStatus("No se pudo consultar Firebase. Revisa la configuracion.", "danger");
});
