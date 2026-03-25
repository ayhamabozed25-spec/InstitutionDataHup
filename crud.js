import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ------------------ تحميل الهيكلية ------------------ */

async function loadHierarchy(type, listElementId) {
  const list = document.getElementById(listElementId);
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "Hierarchy"));

  for (const d of snap.docs) {
    const data = d.data();
    if (data.type !== type) continue;

    let parentName = "—";

    if (data.parent) {
      const parentSnap = await getDoc(data.parent);
      parentName = parentSnap.exists() ? parentSnap.data().name : "—";
    }

    list.innerHTML += `
      <div class="card p-2 mb-2">
        <b>${data.name}</b> — الأب: ${parentName}
        <div>
          <button class="btn btn-sm btn-warning" onclick="openEdit('${d.id}','${type}')">تعديل</button>
          <button class="btn btn-sm btn-danger" onclick="deleteHierarchy('${d.id}')">حذف</button>
        </div>
      </div>
    `;
  }
}

/* ------------------ إضافة عنصر للهيكلية ------------------ */

async function addHierarchy(type, nameInputId, parentSelectId) {
  const name = document.getElementById(nameInputId).value;
  const parentId = parentSelectId ? document.getElementById(parentSelectId).value : "";

  if (!name.trim()) return alert("أدخل الاسم");

  const parentRef = parentId ? doc(db, "Hierarchy", parentId) : null;

  await addDoc(collection(db, "Hierarchy"), {
    name,
    type,
    parent: parentRef
  });

  document.getElementById(nameInputId).value = "";

  reloadAll();
}

/* ------------------ حذف عنصر ------------------ */

async function deleteHierarchy(id) {
  await deleteDoc(doc(db, "Hierarchy", id));
  reloadAll();
}

/* ------------------ تحميل المؤسسات / الأقسام / الشعب ------------------ */

window.loadInstitutions = () => loadHierarchy("Institution", "orgList");
window.loadDepartments = () => loadHierarchy("Department", "deptList");
window.loadSections = () => loadHierarchy("Section", "divList");

/* ------------------ تحميل القوائم المنسدلة ------------------ */

async function loadSelect(type, selectId) {
  const snap = await getDocs(collection(db, "Hierarchy"));
  const select = document.getElementById(selectId);
  select.innerHTML = "<option value=''>اختر</option>";

  snap.forEach(d => {
    const data = d.data();
    if (data.type === type) {
      select.innerHTML += `<option value="${d.id}">${data.name}</option>`;
    }
  });
}

/* ------------------ إضافة موظف ------------------ */

window.addEmployee = async function () {
  const name = document.getElementById("empName").value;
  const hierarchyId = document.getElementById("empHierarchySelect").value;

  if (!name.trim() || !hierarchyId) return alert("أدخل البيانات كاملة");

  await addDoc(collection(db, "Employees"), {
    name,
    hierarchy: doc(db, "Hierarchy", hierarchyId)
  });

  document.getElementById("empName").value = "";
  loadEmployees();
};

/* ------------------ عرض الموظفين ------------------ */

window.loadEmployees = async function () {
  const list = document.getElementById("empList");
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "Employees"));

  for (const d of snap.docs) {
    const data = d.data();

    let hierarchyName = "—";
    if (data.hierarchy) {
      const hSnap = await getDoc(data.hierarchy);
      hierarchyName = hSnap.exists() ? hSnap.data().name : "—";
    }

    list.innerHTML += `
      <div class="card p-2 mb-2">
        <b>${data.name}</b> — مرتبط بـ: ${hierarchyName}
        <div>
          <button class="btn btn-sm btn-warning" onclick="openEdit('${d.id}','Employee')">تعديل</button>
          <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${d.id}')">حذف</button>
        </div>
      </div>
    `;
  }
};

window.deleteEmployee = async function (id) {
  await deleteDoc(doc(db, "Employees", id));
  loadEmployees();
};

/* ------------------ مودال التعديل ------------------ */

window.openEdit = async function (id, type) {
  document.getElementById("editId").value = id;
  document.getElementById("editType").value = type;

  const nameInput = document.getElementById("editName");
  const select = document.getElementById("editSelect");

  select.innerHTML = "";

  if (type === "Institution") {
    const snap = await getDoc(doc(db, "Hierarchy", id));
    nameInput.value = snap.data().name;
    select.style.display = "none";
  }

  if (type === "Department") {
    await loadSelect("Institution", "editSelect");
    const snap = await getDoc(doc(db, "Hierarchy", id));
    nameInput.value = snap.data().name;

    if (snap.data().parent) {
      const parentId = snap.data().parent.id;
      select.value = parentId;
    }
  }

  if (type === "Section") {
    await loadSelect("Department", "editSelect");
    const snap = await getDoc(doc(db, "Hierarchy", id));
    nameInput.value = snap.data().name;

    if (snap.data().parent) {
      const parentId = snap.data().parent.id;
      select.value = parentId;
    }
  }

  if (type === "Employee") {
    await loadSelect("Section", "editSelect");
    const snap = await getDoc(doc(db, "Employees", id));
    nameInput.value = snap.data().name;

    if (snap.data().hierarchy) {
      select.value = snap.data().hierarchy.id;
    }
  }

  new bootstrap.Modal(document.getElementById("editModal")).show();
};

/* ------------------ حفظ التعديل ------------------ */

window.saveEdit = async function () {
  const id = document.getElementById("editId").value;
  const type = document.getElementById("editType").value;
  const name = document.getElementById("editName").value;
  const parentId = document.getElementById("editSelect").value;

  if (type === "Employee") {
    await updateDoc(doc(db, "Employees", id), {
      name,
      hierarchy: doc(db, "Hierarchy", parentId)
    });
    loadEmployees();
  } else {
    await updateDoc(doc(db, "Hierarchy", id), {
      name,
      parent: parentId ? doc(db, "Hierarchy", parentId) : null
    });
    reloadAll();
  }

  bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
};

/* ------------------ تحميل كل البيانات ------------------ */

function reloadAll() {
  loadInstitutions();
  loadDepartments();
  loadSections();
  loadEmployees();

  loadSelect("Institution", "deptOrgSelect");
  loadSelect("Department", "divDeptSelect");
  loadSelect("Section", "empHierarchySelect");
}

window.onload = reloadAll;

window.addHierarchy = addHierarchy;

