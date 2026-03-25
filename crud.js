import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// إضافة مؤسسة
export async function addOrganization() {
  const name = document.getElementById("orgName").value;

  if (!name.trim()) return alert("أدخل اسم المؤسسة");

  await addDoc(collection(db, "organizations"), {
    name: name
  });

  document.getElementById("orgName").value = "";
  loadOrganizations();
}

// تحميل المؤسسات
export async function loadOrganizations() {
  const list = document.getElementById("orgList");
  list.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "organizations"));

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;

    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <span>${data.name}</span>
      <button onclick="deleteOrganization('${id}')">حذف</button>
    `;

    list.appendChild(div);
  });
}

// حذف مؤسسة
export async function deleteOrganization(id) {
  await deleteDoc(doc(db, "organizations", id));
  loadOrganizations();
}

// تحميل البيانات عند فتح الصفحة
window.onload = () => {
  loadOrganizations();
};

// لجعل الدوال متاحة في HTML
window.addOrganization = addOrganization;
window.deleteOrganization = deleteOrganization;
