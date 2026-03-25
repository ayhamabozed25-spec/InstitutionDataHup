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
   دالة مساعدة: جلب سلسلة الهيكلية (قسم → شعبة)
--------------------------------------------------- */
async function getHierarchyChain(ref) {
  const chain = { section: null, department: null, employee: null };

  if (!ref) return chain;

  const secSnap = await getDoc(ref);

  if (!secSnap.exists()) return chain;

  const data = secSnap.data();

  if (data.type === "Section") {
    chain.section = ref.id;
    chain.department = data.parent?.id || null;
  }

  if (data.type === "Department") {
    chain.department = ref.id;
  }

  return chain;
}

/* ---------------------------------------------------
   الفلترة الصارمة
--------------------------------------------------- */
function passesFilter(chain) {
  const dept = document.getElementById("filterDepartment").value;
  const sec  = document.getElementById("filterSection").value;
  const emp  = document.getElementById("filterEmployee").value;

  if (!dept) return false;

  if (emp && chain.employee !== emp) return false;
  if (sec && chain.section !== sec) return false;
  if (dept && chain.department !== dept) return false;

  return true;
}

/* ---------------------------------------------------
   تحميل الأقسام في الترويسة
--------------------------------------------------- */
async function filterLoadDepartments() {
  const select = document.getElementById("filterDepartment");
  select.innerHTML = "<option value=''>اختر قسم</option>";

  const snap = await getDocs(collection(db, "Hierarchy"));

  snap.forEach(d => {
    const data = d.data();
    if (data.type === "Department") {
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
  const deptId = document.getElementById("filterDepartment").value;

  const select = document.getElementById("filterEmployee");
  select.innerHTML = "<option value=''>اختر موظف</option>";

  if (!deptId) return;

  const snap = await getDocs(collection(db, "Employees"));

  for (const d of snap.docs) {
    const data = d.data();

    if (!data.hierarchy) continue;

    const hId = data.hierarchy.id;

    if (secId) {
      if (hId === secId) {
        select.innerHTML += `<option value="${d.id}">${data.name}</option>`;
      }
    } else {
      const hSnap = await getDoc(doc(db, "Hierarchy", hId));
      if (hSnap.exists() && hSnap.data().type === "Department" && hId === deptId) {
        select.innerHTML += `<option value="${d.id}">${data.name}</option>`;
      }
    }
  }
}

/* ---------------------------------------------------
   تحميل الأقسام لأي قائمة
--------------------------------------------------- */
async function loadDepartmentsSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = "<option value=''>اختر قسم</option>";

  const snap = await getDocs(collection(db, "Hierarchy"));

  snap.forEach(d => {
    if (d.data().type === "Department") {
      select.innerHTML += `<option value="${d.id}">${d.data().name}</option>`;
    }
  });
}

/* ---------------------------------------------------
   تحميل الشعب لأي قائمة
--------------------------------------------------- */
async function loadSectionsSelect(selectId, deptId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = "<option value=''>بدون شعبة</option>";

  if (!deptId) return;

  const snap = await getDocs(collection(db, "Hierarchy"));

  snap.forEach(d => {
    const data = d.data();
    if (data.type === "Section" && data.parent?.id === deptId) {
      select.innerHTML += `<option value="${d.id}">${data.name}</option>`;
    }
  });
}

/* ---------------------------------------------------
   تحميل الموظفين لأي قائمة (مدير قسم/شعبة)
--------------------------------------------------- */
async function loadEmployeesSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = "<option value=''>بدون مدير</option>";

  const snap = await getDocs(collection(db, "Employees"));

  snap.forEach(d => {
    select.innerHTML += `<option value="${d.id}">${d.data().name}</option>`;
  });
}

/* ---------------------------------------------------
   إضافة قسم
--------------------------------------------------- */
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
  loadHierarchyTree();
}

/* ---------------------------------------------------
   إضافة شعبة
--------------------------------------------------- */
async function addSection() {
  const name = document.getElementById("divName").value;
  const deptId = document.getElementById("divDeptSelect").value;
  const managerId = document.getElementById("divManagerSelect").value;

  if (!name.trim() || !deptId)
    return alert("أدخل البيانات كاملة");

  await addDoc(collection(db, "Hierarchy"), {
    name,
    type: "Section",
    parent: doc(db, "Hierarchy", deptId),
    manager: managerId ? doc(db, "Employees", managerId) : null
  });

  document.getElementById("divName").value = "";
  loadHierarchyTree();
}

/* ---------------------------------------------------
   عرض الهيكلية بشكل هرمي H1
--------------------------------------------------- */
async function loadHierarchyTree() {
  const container = document.getElementById("hierarchyTree");
  container.innerHTML = "";

  const snap = await getDocs(collection(db, "Hierarchy"));
  const empSnap = await getDocs(collection(db, "Employees"));

  const departments = [];
  const sections = [];

  snap.forEach(d => {
    const data = d.data();
    if (data.type === "Department") departments.push({ id: d.id, ...data });
    if (data.type === "Section") sections.push({ id: d.id, ...data });
  });

  for (const dept of departments) {
    let deptEmployees = 0;
    let managerName = "—";

    if (dept.manager) {
      const mSnap = await getDoc(dept.manager);
      if (mSnap.exists()) managerName = mSnap.data().name;
    }

    empSnap.forEach(e => {
      const h = e.data().hierarchy;
      if (h && h.id === dept.id) deptEmployees++;
    });

    container.innerHTML += `
      <div class="card p-3 mb-3">
        <h5>${dept.name}</h5>
        <div class="text-muted">رئيس القسم: ${managerName}</div>
        <div class="text-muted">عدد الموظفين: ${deptEmployees}</div>
        <div id="dept-${dept.id}-sections"></div>
      </div>
    `;
  }

  for (const sec of sections) {
    const parentId = sec.parent?.id;
    const secContainer = document.getElementById(`dept-${parentId}-sections`);
    if (!secContainer) continue;

    let secEmployees = [];
    let secManager = "—";

    if (sec.manager) {
      const mSnap = await getDoc(sec.manager);
      if (mSnap.exists()) secManager = mSnap.data().name;
    }

    empSnap.forEach(e => {
      const h = e.data().hierarchy;
      if (h && h.id === sec.id) secEmployees.push(e.data().name);
    });

    secContainer.innerHTML += `
      <div class="section-item">
        <b>- ${sec.name}</b>
        <div class="text-muted">رئيس الشعبة: ${secManager}</div>
        <div class="text-muted">الموظفون: ${secEmployees.length ? secEmployees.join("، ") : "—"}</div>
      </div>
    `;
  }
}

/* ---------------------------------------------------
   تحميل الشعب عند اختيار قسم للموظف
--------------------------------------------------- */
async function loadSectionsForEmployee() {
  const deptId = document.getElementById("empDeptSelect").value;
  loadSectionsSelect("empSectionSelect", deptId);
}

/* ---------------------------------------------------
   إضافة موظف (يسمح بدون قسم أو شعبة)
--------------------------------------------------- */
async function addEmployee() {
  const name = document.getElementById("empName").value;
  const deptId = document.getElementById("empDeptSelect").value;
  const secId  = document.getElementById("empSectionSelect").value;

  let hierarchyRef = null;

  if (secId) hierarchyRef = doc(db, "Hierarchy", secId);
  else if (deptId) hierarchyRef = doc(db, "Hierarchy", deptId);

  await addDoc(collection(db, "Employees"), {
    name,
    hierarchy: hierarchyRef
  });

  document.getElementById("empName").value = "";
  loadEmployees();
  loadHierarchyTree();
}

/* ---------------------------------------------------
   عرض الموظفين
--------------------------------------------------- */
async function loadEmployees() {
  const list = document.getElementById("empList");
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "Employees"));

  for (const d of snap.docs) {
    const data = d.data();

    let hierarchyName = "—";

    if (data.hierarchy) {
      const hSnap = await getDoc(data.hierarchy);
      if (hSnap.exists()) hierarchyName = hSnap.data().name;
    }

    list.innerHTML += `
      <div class="card p-2 mb-2">
        <b>${data.name}</b> — تابع لـ: ${hierarchyName}
        <div class="mt-2">
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
  loadHierarchyTree();
}

/* ---------------------------------------------------
   إضافة جهاز
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
   عرض الأجهزة
--------------------------------------------------- */
async function loadDevices() {
  const list = document.getElementById("devicesList");
  if (!list) return;
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "Devices"));

  for (const d of snap.docs) {
    const data = d.data();

    let empName = "—";
    let chain = { employee: null, section: null, department: null };

    if (data.employee) {
      const eSnap = await getDoc(data.employee);
      if (eSnap.exists()) {
        empName = eSnap.data().name;
        const hRef = eSnap.data().hierarchy;
        const hChain = await getHierarchyChain(hRef);

        chain = {
          employee: data.employee.id,
          section: hChain.section,
          department: hChain.department
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
   عرض المركبات
--------------------------------------------------- */
async function loadVehicles() {
  const list = document.getElementById("vehiclesList");
  if (!list) return;
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "Vehicles"));

  for (const d of snap.docs) {
    const data = d.data();

    let empName = "—";
    let chain = { employee: null, section: null, department: null };

    if (data.employee) {
      const eSnap = await getDoc(data.employee);
      if (eSnap.exists()) {
        empName = eSnap.data().name;
        const hRef = eSnap.data().hierarchy;
        const hChain = await getHierarchyChain(hRef);

        chain = {
          employee: data.employee.id,
          section: hChain.section,
          department: hChain.department
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
   عرض الأثاث
--------------------------------------------------- */
async function loadFurniture() {
  const list = document.getElementById("furnitureList");
  if (!list) return;
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "Furniture"));

  for (const d of snap.docs) {
    const data = d.data();

    let empName = "—";
    let chain = { employee: null, section: null, department: null };

    if (data.employee) {
      const eSnap = await getDoc(data.employee);
      if (eSnap.exists()) {
        empName = eSnap.data().name;
        const hRef = eSnap.data().hierarchy;
        const hChain = await getHierarchyChain(hRef);

        chain = {
          employee: data.employee.id,
          section: hChain.section,
          department: hChain.department
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

/* ------------------------------------------------
