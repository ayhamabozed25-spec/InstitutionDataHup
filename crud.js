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

    let managerName = "—";
    if (data.manager) {
      const managerSnap = await getDoc(data.manager);
      managerName = managerSnap.exists() ? managerSnap.data().name : "—";
    }

    list.innerHTML += `
      <div class="card p-2 mb-2">
        <b>${data.name}</b>
        <div>الأب: ${parentName} — المدير: ${managerName}</div>
        <div class="mt-2">
          <button class="btn btn-sm btn-warning" onclick="openEdit('${d.id}','${type}')">تعديل</button>
          <button class="btn btn-sm btn-danger" onclick="deleteHierarchy('${d.id}')">حذف</button>
        </div>
      </div>
    `;
  }
}

/* ------------------ إضافة عنصر للهيكلية ------------------ */

async function addHierarchy(type, nameInputId, parentSelectId, managerSelectId) {
  const name = document.getElementById(nameInputId).value;
  const parentId = parentSelectId ? document.getElementById(parentSelectId).value : "";
  const managerId = managerSelectId ? document.getElementById(managerSelectId).value : "";

  if (!name.trim()) return alert("أدخل الاسم");

  const parentRef = parentId ? doc(db, "Hierarchy", parentId) : null;
  const managerRef = managerId ? doc(db, "Employees", managerId) : null;

  await addDoc(collection(db, "Hierarchy"), {
    name,
    type,
    parent: parentRef,
    manager: managerRef
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

function loadInstitutions() { loadHierarchy("Institution", "orgList"); }
function loadDepartments() { loadHierarchy("Department", "deptList"); }
function loadSections() { loadHierarchy("Section", "divList"); }

/* ------------------ تحميل القوائم المنسدلة للهيكلية ------------------ */

async function loadSelect(type, selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const snap = await getDocs(collection(db, "Hierarchy"));
  select.innerHTML = "<option value=''>اختر</option>";

  snap.forEach(d => {
    const data = d.data();
    if (data.type === type) {
      select.innerHTML += `<option value="${d.id}">${data.name}</option>`;
    }
  });
}

/* ------------------ تحميل القوائم المنسدلة للموظفين ------------------ */

async function loadEmployeesSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const snap = await getDocs(collection(db, "Employees"));
  select.innerHTML = "<option value=''>اختر موظف</option>";

  snap.forEach(d => {
    const data = d.data();
    select.innerHTML += `<option value="${d.id}">${data.name}</option>`;
  });
}

/* ------------------ إضافة موظف ------------------ */

async function addEmployee() {
  const name = document.getElementById("empName").value;
  const hierarchyId = document.getElementById("empHierarchySelect").value;

  if (!name.trim() || !hierarchyId) return alert("أدخل البيانات كاملة");

  await addDoc(collection(db, "Employees"), {
    name,
    hierarchy: doc(db, "Hierarchy", hierarchyId)
  });

  document.getElementById("empName").value = "";
  loadEmployees();
}

/* ------------------ عرض الموظفين ------------------ */

async function loadEmployees() {
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
        <div class="mt-2">
          <button class="btn btn-sm btn-warning" onclick="openEdit('${d.id}','Employee')">تعديل</button>
          <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${d.id}')">حذف</button>
        </div>
      </div>
    `;
  }
}

async function deleteEmployee(id) {
  await deleteDoc(doc(db, "Employees", id));
  loadEmployees();
}

/* ------------------ الأجهزة ------------------ */

async function addDevice() {
  const name = document.getElementById("deviceName").value;
  const serial = document.getElementById("deviceSerial").value;
  const empId = document.getElementById("deviceEmployeeSelect").value;

  if (!name.trim() || !serial.trim() || !empId) return alert("أدخل البيانات كاملة");

  await addDoc(collection(db, "Devices"), {
    name,
    serial,
    employee: doc(db, "Employees", empId)
  });

  document.getElementById("deviceName").value = "";
  document.getElementById("deviceSerial").value = "";
  loadDevices();
}

async function loadDevices() {
  const list = document.getElementById("devicesList");
  if (!list) return;
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "Devices"));

  for (const d of snap.docs) {
    const data = d.data();

    let empName = "—";
    if (data.employee) {
      const eSnap = await getDoc(data.employee);
      empName = eSnap.exists() ? eSnap.data().name : "—";
    }

    list.innerHTML += `
      <div class="card p-2 mb-2">
        <b>${data.name}</b> — سيريال: ${data.serial} — مستلم: ${empName}
        <div class="mt-2">
          <button class="btn btn-sm btn-danger" onclick="deleteDevice('${d.id}')">حذف</button>
        </div>
      </div>
    `;
  }
}

async function deleteDevice(id) {
  await deleteDoc(doc(db, "Devices", id));
  loadDevices();
}

/* ------------------ المركبات ------------------ */

async function addVehicle() {
  const plate = document.getElementById("vehiclePlate").value;
  const model = document.getElementById("vehicleModel").value;
  const empId = document.getElementById("vehicleEmployeeSelect").value;

  if (!plate.trim() || !model.trim() || !empId) return alert("أدخل البيانات كاملة");

  await addDoc(collection(db, "Vehicles"), {
    plate,
    model,
    employee: doc(db, "Employees", empId)
  });

  document.getElementById("vehiclePlate").value = "";
  document.getElementById("vehicleModel").value = "";
  loadVehicles();
}

async function loadVehicles() {
  const list = document.getElementById("vehiclesList");
  if (!list) return;
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "Vehicles"));

  for (const d of snap.docs) {
    const data = d.data();

    let empName = "—";
    if (data.employee) {
      const eSnap = await getDoc(data.employee);
      empName = eSnap.exists() ? eSnap.data().name : "—";
    }

    list.innerHTML += `
      <div class="card p-2 mb-2">
        <b>${data.plate}</b> — موديل: ${data.model} — مستلم: ${empName}
        <div class="mt-2">
          <button class="btn btn-sm btn-danger" onclick="deleteVehicle('${d.id}')">حذف</button>
        </div>
      </div>
    `;
  }
}

async function deleteVehicle(id) {
  await deleteDoc(doc(db, "Vehicles", id));
  loadVehicles();
}

/* ------------------ الأثاث ------------------ */

async function addFurniture() {
  const name = document.getElementById("furnitureName").value;
  const code = document.getElementById("furnitureCode").value;
  const empId = document.getElementById("furnitureEmployeeSelect").value;

  if (!name.trim() || !code.trim() || !empId) return alert("أدخل البيانات كاملة");

  await addDoc(collection(db, "Furniture"), {
    name,
    code,
    employee: doc(db, "Employees", empId)
  });

  document.getElementById("furnitureName").value = "";
  document.getElementById("furnitureCode").value = "";
  loadFurniture();
}

async function loadFurniture() {
  const list = document.getElementById("furnitureList");
  if (!list) return;
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "Furniture"));

  for (const d of snap.docs) {
    const data = d.data();

    let empName = "—";
    if (data.employee) {
      const eSnap = await getDoc(data.employee);
      empName = eSnap.exists() ? eSnap.data().name : "—";
    }

    list.innerHTML += `
      <div class="card p-2 mb-2">
        <b>${data.name}</b> — كود: ${data.code} — مستلم: ${empName}
        <div class="mt-2">
          <button class="btn btn-sm btn-danger" onclick="deleteFurniture('${d.id}')">حذف</button>
        </div>
      </div>
    `;
  }
}

async function deleteFurniture(id) {
  await deleteDoc(doc(db, "Furniture", id));
  loadFurniture();
}

/* ------------------ مودال التعديل (هيكلية + موظفين) ------------------ */

async function openEdit(id, type) {
  document.getElementById("editId").value = id;
  document.getElementById("editType").value = type;

  const nameInput = document.getElementById("editName");
  const select = document.getElementById("editSelect");

  select.innerHTML = "";
  select.style.display = "block";

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
      select.value = snap.data().parent.id;
    }
  }

  if (type === "Section") {
    await loadSelect("Department", "editSelect");
    const snap = await getDoc(doc(db, "Hierarchy", id));
    nameInput.value = snap.data().name;

    if (snap.data().parent) {
      select.value = snap.data().parent.id;
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
}

/* ------------------ حفظ التعديل ------------------ */

async function saveEdit() {
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
}

/* ------------------ تحميل كل البيانات ------------------ */

function reloadAll() {
  loadInstitutions();
  loadDepartments();
  loadSections();
  loadEmployees();

  loadSelect("Institution", "deptOrgSelect");
  loadSelect("Department", "divDeptSelect");
  loadSelect("Section", "empHierarchySelect");

  loadEmployeesSelect("orgManagerSelect");
  loadEmployeesSelect("deptManagerSelect");
  loadEmployeesSelect("divManagerSelect");

  loadEmployeesSelect("deviceEmployeeSelect");
  loadEmployeesSelect("vehicleEmployeeSelect");
  loadEmployeesSelect("furnitureEmployeeSelect");

  loadDevices();
  loadVehicles();
  loadFurniture();
}

window.onload = reloadAll;

/* ------------------ ربط الدوال بالـ window ------------------ */

window.addHierarchy = addHierarchy;
window.deleteHierarchy = deleteHierarchy;

window.loadHierarchy = loadHierarchy;
window.loadInstitutions = loadInstitutions;
window.loadDepartments = loadDepartments;
window.loadSections = loadSections;

window.addEmployee = addEmployee;
window.loadEmployees = loadEmployees;
window.deleteEmployee = deleteEmployee;

window.addDevice = addDevice;
window.loadDevices = loadDevices;
window.deleteDevice = deleteDevice;

window.addVehicle = addVehicle;
window.loadVehicles = loadVehicles;
window.deleteVehicle = deleteVehicle;

window.addFurniture = addFurniture;
window.loadFurniture = loadFurniture;
window.deleteFurniture = deleteFurniture;

window.openEdit = openEdit;
window.saveEdit = saveEdit;
window.reloadAll = reloadAll;
