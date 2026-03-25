import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  updateDoc
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
  const dept = document.getElementById("filterDepartment")?.value || "";
  const sec  = document.getElementById("filterSection")?.value || "";
  const emp  = document.getElementById("filterEmployee")?.value || "";

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

  filterLoadSections();
}

/* ---------------------------------------------------
   تحميل الشعب بناءً على القسم في الترويسة
--------------------------------------------------- */
async function filterLoadSections() {
  const deptId = document.getElementById("filterDepartment")?.value;
  const select = document.getElementById("filterSection");
  if (!select) return;

  const current = select.value;

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

  if (current) select.value = current;

  filterLoadEmployees();
}

/* ---------------------------------------------------
   تحميل الموظفين بناءً على الترويسة
--------------------------------------------------- */
async function filterLoadEmployees() {
  const secId = document.getElementById("filterSection")?.value;
  const deptId = document.getElementById("filterDepartment")?.value;

  const select = document.getElementById("filterEmployee");
  if (!select) return;

  const current = select.value;

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

  if (current) select.value = current;
}

/* ---------------------------------------------------
   تحميل الأقسام لأي قائمة
--------------------------------------------------- */
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

/* ---------------------------------------------------
   تحميل الشعب لأي قائمة
--------------------------------------------------- */
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

/* ---------------------------------------------------
   تحميل الموظفين لأي قائمة (مدير قسم/شعبة)
--------------------------------------------------- */
async function loadEmployeesSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const current = select.value;

  select.innerHTML = "<option value=''>بدون مدير</option>";

  const snap = await getDocs(collection(db, "Employees"));

  snap.forEach(d => {
    select.innerHTML += `<option value="${d.id}">${d.data().name}</option>`;
  });

  if (current) select.value = current;
}

/* ---------------------------------------------------
   إضافة قسم
--------------------------------------------------- */
async function addDepartment() {
  const nameInput = document.getElementById("deptName");
  const managerSelect = document.getElementById("deptManagerSelect");

  if (!nameInput) return;

  const name = nameInput.value;
  const managerId = managerSelect ? managerSelect.value : "";

  if (!name.trim()) return alert("أدخل اسم القسم");

  await addDoc(collection(db, "Hierarchy"), {
    name,
    type: "Department",
    parent: null,
    manager: managerId ? doc(db, "Employees", managerId) : null
  });

  nameInput.value = "";
  loadHierarchyTree();
}

/* ---------------------------------------------------
   إضافة شعبة
--------------------------------------------------- */
async function addSection() {
  const nameInput = document.getElementById("divName");
  const deptSelect = document.getElementById("divDeptSelect");
  const managerSelect = document.getElementById("divManagerSelect");

  if (!nameInput || !deptSelect) return;

  const name = nameInput.value;
  const deptId = deptSelect.value;
  const managerId = managerSelect ? managerSelect.value : "";

  if (!name.trim() || !deptId)
    return alert("أدخل البيانات كاملة");

  await addDoc(collection(db, "Hierarchy"), {
    name,
    type: "Section",
    parent: doc(db, "Hierarchy", deptId),
    manager: managerId ? doc(db, "Employees", managerId) : null
  });

  nameInput.value = "";
  loadHierarchyTree();
}

/* ---------------------------------------------------
   عرض الهيكلية بشكل هرمي H1
--------------------------------------------------- */
async function loadHierarchyTree() {
  const container = document.getElementById("hierarchyTree");
  if (!container) return;

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

  const filterDept = document.getElementById("filterDepartment")?.value || "";
  const filterSec  = document.getElementById("filterSection")?.value || "";

  for (const dept of departments) {
    if (filterDept && dept.id !== filterDept) continue;

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
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-1">${dept.name}</h5>
            <div class="text-muted">رئيس القسم: ${managerName}</div>
            <div class="text-muted">عدد الموظفين: ${deptEmployees}</div>
          </div>
          <div>
            <button class="btn btn-sm btn-warning me-1" onclick="openEditDepartment('${dept.id}')">✏️ تعديل</button>
            <button class="btn btn-sm btn-danger" onclick="deleteDepartment('${dept.id}')">🗑️ حذف</button>
          </div>
        </div>
        <div id="dept-${dept.id}-sections" class="mt-2"></div>
      </div>
    `;
  }

  for (const sec of sections) {
    const parentId = sec.parent?.id;
    if (filterDept && parentId !== filterDept) continue;
    if (filterSec && sec.id !== filterSec) continue;

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
      <div class="section-item card p-2 mb-2">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <b>- ${sec.name}</b>
            <div class="text-muted">رئيس الشعبة: ${secManager}</div>
            <div class="text-muted">الموظفون: ${secEmployees.length ? secEmployees.join("، ") : "—"}</div>
          </div>
          <div>
            <button class="btn btn-sm btn-warning me-1" onclick="openEditSection('${sec.id}')">✏️ تعديل</button>
            <button class="btn btn-sm btn-danger" onclick="deleteSection('${sec.id}')">🗑️ حذف</button>
          </div>
        </div>
      </div>
    `;
  }
}

/* ---------------------------------------------------
   تحميل الشعب عند اختيار قسم للموظف
--------------------------------------------------- */
async function loadSectionsForEmployee() {
  const deptId = document.getElementById("empDeptSelect")?.value;
  await loadSectionsSelect("empSectionSelect", deptId);
}

/* ---------------------------------------------------
   إضافة موظف (يسمح بدون قسم أو شعبة)
--------------------------------------------------- */
async function addEmployee() {
  const nameInput = document.getElementById("empName");
  const deptSelect = document.getElementById("empDeptSelect");
  const secSelect  = document.getElementById("empSectionSelect");

  if (!nameInput) return;

  const name = nameInput.value;
  const deptId = deptSelect ? deptSelect.value : "";
  const secId  = secSelect ? secSelect.value : "";

  let hierarchyRef = null;

  if (secId) hierarchyRef = doc(db, "Hierarchy", secId);
  else if (deptId) hierarchyRef = doc(db, "Hierarchy", deptId);

  if (!name.trim()) return alert("أدخل اسم الموظف");

  await addDoc(collection(db, "Employees"), {
    name,
    hierarchy: hierarchyRef
  });

  nameInput.value = "";
  // لا نلمس اختيار القسم والشعبة
  loadEmployees();
  loadHierarchyTree();
}

/* ---------------------------------------------------
   عرض الموظفين
--------------------------------------------------- */
async function loadEmployees() {
  const list = document.getElementById("empList");
  if (!list) return;

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
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <b>${data.name}</b> — تابع لـ: ${hierarchyName}
          </div>
          <div>
            <button class="btn btn-sm btn-warning me-1" onclick="openEditEmployee('${d.id}')">✏️ تعديل</button>
            <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${d.id}')">🗑️ حذف</button>
          </div>
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
  const nameInput   = document.getElementById("deviceName");
  const serialInput = document.getElementById("deviceSerial");
  const empId       = document.getElementById("filterEmployee")?.value;

  if (!nameInput || !serialInput) return;

  const name   = nameInput.value;
  const serial = serialInput.value;

  if (!name.trim() || !serial.trim())
    return alert("أدخل البيانات كاملة");

  if (!empId)
    return alert("يجب اختيار موظف من الترويسة");

  await addDoc(collection(db, "Devices"), {
    name,
    serial,
    employee: doc(db, "Employees", empId)
  });

  nameInput.value = "";
  serialInput.value = "";
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
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <b>${data.name}</b> — سيريال: ${data.serial} — مستلم: ${empName}
          </div>
          <div>
            <button class="btn btn-sm btn-warning me-1" onclick="openEditDevice('${d.id}')">✏️ تعديل</button>
            <button class="btn btn-sm btn-danger" onclick="deleteDevice('${d.id}')">🗑️ حذف</button>
          </div>
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
  const plateInput = document.getElementById("vehiclePlate");
  const modelInput = document.getElementById("vehicleModel");
  const empId      = document.getElementById("filterEmployee")?.value;

  if (!plateInput || !modelInput) return;

  const plate = plateInput.value;
  const model = modelInput.value;

  if (!plate.trim() || !model.trim())
    return alert("أدخل البيانات كاملة");

  if (!empId)
    return alert("يجب اختيار موظف من الترويسة");

  await addDoc(collection(db, "Vehicles"), {
    plate,
    model,
    employee: doc(db, "Employees", empId)
  });

  plateInput.value = "";
  modelInput.value = "";
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
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <b>${data.plate}</b> — موديل: ${data.model} — مستلم: ${empName}
          </div>
          <div>
            <button class="btn btn-sm btn-warning me-1" onclick="openEditVehicle('${d.id}')">✏️ تعديل</button>
            <button class="btn btn-sm btn-danger" onclick="deleteVehicle('${d.id}')">🗑️ حذف</button>
          </div>
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
  const nameInput = document.getElementById("furnitureName");
  const codeInput = document.getElementById("furnitureCode");
  const empId     = document.getElementById("filterEmployee")?.value;

  if (!nameInput || !codeInput) return;

  const name = nameInput.value;
  const code = codeInput.value;

  if (!name.trim() || !code.trim())
    return alert("أدخل البيانات كاملة");

  if (!empId)
    return alert("يجب اختيار موظف من الترويسة");

  await addDoc(collection(db, "Furniture"), {
    name,
    code,
    employee: doc(db, "Employees", empId)
  });

  nameInput.value = "";
  codeInput.value = "";
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
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <b>${data.name}</b> — كود: ${data.code} — مستلم: ${empName}
          </div>
          <div>
            <button class="btn btn-sm btn-warning me-1" onclick="openEditFurniture('${d.id}')">✏️ تعديل</button>
            <button class="btn btn-sm btn-danger" onclick="deleteFurniture('${d.id}')">🗑️ حذف</button>
          </div>
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
   تعديل الأقسام / الشعب / الموظفين / الأصول
--------------------------------------------------- */

// الأقسام
async function openEditDepartment(id) {
  const ref = doc(db, "Hierarchy", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("editDeptId").value = id;
  document.getElementById("editDeptName").value = data.name || "";

  await loadEmployeesSelect("editDeptManager");
  document.getElementById("editDeptManager").value = data.manager ? data.manager.id : "";

  const modal = new bootstrap.Modal(document.getElementById("editDepartmentModal"));
  modal.show();
}

async function saveDepartmentEdit() {
  const id = document.getElementById("editDeptId").value;
  const name = document.getElementById("editDeptName").value;
  const managerId = document.getElementById("editDeptManager").value;

  if (!name.trim()) return alert("أدخل اسم القسم");

  const payload = {
    name,
    manager: managerId ? doc(db, "Employees", managerId) : null
  };

  await updateDoc(doc(db, "Hierarchy", id), payload);

  bootstrap.Modal.getInstance(document.getElementById("editDepartmentModal")).hide();
  loadHierarchyTree();
}

// الشعب
async function openEditSection(id) {
  const ref = doc(db, "Hierarchy", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("editSectionId").value = id;
  document.getElementById("editSectionName").value = data.name || "";

  await loadDepartmentsSelect("editSectionDept");
  document.getElementById("editSectionDept").value = data.parent ? data.parent.id : "";

  await loadEmployeesSelect("editSectionManager");
  document.getElementById("editSectionManager").value = data.manager ? data.manager.id : "";

  const modal = new bootstrap.Modal(document.getElementById("editSectionModal"));
  modal.show();
}

async function saveSectionEdit() {
  const id = document.getElementById("editSectionId").value;
  const name = document.getElementById("editSectionName").value;
  const deptId = document.getElementById("editSectionDept").value;
  const managerId = document.getElementById("editSectionManager").value;

  if (!name.trim() || !deptId) return alert("أدخل البيانات كاملة");

  const payload = {
    name,
    parent: doc(db, "Hierarchy", deptId),
    manager: managerId ? doc(db, "Employees", managerId) : null
  };

  await updateDoc(doc(db, "Hierarchy", id), payload);

  bootstrap.Modal.getInstance(document.getElementById("editSectionModal")).hide();
  loadHierarchyTree();
}

// حذف قسم / شعبة
async function deleteDepartment(id) {
  await deleteDoc(doc(db, "Hierarchy", id));
  loadHierarchyTree();
}

async function deleteSection(id) {
  await deleteDoc(doc(db, "Hierarchy", id));
  loadHierarchyTree();
}

// الموظفين
async function openEditEmployee(id) {
  const ref = doc(db, "Employees", id);
  const snap = await getDoc(ref);
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
      } else if (hData.type === "Section") {
        secId = data.hierarchy.id;
        deptId = hData.parent?.id || "";
      }
    }
  }

  document.getElementById("editEmpDept").value = deptId;
  await loadSectionsSelect("editEmpSection", deptId);
  document.getElementById("editEmpSection").value = secId;

  const modal = new bootstrap.Modal(document.getElementById("editEmployeeModal"));
  modal.show();
}

async function loadEditEmpSections() {
  const deptId = document.getElementById("editEmpDept").value;
  await loadSectionsSelect("editEmpSection", deptId);
}

async function saveEmployeeEdit() {
  const id = document.getElementById("editEmpId").value;
  const name = document.getElementById("editEmpName").value;
  const deptId = document.getElementById("editEmpDept").value;
  const secId  = document.getElementById("editEmpSection").value;

  if (!name.trim()) return alert("أدخل اسم الموظف");

  let hierarchyRef = null;
  if (secId) hierarchyRef = doc(db, "Hierarchy", secId);
  else if (deptId) hierarchyRef = doc(db, "Hierarchy", deptId);

  await updateDoc(doc(db, "Employees", id), {
    name,
    hierarchy: hierarchyRef
  });

  bootstrap.Modal.getInstance(document.getElementById("editEmployeeModal")).hide();
  loadEmployees();
  loadHierarchyTree();
}

// الأجهزة
async function openEditDevice(id) {
  const ref = doc(db, "Devices", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("editDeviceId").value = id;
  document.getElementById("editDeviceName").value = data.name || "";
  document.getElementById("editDeviceSerial").value = data.serial || "";

  await loadEmployeesSelect("editDeviceEmployee");
  document.getElementById("editDeviceEmployee").value = data.employee ? data.employee.id : "";

  const modal = new bootstrap.Modal(document.getElementById("editDeviceModal"));
  modal.show();
}

async function saveDeviceEdit() {
  const id = document.getElementById("editDeviceId").value;
  const name = document.getElementById("editDeviceName").value;
  const serial = document.getElementById("editDeviceSerial").value;
  const empId = document.getElementById("editDeviceEmployee").value;

  if (!name.trim() || !serial.trim()) return alert("أدخل البيانات كاملة");

  await updateDoc(doc(db, "Devices", id), {
    name,
    serial,
    employee: empId ? doc(db, "Employees", empId) : null
  });

  bootstrap.Modal.getInstance(document.getElementById("editDeviceModal")).hide();
  loadDevices();
}

// المركبات
async function openEditVehicle(id) {
  const ref = doc(db, "Vehicles", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("editVehicleId").value = id;
  document.getElementById("editVehiclePlate").value = data.plate || "";
  document.getElementById("editVehicleModel").value = data.model || "";

  await loadEmployeesSelect("editVehicleEmployee");
  document.getElementById("editVehicleEmployee").value = data.employee ? data.employee.id : "";

  const modal = new bootstrap.Modal(document.getElementById("editVehicleModal"));
  modal.show();
}

async function saveVehicleEdit() {
  const id = document.getElementById("editVehicleId").value;
  const plate = document.getElementById("editVehiclePlate").value;
  const model = document.getElementById("editVehicleModel").value;
  const empId = document.getElementById("editVehicleEmployee").value;

  if (!plate.trim() || !model.trim()) return alert("أدخل البيانات كاملة");

  await updateDoc(doc(db, "Vehicles", id), {
    plate,
    model,
    employee: empId ? doc(db, "Employees", empId) : null
  });

  bootstrap.Modal.getInstance(document.getElementById("editVehicleModal")).hide();
  loadVehicles();
}

// الأثاث
async function openEditFurniture(id) {
  const ref = doc(db, "Furniture", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("editFurnitureId").value = id;
  document.getElementById("editFurnitureName").value = data.name || "";
  document.getElementById("editFurnitureCode").value = data.code || "";

  await loadEmployeesSelect("editFurnitureEmployee");
  document.getElementById("editFurnitureEmployee").value = data.employee ? data.employee.id : "";

  const modal = new bootstrap.Modal(document.getElementById("editFurnitureModal"));
  modal.show();
}

async function saveFurnitureEdit() {
  const id = document.getElementById("editFurnitureId").value;
  const name = document.getElementById("editFurnitureName").value;
  const code = document.getElementById("editFurnitureCode").value;
  const empId = document.getElementById("editFurnitureEmployee").value;

  if (!name.trim() || !code.trim()) return alert("أدخل البيانات كاملة");

  await updateDoc(doc(db, "Furniture", id), {
    name,
    code,
    employee: empId ? doc(db, "Employees", empId) : null
  });

  bootstrap.Modal.getInstance(document.getElementById("editFurnitureModal")).hide();
  loadFurniture();
}

/* ---------------------------------------------------
   إعادة تحميل كل شيء (بدون لمس الترويسة)
--------------------------------------------------- */
async function reloadAll() {
  loadHierarchyTree();
  loadEmployees();
  loadDevices();
  loadVehicles();
  loadFurniture();

  loadDepartmentsSelect("divDeptSelect");
  loadDepartmentsSelect("empDeptSelect");

  loadEmployeesSelect("deptManagerSelect");
  loadEmployeesSelect("divManagerSelect");
}

/* ---------------------------------------------------
   ربط الدوال بالـ window
--------------------------------------------------- */
window.addDepartment = addDepartment;
window.addSection = addSection;

window.addEmployee = addEmployee;
window.loadSectionsForEmployee = loadSectionsForEmployee;

window.addDevice = addDevice;
window.addVehicle = addVehicle;
window.addFurniture = addFurniture;

window.deleteEmployee = deleteEmployee;
window.deleteDevice = deleteDevice;
window.deleteVehicle = deleteVehicle;
window.deleteFurniture = deleteFurniture;

window.filterLoadDepartments = filterLoadDepartments;
window.filterLoadSections = filterLoadSections;
window.filterLoadEmployees = filterLoadEmployees;

window.reloadAll = reloadAll;
window.loadHierarchyTree = loadHierarchyTree;
window.loadEmployees = loadEmployees;
window.loadDevices = loadDevices;
window.loadVehicles = loadVehicles;
window.loadFurniture = loadFurniture;

// edit bindings
window.openEditDepartment = openEditDepartment;
window.saveDepartmentEdit = saveDepartmentEdit;
window.openEditSection = openEditSection;
window.saveSectionEdit = saveSectionEdit;
window.deleteDepartment = deleteDepartment;
window.deleteSection = deleteSection;

window.openEditEmployee = openEditEmployee;
window.saveEmployeeEdit = saveEmployeeEdit;
window.loadEditEmpSections = loadEditEmpSections;

window.openEditDevice = openEditDevice;
window.saveDeviceEdit = saveDeviceEdit;

window.openEditVehicle = openEditVehicle;
window.saveVehicleEdit = saveVehicleEdit;

window.openEditFurniture = openEditFurniture;
window.saveFurnitureEdit = saveFurnitureEdit;

/* ---------------------------------------------------
   تشغيل أولي عند تحميل الصفحة
--------------------------------------------------- */
window.addEventListener("load", () => {
  filterLoadDepartments();
  reloadAll();
});
