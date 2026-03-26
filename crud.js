// ===============================
//  Firebase Imports
// ===============================
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "./firebase.js";


// ===============================
//  تحميل الأقسام
// ===============================
async function loadDepartmentsSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const current = select.value;
  select.innerHTML = "<option value=''>اختر قسم</option>";

  const snap = await getDocs(collection(db, "Hierarchy"));
  snap.forEach(d => {
    const data = d.data();
    if (data.type === "Department") {
      select.innerHTML += `<option value="${d.id}">${data.name}</option>`;
    }
  });

  if (current) select.value = current;
}


// ===============================
//  تحميل الشعب حسب القسم
// ===============================
async function loadSectionsSelect(selectId, deptId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const current = select.value;
  select.innerHTML = "<option value=''>بدون شعبة</option>";

  if (!deptId) return;

  const snap = await getDocs(collection(db, "Hierarchy"));
  snap.forEach(d => {
    const data = d.data();
    if (data.type === "Section" && data.parent?.id === deptId) {
      select.innerHTML += `<option value="${d.id}">${data.name}</option>`;
    }
  });

  if (current) select.value = current;
}


// ===============================
//  تحميل الشعب عند اختيار قسم للموظف
// ===============================
async function loadSectionsForEmployee() {
  const deptId = document.getElementById("empDeptSelect")?.value;
  await loadSectionsSelect("empSectionSelect", deptId);
}


// ===============================
//  إضافة قسم
// ===============================
async function addDepartment() {
  const name = document.getElementById("deptName").value;
  const managerId = document.getElementById("deptManagerSelect").value;

  if (!name.trim()) return alert("أدخل اسم القسم");

  await addDoc(collection(db, "Hierarchy"), {
    name,
    type: "Department",
    parent: null,
    manager: managerId ? doc(db, "Employees", managerId) : null
  });

  document.getElementById("deptName").value = "";
  document.getElementById("deptManagerSearch").value = "";
  document.getElementById("deptManagerSelect").value = "";
  document.getElementById("deptManagerResults").innerHTML = "";

  alert("تم حفظ القسم بنجاح");
}


// ===============================
//  إضافة شعبة
// ===============================
async function addSection() {
  const name = document.getElementById("divName").value;
  const deptId = document.getElementById("divDeptSelect").value;
  const managerId = document.getElementById("divManagerSelect").value;

  if (!name.trim() || !deptId) return alert("أدخل البيانات كاملة");

  await addDoc(collection(db, "Hierarchy"), {
    name,
    type: "Section",
    parent: doc(db, "Hierarchy", deptId),
    manager: managerId ? doc(db, "Employees", managerId) : null
  });

  document.getElementById("divName").value = "";
  document.getElementById("divManagerSearch").value = "";
  document.getElementById("divManagerSelect").value = "";
  document.getElementById("divManagerResults").innerHTML = "";

  alert("تم حفظ الشعبة بنجاح");
}


// ===============================
//  إضافة موظف
// ===============================
async function addEmployee() {
  const name = document.getElementById("empName").value;
  const deptId = document.getElementById("empDeptSelect").value;
  const secId = document.getElementById("empSectionSelect").value;

  if (!name.trim()) return alert("أدخل اسم الموظف");

  let hierarchyRef = null;
  if (secId) hierarchyRef = doc(db, "Hierarchy", secId);
  else if (deptId) hierarchyRef = doc(db, "Hierarchy", deptId);

  await addDoc(collection(db, "Employees"), {
    name,
    hierarchy: hierarchyRef
  });

  document.getElementById("empName").value = "";
  document.getElementById("empDeptSelect").value = "";
  document.getElementById("empSectionSelect").innerHTML = "<option value=''>بدون شعبة</option>";

  alert("تم حفظ الموظف بنجاح");
}


// ===============================
//  إضافة جهاز
// ===============================
async function addDevice() {
  const name = document.getElementById("deviceName").value;
  const serial = document.getElementById("deviceSerial").value;
  const empId = document.getElementById("deviceEmpHidden").value;

  if (!name.trim() || !serial.trim()) return alert("أدخل البيانات كاملة");
  if (!empId) return alert("اختر موظف مستلم");

  await addDoc(collection(db, "Devices"), {
    name,
    serial,
    employee: doc(db, "Employees", empId)
  });

  document.getElementById("deviceName").value = "";
  document.getElementById("deviceSerial").value = "";
  document.getElementById("deviceEmpSearch").value = "";
  document.getElementById("deviceEmpHidden").value = "";
  document.getElementById("deviceEmpResults").innerHTML = "";

  alert("تم حفظ الجهاز");
}


// ===============================
//  إضافة مركبة
// ===============================
async function addVehicle() {
  const plate = document.getElementById("vehiclePlate").value;
  const model = document.getElementById("vehicleModel").value;
  const empId = document.getElementById("vehicleEmpHidden").value;

  if (!plate.trim() || !model.trim()) return alert("أدخل البيانات كاملة");
  if (!empId) return alert("اختر موظف مستلم");

  await addDoc(collection(db, "Vehicles"), {
    plate,
    model,
    employee: doc(db, "Employees", empId)
  });

  document.getElementById("vehiclePlate").value = "";
  document.getElementById("vehicleModel").value = "";
  document.getElementById("vehicleEmpSearch").value = "";
  document.getElementById("vehicleEmpHidden").value = "";
  document.getElementById("vehicleEmpResults").innerHTML = "";

  alert("تم حفظ المركبة");
}


// ===============================
//  إضافة أثاث
// ===============================
async function addFurniture() {
  const name = document.getElementById("furnitureName").value;
  const code = document.getElementById("furnitureCode").value;
  const empId = document.getElementById("furnitureEmpHidden").value;

  if (!name.trim() || !code.trim()) return alert("أدخل البيانات كاملة");
  if (!empId) return alert("اختر موظف مستلم");

  await addDoc(collection(db, "Furniture"), {
    name,
    code,
    employee: doc(db, "Employees", empId)
  });

  document.getElementById("furnitureName").value = "";
  document.getElementById("furnitureCode").value = "";
  document.getElementById("furnitureEmpSearch").value = "";
  document.getElementById("furnitureEmpHidden").value = "";
  document.getElementById("furnitureEmpResults").innerHTML = "";

  alert("تم حفظ الأثاث");
}


// ===============================
//  Autocomplete — البحث عن موظفين
// ===============================
async function searchEmployeesByName(text) {
  const results = [];
  if (!text.trim()) return results;

  const snap = await getDocs(collection(db, "Employees"));
  snap.forEach(d => {
    const data = d.data();
    if (data.name && data.name.includes(text)) {
      results.push({ id: d.id, name: data.name });
    }
  });

  return results;
}


// ===============================
//  Autocomplete — مدير قسم
// ===============================
async function searchManagerForDept(text) {
  const box = document.getElementById("deptManagerResults");
  box.innerHTML = "";

  const results = await searchEmployeesByName(text);
  results.forEach(r => {
    const div = document.createElement("div");
    div.textContent = r.name;
    div.onclick = () => {
      document.getElementById("deptManagerSearch").value = r.name;
      document.getElementById("deptManagerSelect").value = r.id;
      box.innerHTML = "";
    };
    box.appendChild(div);
  });
}


// ===============================
//  Autocomplete — مدير شعبة
// ===============================
async function searchManagerForSection(text) {
  const box = document.getElementById("divManagerResults");
  box.innerHTML = "";

  const results = await searchEmployeesByName(text);
  results.forEach(r => {
    const div = document.createElement("div");
    div.textContent = r.name;
    div.onclick = () => {
      document.getElementById("divManagerSearch").value = r.name;
      document.getElementById("divManagerSelect").value = r.id;
      box.innerHTML = "";
    };
    box.appendChild(div);
  });
}


// ===============================
//  Autocomplete — موظف للجهاز
// ===============================
async function searchEmployeeForDevice(text) {
  const box = document.getElementById("deviceEmpResults");
  box.innerHTML = "";

  const results = await searchEmployeesByName(text);
  results.forEach(r => {
    const div = document.createElement("div");
    div.textContent = r.name;
    div.onclick = () => {
      document.getElementById("deviceEmpSearch").value = r.name;
      document.getElementById("deviceEmpHidden").value = r.id;
      box.innerHTML = "";
    };
    box.appendChild(div);
  });
}


// ===============================
//  Autocomplete — موظف للمركبة
// ===============================
async function searchEmployeeForVehicle(text) {
  const box = document.getElementById("vehicleEmpResults");
  box.innerHTML = "";

  const results = await searchEmployeesByName(text);
  results.forEach(r => {
    const div = document.createElement("div");
    div.textContent = r.name;
    div.onclick = () => {
      document.getElementById("vehicleEmpSearch").value = r.name;
      document.getElementById("vehicleEmpHidden").value = r.id;
      box.innerHTML = "";
    };
    box.appendChild(div);
  });
}


// ===============================
//  Autocomplete — موظف للأثاث
// ===============================
async function searchEmployeeForFurniture(text) {
  const box = document.getElementById("furnitureEmpResults");
  box.innerHTML = "";

  const results = await searchEmployeesByName(text);
  results.forEach(r => {
    const div = document.createElement("div");
    div.textContent = r.name;
    div.onclick = () => {
      document.getElementById("furnitureEmpSearch").value = r.name;
      document.getElementById("furnitureEmpHidden").value = r.id;
      box.innerHTML = "";
    };
    box.appendChild(div);
  });
}


// ===============================
//  دوال التعديل (موديلات)
// ===============================

// --- تعديل قسم ---
async function openEditDepartment(id) {
  const snap = await getDoc(doc(db, "Hierarchy", id));
  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("editDeptId").value = id;
  document.getElementById("editDeptName").value = data.name || "";

  await loadEmployeesSelect("editDeptManager");
  document.getElementById("editDeptManager").value = data.manager?.id || "";

  new bootstrap.Modal(document.getElementById("editDepartmentModal")).show();
}

async function saveDepartmentEdit() {
  const id = document.getElementById("editDeptId").value;
  const name = document.getElementById("editDeptName").value;
  const managerId = document.getElementById("editDeptManager").value;

  await updateDoc(doc(db, "Hierarchy", id), {
    name,
    manager: managerId ? doc(db, "Employees", managerId) : null
  });

  bootstrap.Modal.getInstance(document.getElementById("editDepartmentModal")).hide();
  alert("تم تعديل القسم");
}


// --- تعديل شعبة ---
async function openEditSection(id) {
  const snap = await getDoc(doc(db, "Hierarchy", id));
  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("editSectionId").value = id;
  document.getElementById("editSectionName").value = data.name || "";

  await loadDepartmentsSelect("editSectionDept");
  document.getElementById("editSectionDept").value = data.parent?.id || "";

  await loadEmployeesSelect("editSectionManager");
  document.getElementById("editSectionManager").value = data.manager?.id || "";

  new bootstrap.Modal(document.getElementById("editSectionModal")).show();
}

async function saveSectionEdit() {
  const id = document.getElementById("editSectionId").value;
  const name = document.getElementById("editSectionName").value;
  const deptId = document.getElementById("editSectionDept").value;
  const managerId = document.getElementById("editSectionManager").value;

  await updateDoc(doc(db, "Hierarchy", id), {
    name,
    parent: doc(db, "Hierarchy", deptId),
    manager: managerId ? doc(db, "Employees", managerId) : null
  });

  bootstrap.Modal.getInstance(document.getElementById("editSectionModal")).hide();
  alert("تم تعديل الشعبة");
}


// --- تعديل موظف ---
async function openEditEmployee(id) {
  const snap = await getDoc(doc(db, "Employees", id));
  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("editEmpId").value = id;
  document.getElementById("editEmpName").value = data.name || "";

  await loadDepartmentsSelect("editEmpDept");

  let deptId = "";
  let secId = "";

  if (data.hierarchy) {
    const hSnap = await getDoc(data.hierarchy);
    if (hSnap.exists()) {
      const hData = hSnap.data();
      if (hData.type === "Department") {
        deptId = data.hierarchy.id;
      } else {
        secId = data.hierarchy.id;
        deptId = hData.parent?.id || "";
      }
    }
  }

  document.getElementById("editEmpDept").value = deptId;
  await loadSectionsSelect("editEmpSection", deptId);
  document.getElementById("editEmpSection").value = secId;

  new bootstrap.Modal(document.getElementById("editEmployeeModal")).show();
}

async function loadEditEmpSections() {
  const deptId = document.getElementById("editEmpDept").value;
  await loadSectionsSelect("editEmpSection", deptId);
}

async function saveEmployeeEdit() {
  const id = document.getElementById("editEmpId").value;
  const name = document.getElementById("editEmpName").value;
  const deptId = document.getElementById("editEmpDept").value;
  const secId = document.getElementById("editEmpSection").value;

  let hierarchyRef = null;
  if (secId) hierarchyRef = doc(db, "Hierarchy", secId);
  else if (deptId) hierarchyRef = doc(db, "Hierarchy", deptId);

  await updateDoc(doc(db, "Employees", id), {
    name,
    hierarchy: hierarchyRef
  });

  bootstrap.Modal.getInstance(document.getElementById("editEmployeeModal")).hide();
  alert("تم تعديل الموظف");
}


// --- تعديل جهاز ---
async function openEditDevice(id) {
  const snap = await getDoc(doc(db, "Devices", id));
  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("editDeviceId").value = id;
  document.getElementById("editDeviceName").value = data.name || "";
  document.getElementById("editDeviceSerial").value = data.serial || "";

  await loadEmployeesSelect("editDeviceEmployee");
  document.getElementById("editDeviceEmployee").value = data.employee?.id || "";

  new bootstrap.Modal(document.getElementById("editDeviceModal")).show();
}

async function saveDeviceEdit() {
  const id = document.getElementById("editDeviceId").value;
  const name = document.getElementById("editDeviceName").value;
  const serial = document.getElementById("editDeviceSerial").value;
  const empId = document.getElementById("editDeviceEmployee").value;

  await updateDoc(doc(db, "Devices", id), {
    name,
    serial,
    employee: empId ? doc(db, "Employees", empId) : null
  });

  bootstrap.Modal.getInstance(document.getElementById("editDeviceModal")).hide();
  alert("تم تعديل الجهاز");
}


// --- تعديل مركبة ---
async function openEditVehicle(id) {
  const snap = await getDoc(doc(db, "Vehicles", id));
  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("editVehicleId").value = id;
  document.getElementById("editVehiclePlate").value = data.plate || "";
  document.getElementById("editVehicleModel").value = data.model || "";

  await loadEmployeesSelect("editVehicleEmployee");
  document.getElementById("editVehicleEmployee").value = data.employee?.id || "";

  new bootstrap.Modal(document.getElementById("editVehicleModal")).show();
}

async function saveVehicleEdit() {
  const id = document.getElementById("editVehicleId").value;
  const plate = document.getElementById("editVehiclePlate").value;
  const model = document.getElementById("editVehicleModel").value;
  const empId = document.getElementById("editVehicleEmployee").value;

  await updateDoc(doc(db, "Vehicles", id), {
    plate,
    model,
    employee: empId ? doc(db, "Employees", empId) : null
  });

  bootstrap.Modal.getInstance(document.getElementById("editVehicleModal")).hide();
  alert("تم تعديل المركبة");
}


// --- تعديل أثاث ---
async function openEditFurniture(id) {
  const snap = await getDoc(doc(db, "Furniture", id));
  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("editFurnitureId").value = id;
  document.getElementById("editFurnitureName").value = data.name || "";
  document.getElementById("editFurnitureCode").value = data.code || "";

  await loadEmployeesSelect("editFurnitureEmployee");
  document.getElementById("editFurnitureEmployee").value = data.employee?.id || "";

  new bootstrap.Modal(document.getElementById("editFurnitureModal")).show();
}

async function saveFurnitureEdit() {
  const id = document.getElementById("editFurnitureId").value;
  const name = document.getElementById("editFurnitureName").value;
  const code = document.getElementById("editFurnitureCode").value;
  const empId = document.getElementById("editFurnitureEmployee").value;

  await updateDoc(doc(db, "Furniture", id), {
    name,
    code,
    employee: empId ? doc(db, "Employees", empId) : null
  });

  bootstrap.Modal.getInstance(document.getElementById("editFurnitureModal")).hide();
  alert("تم تعديل الأثاث");
}


// ===============================
//  تحميل الموظفين لأي قائمة (مدير قسم/شعبة/أصل)
// ===============================
async function loadEmployeesSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const current = select.value;
  select.innerHTML = "<option value=''>بدون اختيار</option>";

  const snap = await getDocs(collection(db, "Employees"));
  snap.forEach(d => {
    const data = d.data();
    select.innerHTML += `<option value="${d.id}">${data.name}</option>`;
  });

  if (current) select.value = current;
}


// ===============================
//  ربط جميع الدوال بـ window
// ===============================
window.addDepartment = addDepartment;
window.addSection = addSection;
window.addEmployee = addEmployee;
window.addDevice = addDevice;
window.addVehicle = addVehicle;
window.addFurniture = addFurniture;

window.loadDepartmentsSelect = loadDepartmentsSelect;
window.loadSectionsSelect = loadSectionsSelect;
window.loadSectionsForEmployee = loadSectionsForEmployee;

window.searchManagerForDept = searchManagerForDept;
window.searchManagerForSection = searchManagerForSection;
window.searchEmployeeForDevice = searchEmployeeForDevice;
window.searchEmployeeForVehicle = searchEmployeeForVehicle;
window.searchEmployeeForFurniture = searchEmployeeForFurniture;

window.openEditDepartment = openEditDepartment;
window.saveDepartmentEdit = saveDepartmentEdit;

window.openEditSection = openEditSection;
window.saveSectionEdit = saveSectionEdit;

window.openEditEmployee = openEditEmployee;
window.saveEmployeeEdit = saveEmployeeEdit;
window.loadEditEmpSections = loadEditEmpSections;

window.openEditDevice = openEditDevice;
window.saveDeviceEdit = saveDeviceEdit;

window.openEditVehicle = openEditVehicle;
window.saveVehicleEdit = saveVehicleEdit;

window.openEditFurniture = openEditFurniture;
window.saveFurnitureEdit = saveFurnitureEdit;


// ===============================
//  تهيئة أولية
// ===============================
window.addEventListener("DOMContentLoaded", async () => {
  await loadDepartmentsSelect("divDeptSelect");
  await loadDepartmentsSelect("empDeptSelect");
});
