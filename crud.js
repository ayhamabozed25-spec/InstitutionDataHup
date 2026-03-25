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

/* ---------------------------------------------------
   دالة مساعدة: جلب سلسلة الهيكلية (شعبة → قسم → مؤسسة)
--------------------------------------------------- */
async function getHierarchyChain(sectionRef) {
  const chain = { section: null, department: null, institution: null };

  if (!sectionRef) return chain;

  const secSnap = await getDoc(sectionRef);
  if (!secSnap.exists()) return chain;

  chain.section = { id: sectionRef.id, ...secSnap.data() };

  const deptRef = secSnap.data().parent;
  if (!deptRef) return chain;

  const deptSnap = await getDoc(deptRef);
  chain.department = { id: deptRef.id, ...deptSnap.data() };

  const instRef = deptSnap.data().parent;
  if (!instRef) return chain;

  const instSnap = await getDoc(instRef);
  chain.institution = { id: instRef.id, ...instSnap.data() };

  return chain;
}

/* ---------------------------------------------------
   دالة الفلترة الصارمة A1
--------------------------------------------------- */
function passesFilter(chain) {
  const inst = document.getElementById("filterInstitution").value;
  const dept = document.getElementById("filterDepartment").value;
  const sec  = document.getElementById("filterSection").value;
  const emp  = document.getElementById("filterEmployee").value;

  // فلترة صارمة: إذا لم يتم اختيار مؤسسة → لا شيء يظهر
  if (!inst) return false;

  if (emp && chain.employee !== emp) return false;
  if (sec && chain.section !== sec) return false;
  if (dept && chain.department !== dept) return false;
  if (inst && chain.institution !== inst) return false;

  return true;
}

/* ---------------------------------------------------
   تحميل المؤسسات في الترويسة
--------------------------------------------------- */
async function filterLoadInstitutions() {
  const select = document.getElementById("filterInstitution");
  select.innerHTML = "<option value=''>اختر مؤسسة</option>";

  const snap = await getDocs(collection(db, "Hierarchy"));
  snap.forEach(d => {
    const data = d.data();
    if (data.type === "Institution") {
      select.innerHTML += `<option value="${d.id}">${data.name}</option>`;
    }
  });

  filterLoadDepartments();
}

/* ---------------------------------------------------
   تحميل الأقسام بناءً على المؤسسة
--------------------------------------------------- */
async function filterLoadDepartments() {
  const instId = document.getElementById("filterInstitution").value;
  const select = document.getElementById("filterDepartment");
  select.innerHTML = "<option value=''>اختر قسم</option>";

  if (!instId) {
    filterLoadSections();
    return;
  }

  const snap = await getDocs(collection(db, "Hierarchy"));
  snap.forEach(d => {
    const data = d.data();
    if (data.type === "Department" && data.parent?.id === instId) {
      select.innerHTML += `<option value="${d.id}">${data.name}</option>`;
    }
  });

  filterLoadSections();
}

/* ---------------------------------------------------
   تحميل الشعب بناءً على القسم
--------------------------------------------------- */
async function filterLoadSections() {
  const deptId = document.getElementById("filterDepartment").value;
  const select = document.getElementById("filterSection");
  select.innerHTML = "<option value=''>اختر شعبة</option>";

  if (!deptId) {
    filterLoadEmployees();
    return;
  }

  const snap = await getDocs(collection(db, "Hierarchy"));
  snap.forEach(d => {
    const data = d.data();
    if (data.type === "Section" && data.parent?.id === deptId) {
      select.innerHTML += `<option value="${d.id}">${data.name}</option>`;
    }
  });

  filterLoadEmployees();
}

/* ---------------------------------------------------
   تحميل الموظفين بناءً على الشعبة
--------------------------------------------------- */
async function filterLoadEmployees() {
  const secId = document.getElementById("filterSection").value;
  const select = document.getElementById("filterEmployee");
  select.innerHTML = "<option value=''>اختر موظف</option>";

  if (!secId) return;

  const snap = await getDocs(collection(db, "Employees"));
  snap.forEach(d => {
    const data = d.data();
    if (data.hierarchy?.id === secId) {
      select.innerHTML += `<option value="${d.id}">${data.name}</option>`;
    }
  });

  reloadAll();
}

/* ---------------------------------------------------
   تحميل الموظفين لأي قائمة (مدير – جهاز – مركبة – أثاث)
--------------------------------------------------- */
async function loadEmployeesSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = "<option value=''>اختر موظف</option>";

  const snap = await getDocs(collection(db, "Employees"));
  snap.forEach(d => {
    select.innerHTML += `<option value="${d.id}">${d.data().name}</option>`;
  });
}

/* ---------------------------------------------------
   تحميل الهيكلية حسب النوع (مؤسسة – قسم – شعبة)
--------------------------------------------------- */
async function loadSelect(type, selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = "<option value=''>اختر</option>";

  const snap = await getDocs(collection(db, "Hierarchy"));
  snap.forEach(d => {
    const data = d.data();
    if (data.type === type) {
      select.innerHTML += `<option value="${d.id}">${data.name}</option>`;
    }
  });
}
/* ---------------------------------------------------
   تحميل الهيكلية (مؤسسة – قسم – شعبة) مع الفلترة الصارمة
--------------------------------------------------- */
async function loadHierarchy(type, listElementId) {
  const list = document.getElementById(listElementId);
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "Hierarchy"));

  for (const d of snap.docs) {
    const data = d.data();
    if (data.type !== type) continue;

    // جلب سلسلة الهيكلية
    let chain = { institution: null, department: null, section: null };

    if (data.type === "Institution") {
      chain.institution = d.id;
    }

    if (data.type === "Department") {
      const instRef = data.parent;
      if (!instRef) continue;
      chain.institution = instRef.id;
      chain.department = d.id;
    }

    if (data.type === "Section") {
      const deptRef = data.parent;
      if (!deptRef) continue;

      const deptSnap = await getDoc(deptRef);
      const instRef = deptSnap.data().parent;

      chain.section = d.id;
      chain.department = deptRef.id;
      chain.institution = instRef.id;
    }

    // تطبيق الفلترة الصارمة
    if (!passesFilter(chain)) continue;

    // اسم الأب
    let parentName = "—";
    if (data.parent) {
      const parentSnap = await getDoc(data.parent);
      parentName = parentSnap.exists() ? parentSnap.data().name : "—";
    }

    // اسم المدير
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

/* ---------------------------------------------------
   إضافة مؤسسة / قسم / شعبة
--------------------------------------------------- */
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

/* ---------------------------------------------------
   حذف عنصر من الهيكلية
--------------------------------------------------- */
async function deleteHierarchy(id) {
  await deleteDoc(doc(db, "Hierarchy", id));
  reloadAll();
}

/* ---------------------------------------------------
   تحميل المؤسسات / الأقسام / الشعب
--------------------------------------------------- */
function loadInstitutions() { loadHierarchy("Institution", "orgList"); }
function loadDepartments() { loadHierarchy("Department", "deptList"); }
function loadSections() { loadHierarchy("Section", "divList"); }

/* ---------------------------------------------------
   إضافة موظف
--------------------------------------------------- */
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

/* ---------------------------------------------------
   عرض الموظفين مع الفلترة الصارمة
--------------------------------------------------- */
async function loadEmployees() {
  const list = document.getElementById("empList");
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "Employees"));

  for (const d of snap.docs) {
    const data = d.data();

    let chain = { employee: d.id, section: null, department: null, institution: null };

    if (data.hierarchy) {
      const hChain = await getHierarchyChain(data.hierarchy);
      chain.section = hChain.section?.id;
      chain.department = hChain.department?.id;
      chain.institution = hChain.institution?.id;
    }

    if (!passesFilter(chain)) continue;

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

/* ---------------------------------------------------
   حذف موظف
--------------------------------------------------- */
async function deleteEmployee(id) {
  await deleteDoc(doc(db, "Employees", id));
  loadEmployees();
}

/* ---------------------------------------------------
   فتح نافذة التعديل (هيكلية + موظفين)
--------------------------------------------------- */
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

/* ---------------------------------------------------
   حفظ التعديل
--------------------------------------------------- */
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
/* ---------------------------------------------------
   إضافة جهاز (يرتبط بالموظف من الترويسة)
--------------------------------------------------- */
async function addDevice() {
  const name = document.getElementById("deviceName").value;
  const serial = document.getElementById("deviceSerial").value;
  const empId = document.getElementById("filterEmployee").value;

  if (!name.trim() || !serial.trim())
    return alert("أدخل البيانات كاملة");

  if (!empId)
    return alert("يجب اختيار موظف من الترويسة");

  await addDoc(collection(db, "Devices"), {
    name,
    serial,
    employee: doc(db, "Employees", empId)
  });

  document.getElementById("deviceName").value = "";
  document.getElementById("deviceSerial").value = "";
  loadDevices();
}

/* ---------------------------------------------------
   عرض الأجهزة مع الفلترة الصارمة
--------------------------------------------------- */
async function loadDevices() {
  const list = document.getElementById("devicesList");
  if (!list) return;
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "Devices"));

  for (const d of snap.docs) {
    const data = d.data();

    let empName = "—";
    let chain = { employee: null, section: null, department: null, institution: null };

    if (data.employee) {
      const eSnap = await getDoc(data.employee);
      if (eSnap.exists()) {
        empName = eSnap.data().name;
        const hRef = eSnap.data().hierarchy;
        const hChain = await getHierarchyChain(hRef);

        chain = {
          employee: data.employee.id,
          section: hChain.section?.id,
          department: hChain.department?.id,
          institution: hChain.institution?.id
        };
      }
    }

    if (!passesFilter(chain)) continue;

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

/* ---------------------------------------------------
   حذف جهاز
--------------------------------------------------- */
async function deleteDevice(id) {
  await deleteDoc(doc(db, "Devices", id));
  loadDevices();
}

/* ---------------------------------------------------
   إضافة مركبة
--------------------------------------------------- */
async function addVehicle() {
  const plate = document.getElementById("vehiclePlate").value;
  const model = document.getElementById("vehicleModel").value;
  const empId = document.getElementById("filterEmployee").value;

  if (!plate.trim() || !model.trim())
    return alert("أدخل البيانات كاملة");

  if (!empId)
    return alert("يجب اختيار موظف من الترويسة");

  await addDoc(collection(db, "Vehicles"), {
    plate,
    model,
    employee: doc(db, "Employees", empId)
  });

  document.getElementById("vehiclePlate").value = "";
  document.getElementById("vehicleModel").value = "";
  loadVehicles();
}

/* ---------------------------------------------------
   عرض المركبات مع الفلترة الصارمة
--------------------------------------------------- */
async function loadVehicles() {
  const list = document.getElementById("vehiclesList");
  if (!list) return;
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "Vehicles"));

  for (const d of snap.docs) {
    const data = d.data();

    let empName = "—";
    let chain = { employee: null, section: null, department: null, institution: null };

    if (data.employee) {
      const eSnap = await getDoc(data.employee);
      if (eSnap.exists()) {
        empName = eSnap.data().name;
        const hRef = eSnap.data().hierarchy;
        const hChain = await getHierarchyChain(hRef);

        chain = {
          employee: data.employee.id,
          section: hChain.section?.id,
          department: hChain.department?.id,
          institution: hChain.institution?.id
        };
      }
    }

    if (!passesFilter(chain)) continue;

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

/* ---------------------------------------------------
   حذف مركبة
--------------------------------------------------- */
async function deleteVehicle(id) {
  await deleteDoc(doc(db, "Vehicles", id));
  loadVehicles();
}

/* ---------------------------------------------------
   إضافة أثاث
--------------------------------------------------- */
async function addFurniture() {
  const name = document.getElementById("furnitureName").value;
  const code = document.getElementById("furnitureCode").value;
  const empId = document.getElementById("filterEmployee").value;

  if (!name.trim() || !code.trim())
    return alert("أدخل البيانات كاملة");

  if (!empId)
    return alert("يجب اختيار موظف من الترويسة");

  await addDoc(collection(db, "Furniture"), {
    name,
    code,
    employee: doc(db, "Employees", empId)
  });

  document.getElementById("furnitureName").value = "";
  document.getElementById("furnitureCode").value = "";
  loadFurniture();
}

/* ---------------------------------------------------
   عرض الأثاث مع الفلترة الصارمة
--------------------------------------------------- */
async function loadFurniture() {
  const list = document.getElementById("furnitureList");
  if (!list) return;
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "Furniture"));

  for (const d of snap.docs) {
    const data = d.data();

    let empName = "—";
    let chain = { employee: null, section: null, department: null, institution: null };

    if (data.employee) {
      const eSnap = await getDoc(data.employee);
      if (eSnap.exists()) {
        empName = eSnap.data().name;
        const hRef = eSnap.data().hierarchy;
        const hChain = await getHierarchyChain(hRef);

        chain = {
          employee: data.employee.id,
          section: hChain.section?.id,
          department: hChain.department?.id,
          institution: hChain.institution?.id
        };
      }
    }

    if (!passesFilter(chain)) continue;

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

/* ---------------------------------------------------
   حذف أثاث
--------------------------------------------------- */
async function deleteFurniture(id) {
  await deleteDoc(doc(db, "Furniture", id));
  loadFurniture();
}

/* ---------------------------------------------------
   تحميل كل البيانات عند تشغيل الصفحة
--------------------------------------------------- */
function reloadAll() {
  // الهيكلية
  loadInstitutions();
  loadDepartments();
  loadSections();

  // الموظفين
  loadEmployees();

  // تحميل القوائم المنسدلة
  loadSelect("Institution", "deptOrgSelect");
  loadSelect("Department", "divDeptSelect");
  loadSelect("Section", "empHierarchySelect");

  // تحميل الموظفين للمديرين
  loadEmployeesSelect("orgManagerSelect");
  loadEmployeesSelect("deptManagerSelect");
  loadEmployeesSelect("divManagerSelect");

  // تحميل الأصول
  loadDevices();
  loadVehicles();
  loadFurniture();
}

window.onload = reloadAll;

/* ---------------------------------------------------
   ربط الدوال بالـ window
--------------------------------------------------- */
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

window.filterLoadInstitutions = filterLoadInstitutions;
window.filterLoadDepartments = filterLoadDepartments;
window.filterLoadSections = filterLoadSections;
window.filterLoadEmployees = filterLoadEmployees;
