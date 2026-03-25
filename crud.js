import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ------------------ تحميل القوائم المنسدلة ------------------ */

async function loadOrgSelect() {
  const snap = await getDocs(collection(db, "organizations"));
  const select = document.getElementById("deptOrgSelect");
  select.innerHTML = "<option value=''>اختر مؤسسة</option>";

  snap.forEach(d => {
    select.innerHTML += `<option value="${d.id}">${d.data().name}</option>`;
  });
}

async function loadDeptSelect() {
  const snap = await getDocs(collection(db, "departments"));
  const select = document.getElementById("divDeptSelect");
  select.innerHTML = "<option value=''>اختر قسم</option>";

  snap.forEach(d => {
    select.innerHTML += `<option value="${d.id}">${d.data().name}</option>`;
  });
}

async function loadDivSelect() {
  const snap = await getDocs(collection(db, "divisions"));
  const select = document.getElementById("empDivSelect");
  select.innerHTML = "<option value=''>اختر شعبة</option>";

  snap.forEach(d => {
    select.innerHTML += `<option value="${d.id}">${d.data().name}</option>`;
  });
}

/* ------------------ إضافة مؤسسة ------------------ */

export async function addOrganization() {
  const name = document.getElementById("orgName").value;
  if (!name.trim()) return alert("أدخل اسم المؤسسة");

  await addDoc(collection(db, "organizations"), { name });
  document.getElementById("orgName").value = "";
  loadOrganizations();
}

/* ------------------ عرض المؤسسات ------------------ */

export async function loadOrganizations() {
  const list = document.getElementById("orgList");
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "organizations"));
  snap.forEach(d => {
    const data = d.data();
    list.innerHTML += `
      <div class="card p-2 mb-2">
        <b>${data.name}</b>
        <div>
          <button class="btn btn-sm btn-warning" onclick="openEdit('${d.id}','organizations','${data.name}')">تعديل</button>
          <button class="btn btn-sm btn-danger" onclick="deleteOrganization('${d.id}')">حذف</button>
        </div>
      </div>
    `;
  });
}

export async function deleteOrganization(id) {
  await deleteDoc(doc(db, "organizations", id));
  loadOrganizations();
}

/* ------------------ إضافة قسم ------------------ */

export async function addDepartment() {
  const name = document.getElementById("deptName").value;
  const orgId = document.getElementById("deptOrgSelect").value;

  if (!name.trim() || !orgId) return alert("أدخل البيانات كاملة");

  await addDoc(collection(db, "departments"), {
    name,
    organizationId: orgId
  });

  document.getElementById("deptName").value = "";
  loadDepartments();
}

/* ------------------ عرض الأقسام ------------------ */

export async function loadDepartments() {
  const list = document.getElementById("deptList");
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "departments"));
  snap.forEach(d => {
    const data = d.data();
    list.innerHTML += `
      <div class="card p-2 mb-2">
        <b>${data.name}</b> — مؤسسة: ${data.organizationId}
        <div>
          <button class="btn btn-sm btn-warning" onclick="openEdit('${d.id}','departments','${data.name}','${data.organizationId}')">تعديل</button>
          <button class="btn btn-sm btn-danger" onclick="deleteDepartment('${d.id}')">حذف</button>
        </div>
      </div>
    `;
  });
}

export async function deleteDepartment(id) {
  await deleteDoc(doc(db, "departments", id));
  loadDepartments();
}

/* ------------------ إضافة شعبة ------------------ */

export async function addDivision() {
  const name = document.getElementById("divName").value;
  const deptId = document.getElementById("divDeptSelect").value;

  if (!name.trim() || !deptId) return alert("أدخل البيانات كاملة");

  await addDoc(collection(db, "divisions"), {
    name,
    departmentId: deptId
  });

  document.getElementById("divName").value = "";
  loadDivisions();
}

/* ------------------ عرض الشعب ------------------ */

export async function loadDivisions() {
  const list = document.getElementById("divList");
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "divisions"));
  snap.forEach(d => {
    const data = d.data();
    list.innerHTML += `
      <div class="card p-2 mb-2">
        <b>${data.name}</b> — قسم: ${data.departmentId}
        <div>
          <button class="btn btn-sm btn-warning" onclick="openEdit('${d.id}','divisions','${data.name}','${data.departmentId}')">تعديل</button>
          <button class="btn btn-sm btn-danger" onclick="deleteDivision('${d.id}')">حذف</button>
        </div>
      </div>
    `;
  });
}

export async function deleteDivision(id) {
  await deleteDoc(doc(db, "divisions", id));
  loadDivisions();
}

/* ------------------ إضافة موظف ------------------ */

export async function addEmployee() {
  const name = document.getElementById("empName").value;
  const divId = document.getElementById("empDivSelect").value;

  if (!name.trim() || !divId) return alert("أدخل البيانات كاملة");

  await addDoc(collection(db, "employees"), {
    name,
    divisionId: divId
  });

  document.getElementById("empName").value = "";
  loadEmployees();
}

/* ------------------ عرض الموظفين ------------------ */

export async function loadEmployees() {
  const list = document.getElementById("empList");
  list.innerHTML = "";

  const snap = await getDocs(collection(db, "employees"));
  snap.forEach(d => {
    const data = d.data();
    list.innerHTML += `
      <div class="card p-2 mb-2">
        <b>${data.name}</b> — شعبة: ${data.divisionId}
        <div>
          <button class="btn btn-sm btn-warning" onclick="openEdit('${d.id}','employees','${data.name}','${data.divisionId}')">تعديل</button>
          <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${d.id}')">حذف</button>
        </div>
      </div>
    `;
  });
}

export async function deleteEmployee(id) {
  await deleteDoc(doc(db, "employees", id));
  loadEmployees();
}

/* ------------------ فتح مودال التعديل ------------------ */

window.openEdit = async function (id, type, name, relationId = "") {
  document.getElementById("editId").value = id;
  document.getElementById("editType").value = type;
  document.getElementById("editName").value = name;

  const select = document.getElementById("editSelect");
  select.innerHTML = "";

  if (type === "departments") {
    await loadOrgSelect();
    select.innerHTML = document.getElementById("deptOrgSelect").innerHTML;
    select.value = relationId;
  }

  if (type === "divisions") {
    await loadDeptSelect();
    select.innerHTML = document.getElementById("divDeptSelect").innerHTML;
    select.value = relationId;
  }

  if (type === "employees") {
    await loadDivSelect();
    select.innerHTML = document.getElementById("empDivSelect").innerHTML;
    select.value = relationId;
  }

  new bootstrap.Modal(document.getElementById("editModal")).show();
};

/* ------------------ حفظ التعديل ------------------ */

window.saveEdit = async function () {
  const id = document.getElementById("editId").value;
  const type = document.getElementById("editType").value;
  const name = document.getElementById("editName").value;
  const relation = document.getElementById("editSelect").value;

  const ref = doc(db, type, id);

  if (type === "organizations") {
    await updateDoc(ref, { name });
    loadOrganizations();
  }

  if (type === "departments") {
    await updateDoc(ref, { name, organizationId: relation });
    loadDepartments();
  }

  if (type === "divisions") {
    await updateDoc(ref, { name, departmentId: relation });
    loadDivisions();
  }

  if (type === "employees") {
    await updateDoc(ref, { name, divisionId: relation });
    loadEmployees();
  }

  bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
};

/* ------------------ تحميل البيانات عند فتح الصفحة ------------------ */

window.onload = () => {
  loadOrganizations();
  loadDepartments();
  loadDivisions();
  loadEmployees();

  loadOrgSelect();
  loadDeptSelect();
  loadDivSelect();
};
