import {
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "./firebase.js";



// ===============================
//  إنشاء الحقول حسب نوع البحث
// ===============================
export function renderSearchFields() {
  const type = document.getElementById("searchType").value;
  const container = document.getElementById("searchFields");

  container.innerHTML = "";

  if (!type) return;

  if (type === "department") {
    container.innerHTML = `
      <label class="form-label">اسم القسم</label>
      <input type="text" id="searchDeptName" class="form-control">
    `;
  }

  if (type === "section") {
    container.innerHTML = `
      <label class="form-label">اسم الشعبة</label>
      <input type="text" id="searchSectionName" class="form-control">

      <label class="form-label mt-3">القسم التابع له</label>
      <select id="searchSectionDept" class="form-select"></select>
    `;
    loadDepartmentsSelect("searchSectionDept");
  }

  if (type === "employee") {
    container.innerHTML = `
      <label class="form-label">اسم الموظف</label>
      <input type="text" id="searchEmpName" class="form-control">

      <label class="form-label mt-3">القسم</label>
      <select id="searchEmpDept" class="form-select" onchange="loadSectionsSelect('searchEmpSection', this.value)"></select>

      <label class="form-label mt-3">الشعبة</label>
      <select id="searchEmpSection" class="form-select"></select>
    `;
    loadDepartmentsSelect("searchEmpDept");
  }

  if (type === "device") {
    container.innerHTML = `
      <label class="form-label">اسم الجهاز</label>
      <input type="text" id="searchDeviceName" class="form-control">

      <label class="form-label mt-3">السيريال</label>
      <input type="text" id="searchDeviceSerial" class="form-control">
    `;
  }

  if (type === "vehicle") {
    container.innerHTML = `
      <label class="form-label">رقم اللوحة</label>
      <input type="text" id="searchVehiclePlate" class="form-control">

      <label class="form-label mt-3">الموديل</label>
      <input type="text" id="searchVehicleModel" class="form-control">
    `;
  }

  if (type === "furniture") {
    container.innerHTML = `
      <label class="form-label">اسم الأثاث</label>
      <input type="text" id="searchFurnitureName" class="form-control">

      <label class="form-label mt-3">الكود</label>
      <input type="text" id="searchFurnitureCode" class="form-control">
    `;
  }
}


// ===============================
//  تنفيذ البحث
// ===============================
export async function executeSearch() {
  const type = document.getElementById("searchType").value;
  const resultsBox = document.getElementById("resultsContainer");

  resultsBox.innerHTML = "<div class='text-muted'>جاري البحث…</div>";

  if (!type) {
    resultsBox.innerHTML = "<div class='text-danger'>اختر نوع البحث</div>";
    return;
  }

  let results = [];

  if (type === "department") results = await searchDepartments();
  if (type === "section") results = await searchSections();
  if (type === "employee") results = await searchEmployees();
  if (type === "device") results = await searchDevices();
  if (type === "vehicle") results = await searchVehicles();
  if (type === "furniture") results = await searchFurniture();

  renderResults(results, type);
}


// ===============================
//  البحث — الأقسام
// ===============================
async function searchDepartments() {
  const name = document.getElementById("searchDeptName").value;
  const snap = await getDocs(collection(db, "Hierarchy"));

  const results = [];

  snap.forEach(d => {
    const data = d.data();
    if (data.type === "Department" && data.name.includes(name)) {
      results.push({ id: d.id, ...data });
    }
  });

  return results;
}


// ===============================
//  البحث — الشعب
// ===============================
async function searchSections() {
  const name = document.getElementById("searchSectionName").value;
  const deptId = document.getElementById("searchSectionDept").value;

  const snap = await getDocs(collection(db, "Hierarchy"));
  const results = [];

  snap.forEach(d => {
    const data = d.data();
    if (data.type === "Section") {
      if (name && !data.name.includes(name)) return;
      if (deptId && data.parent?.id !== deptId) return;
      results.push({ id: d.id, ...data });
    }
  });

  return results;
}


// ===============================
//  البحث — الموظفين
// ===============================
async function searchEmployees() {
  const name = document.getElementById("searchEmpName").value;
  const deptId = document.getElementById("searchEmpDept").value;
  const secId = document.getElementById("searchEmpSection").value;

  const snap = await getDocs(collection(db, "Employees"));
  const results = [];

  for (const d of snap.docs) {
    const data = d.data();
    if (name && !data.name.includes(name)) continue;

    if (data.hierarchy) {
      const hSnap = await getDoc(data.hierarchy);
      if (hSnap.exists()) {
        const hData = hSnap.data();

        if (deptId && hData.type === "Department" && data.hierarchy.id !== deptId) continue;
        if (deptId && hData.type === "Section" && hData.parent?.id !== deptId) continue;

        if (secId && hData.type === "Section" && data.hierarchy.id !== secId) continue;
      }
    }

    results.push({ id: d.id, ...data });
  }

  return results;
}


// ===============================
//  البحث — الأجهزة
// ===============================
async function searchDevices() {
  const name = document.getElementById("searchDeviceName").value;
  const serial = document.getElementById("searchDeviceSerial").value;

  const snap = await getDocs(collection(db, "Devices"));
  const results = [];

  snap.forEach(d => {
    const data = d.data();
    if (name && !data.name.includes(name)) return;
    if (serial && !data.serial.includes(serial)) return;
    results.push({ id: d.id, ...data });
  });

  return results;
}


// ===============================
//  البحث — المركبات
// ===============================
async function searchVehicles() {
  const plate = document.getElementById("searchVehiclePlate").value;
  const model = document.getElementById("searchVehicleModel").value;

  const snap = await getDocs(collection(db, "Vehicles"));
  const results = [];

  snap.forEach(d => {
    const data = d.data();
    if (plate && !data.plate.includes(plate)) return;
    if (model && !data.model.includes(model)) return;
    results.push({ id: d.id, ...data });
  });

  return results;
}


// ===============================
//  البحث — الأثاث
// ===============================
async function searchFurniture() {
  const name = document.getElementById("searchFurnitureName").value;
  const code = document.getElementById("searchFurnitureCode").value;

  const snap = await getDocs(collection(db, "Furniture"));
  const results = [];

  snap.forEach(d => {
    const data = d.data();
    if (name && !data.name.includes(name)) return;
    if (code && !data.code.includes(code)) return;
    results.push({ id: d.id, ...data });
  });

  return results;
}


// ===============================
//  عرض النتائج
// ===============================
function renderResults(results, type) {
  const box = document.getElementById("resultsContainer");

  if (!results.length) {
    box.innerHTML = "<div class='text-danger'>لا توجد نتائج</div>";
    return;
  }

  box.innerHTML = "";

  results.forEach(item => {
    let title = "";
    let subtitle = "";
    let editFn = null;

    if (type === "department") {
      title = item.name;
      subtitle = "قسم";
      editFn = `openEditDepartment('${item.id}')`;
    }

    if (type === "section") {
      title = item.name;
      subtitle = "شعبة";
      editFn = `openEditSection('${item.id}')`;
    }

    if (type === "employee") {
      title = item.name;
      subtitle = "موظف";
      editFn = `openEditEmployee('${item.id}')`;
    }

    if (type === "device") {
      title = item.name;
      subtitle = "سيريال: " + item.serial;
      editFn = `openEditDevice('${item.id}')`;
    }

    if (type === "vehicle") {
      title = item.plate;
      subtitle = "موديل: " + item.model;
      editFn = `openEditVehicle('${item.id}')`;
    }

    if (type === "furniture") {
      title = item.name;
      subtitle = "كود: " + item.code;
      editFn = `openEditFurniture('${item.id}')`;
    }

    box.innerHTML += `
      <div class="card p-3 mb-2 shadow-sm">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <b>${title}</b>
            <div class="text-muted">${subtitle}</div>
          </div>
          <button class="btn btn-warning btn-sm" onclick="${editFn}">تعديل</button>
        </div>
      </div>
    `;
  });
}


// ===============================
//  ربط جميع دوال البحث بـ window
// ===============================

// الحقول الديناميكية
window.renderSearchFields = renderSearchFields;

// تنفيذ البحث
window.executeSearch = executeSearch;

// البحث حسب الأنواع
window.searchDepartments = searchDepartments;
window.searchSections = searchSections;
window.searchEmployees = searchEmployees;
window.searchDevices = searchDevices;
window.searchVehicles = searchVehicles;
window.searchFurniture = searchFurniture;

// عرض النتائج
window.renderResults = renderResults;

// تحميل القوائم (من crud.js)
window.loadDepartmentsSelect = loadDepartmentsSelect;
window.loadSectionsSelect = loadSectionsSelect;

