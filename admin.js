import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { auth, db } from "./firebase-config.js";

const loginPanel = document.querySelector("#loginPanel");
const adminPanel = document.querySelector("#adminPanel");
const emailInput = document.querySelector("#emailInput");
const passwordInput = document.querySelector("#passwordInput");
const loginButton = document.querySelector("#loginButton");
const logoutButton = document.querySelector("#logoutButton");
const loginStatus = document.querySelector("#loginStatus");
const totalCount = document.querySelector("#totalCount");
const validCount = document.querySelector("#validCount");
const freeCount = document.querySelector("#freeCount");
const searchInput = document.querySelector("#searchInput");
const filterInput = document.querySelector("#filterInput");
const codesList = document.querySelector("#codesList");

let codes = [];

function formatDate(value) {
  if (!value?.toDate) return "Sin fecha";
  return value.toDate().toLocaleString("es-CL");
}

function render() {
  const search = searchInput.value.trim().toUpperCase();
  const filter = filterInput.value;
  const filtered = codes.filter((item) => {
    const matchesSearch = !search || item.code.includes(search);
    const matchesFilter =
      filter === "all" ||
      (filter === "free" && !item.validated) ||
      (filter === "validated" && item.validated);
    return matchesSearch && matchesFilter;
  });

  totalCount.textContent = `Total: ${codes.length}`;
  validCount.textContent = `Validados: ${codes.filter((item) => item.validated).length}`;
  freeCount.textContent = `Disponibles: ${codes.filter((item) => !item.validated).length}`;

  codesList.innerHTML = filtered.map((item) => `
    <article class="code-row ${item.validated ? "used" : ""}">
      <div>
        <strong>${item.code}</strong>
        <span>${item.validated ? `Validado: ${formatDate(item.validatedAt)}` : "Disponible"}</span>
      </div>
      <div class="row-actions">
        <a class="secondary link-button" href="./?c=${item.code}" target="_blank" rel="noopener">Abrir</a>
        <button class="secondary" type="button" data-reset="${item.code}" ${item.validated ? "" : "disabled"}>Resetear</button>
      </div>
    </article>
  `).join("");
}

async function loadCodes() {
  codesList.innerHTML = "<p class=\"status\">Cargando codigos...</p>";
  const snapshot = await getDocs(query(collection(db, "codes"), orderBy("code")));
  codes = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  render();
}

async function resetCode(code) {
  await updateDoc(doc(db, "codes", code), {
    validated: false,
    validatedAt: null,
    resetAt: serverTimestamp()
  });
  const item = codes.find((entry) => entry.code === code);
  if (item) {
    item.validated = false;
    item.validatedAt = null;
  }
  render();
}

loginButton.addEventListener("click", async () => {
  loginStatus.textContent = "Entrando...";
  try {
    await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
    loginStatus.textContent = "";
  } catch {
    loginStatus.textContent = "No se pudo entrar. Revisa correo y clave.";
  }
});

logoutButton.addEventListener("click", () => signOut(auth));
searchInput.addEventListener("input", render);
filterInput.addEventListener("change", render);

codesList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-reset]");
  if (!button) return;
  button.disabled = true;
  await resetCode(button.dataset.reset);
});

onAuthStateChanged(auth, async (user) => {
  loginPanel.classList.toggle("hidden", Boolean(user));
  adminPanel.classList.toggle("hidden", !user);
  if (user) await loadCodes();
});
