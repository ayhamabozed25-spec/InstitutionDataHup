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
//  Autocomplete — موظف للجهاز/المركبة/الأثاث
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
//  تعديل موظف (مع حفظ القيم السابقة)
// ===============================
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
    hierarchy: hierarchyRef,
    oldDept: deptId || null,
    oldSection: secId || null
  });

  bootstrap.Modal.getInstance(document.getElementById("editEmployeeModal")).hide();
  alert("تم تعديل الموظف");
}


// ===============================
//  إضافة مبنى / مؤسسة
// ===============================
async function addBuilding() {
  const name = document.getElementById("b_name").value;
  const type = document.getElementById("b_type").value;
  const address = document.getElementById("b_address").value;

  const projects = Array.from(document.querySelectorAll("input[name='projects[]']")).map(i => i.value).filter(v => v);
  const challenges = Array.from(document.querySelectorAll("input[name='challenges[]']")).map(i => i.value).filter(v => v);
  const services = Array.from(document.querySelectorAll("input[name='services[]']")).map(i => i.value).filter(v => v);
  const opportunities = Array.from(document.querySelectorAll("input[name='opportunities[]']")).map(i => i.value).filter(v => v);

  await addDoc(collection(db, "Buildings"), {
    name, type, address, projects, challenges, services, opportunities
  });

  alert("تم حفظ المؤسسة بنجاح");
}


// ===============================
//  دوال الحقول الديناميكية
// ===============================
window.addProjectField = () => {
  const input = document.createElement("input");
  input.type = "text"; input.name = "projects[]"; input.className = "form-control mb-2";
  document.getElementById("projectsContainer").appendChild(input);
};
window.addChallengeField = () => {
  const input = document.createElement("input");
  input.type = "text"; input.name = "challenges[]"; input.className = "form-control mb-2";
  document.getElementById("challengesContainer").appendChild(input);
};
window.addServiceField = () => {
  const input = document.createElement("input");
  input.type = "text"; input.name = "services[]"; input.className = "form-control mb-2";
  document.getElementById("servicesContainer").appendChild(input);
};
window.addOpportunityField = () => {
  const input = document.createElement("input");
  input.type = "text"; input.name = "opportunities[]"; input.className = "form-control mb-2";
  document.getElementById("opportunitiesContainer").appendChild(input);
};


// ===============================
//  تحميل الموظفين للقوائم
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
window.addBuilding = addBuilding;

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
