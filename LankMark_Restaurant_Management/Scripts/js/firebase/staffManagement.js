import { getFirestore, collection, doc, updateDoc, onSnapshot, query, where, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

function formatSalary(number) {
    // Sử dụng phương thức toLocaleString() để định dạng số thành chuỗi tiền tệ
    return Number(number).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

const firestore = getFirestore();

async function getEmployeesByUserType() {
    const employeeTableBody = document.getElementById("employeeTable");

    const userRef = collection(firestore, 'Employees');
    const q = query(userRef, where('status', '!=', 'inactive'));
    onSnapshot(q, async (snapshot) => {
        employeeTableBody.innerHTML = '';
        snapshot.forEach(async (doc) => {
            const userData = doc.data();
            const userKey = doc.id;

            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                    <td>${userData.fullName}</td>
                    <td>${userData.userType}</td>
                    <td>
                        <button onclick="detailEmployee('${userKey}')">Chi tiết</button>
                        <button onclick="salaryAdjustment('${userKey}')">Điều chỉnh tiền lương</button>
                        <button onclick="deleteEmployee('${userKey}')">Sa thải</button>
                    </td>
                `;
            employeeTableBody.appendChild(newRow);
        });
    });
}
getEmployeesByUserType();

//closeForm
window.closeForm = function (formId) {
    document.getElementById(formId).style.display = "none";
}

window.detailEmployee = async function (key) {
    const employeeDetail = doc(firestore, 'Employees', key);
    document.getElementById("tableDetailModal").style.display = "block";
    const docSnapshot = await getDoc(employeeDetail);
    if (docSnapshot.exists()) {
        const tableData = docSnapshot.data();
        const tableDetailContent = document.getElementById("tableDetailContent");

        tableDetailContent.innerHTML = '';

        let tableDetailHTML = `
            <h2>Thông tin nhân viên</h2>
            <p>Tên: ${tableData.fullName}</p>
            <p>Vị trí công việc: ${tableData.userType}</p>
            <p>Email: ${tableData.email}</p>
            <p>Căn cước công dân: ${tableData.idCard}</p>
            <p>Số điện thoại: ${tableData.phoneNumber}</p>  
            <p>Lương: ${formatSalary(tableData.salary)}</p>
            <p>Ngày tuyển dụng: ${tableData.createdAt}</p>
        `;
        tableDetailContent.innerHTML = tableDetailHTML;
    }
}
// sa thai nhan vien
window.deleteEmployee = async function (key) {
    const confirmDelete = confirm("Bạn có chắc chắn muốn sa thải nhân viên này?");
    if (confirmDelete) {
        const deleteItem = doc(firestore, 'Employees', key);
        try {
            await updateDoc(deleteItem, { status: "inactive" });
            alert("Sa thải thành công");
        } catch (error) {
            alert("Lỗi khi sa thải: " + error.message);
        }
    } else {
        alert("Hủy sa thải");
    }
}
//salaryAdjustment
window.salaryAdjustment = async function (key) {
    const salaryChange = doc(firestore, 'Employees', key);

    try {
        const docSnapshot = await getDoc(salaryChange);
        if (docSnapshot.exists()) {
            const itemData = docSnapshot.data();

            document.getElementById('inputKey').value = key;
            document.getElementById("inputName").value = itemData.fullName;
            document.getElementById("oldSalary").value = parseFloat(itemData.salary);
            document.getElementById("newSalary").value = parseFloat(itemData.salary);
            document.getElementById("updateDetail").style.display = "block";
        } else {
            alert("Không tìm thấy nhân viên.");
        }
    } catch (error) {
        alert("Lỗi khi điều chỉnh lương: " + error.message);
    }
}

window.confirmUpdate = async function () {
    const employeeKey = document.getElementById('inputKey').value;
    const newSalary = parseFloat(document.getElementById('newSalary').value);

    // Kiểm tra xem newSalary có phải là một số hợp lệ hay không
    if (isNaN(newSalary)) {
        alert("Vui lòng nhập một số hợp lệ cho lương mới.");
        return;
    }

    const employeeRef = doc(firestore, 'Employees', employeeKey);
    const newData = { salary: newSalary };

    try {
        await updateDoc(employeeRef, newData);
        alert("Lương đã được cập nhật thành công!");
        document.getElementById('updateDetail').style.display = "none";
    } catch (error) {
        alert("Đã xảy ra lỗi khi cập nhật lương: " + error.message);
    }
};

