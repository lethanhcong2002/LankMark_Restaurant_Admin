import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-storage.js";
import { getFirestore, collection, doc, addDoc, setDoc, getDoc, onSnapshot, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';

const storage = getStorage();
const firestore = getFirestore();

async function loadDataFromFirebase() {
    const combinedTableBody = document.getElementById('listMenu');
    const menuRef = collection(firestore, 'MenuItem');

    const unsubscribe = onSnapshot(menuRef, (snapshot) => {
        combinedTableBody.innerHTML = '';
        snapshot.forEach((doc) => {
            const foodData = doc.data();
            const key = doc.id;
            const foodName = foodData.foodName;
            const role = foodData.role;
            const price = foodData.price;
            const status = foodData.status;

            if (status !== "deleted") {
                const tableRow = document.createElement('tr');
                tableRow.innerHTML = `
                    <td>${foodName}</td>
                    <td>${price}</td>
                    <td>${role}</td>
                    <td>
                        <button onclick="viewDetails('${key}')">Xem chi tiết</button>
                        <button onclick="deleteMenuItem('${key}')">Xóa</button>
                        <button onclick="editMenuItem('${key}')">Sửa</button>
                    </td>             
                `;
                combinedTableBody.appendChild(tableRow);
            }
        });
    });

    return unsubscribe;
}
loadDataFromFirebase();

//Detail
window.viewDetails = async function (key) {
    document.getElementById("tableDetailModal").style.display = "block";
    const menuRef = doc(firestore, 'MenuItem', key);

    try {
        const docSnapshot = await getDoc(menuRef);
        if (docSnapshot.exists()) {
            const tableData = docSnapshot.data();
            const foodName = tableData.foodName;
            const foodType = tableData.role;
            const foodPrice = tableData.price;
            const foodDescription = tableData.description;
            const foodImage = tableData.imageURL;

            const tableDetailContent = document.getElementById("tableDetailContent");

            tableDetailContent.innerHTML = '';

            let tableDetailHTML = `
            <h2>Thông tin chi tiết món ăn</h2>
            <p>Tên món: ${foodName}</p>
            <p>Loại món: ${foodType}</p>
            <p>Giá tiền: ${foodPrice}</p>
            <h4>Mô tả:</h4>
            <p>${foodDescription}</p>
            <h4>Hình ảnh:</h4>
            <img src="${foodImage}" alt="Hình ảnh món ăn">
        `;
            tableDetailContent.innerHTML = tableDetailHTML;
        } else {
            console.log("Reservation not found!");
        }
    } catch (error) {
        console.error("Error getting document:", error);
    }
}

window.closeTableDetailModal = async function () {
    document.getElementById("tableDetailModal").style.display = "none";
}

window.editMenuItem = async function (key) {
    const docRef = doc(firestore, 'MenuItem', key);

    try {
        const docSnapshot = await getDoc(docRef);
        if (docSnapshot.exists()) {
            const tableData = docSnapshot.data();

            document.getElementById('inputMenuKey').value = key;
            document.getElementById('inputFoodName').value = tableData.foodName;
            document.getElementById('inputfoodPrice').value = parseFloat(tableData.price);
            document.getElementById('inputFoodDescription').value = tableData.description;
            document.getElementById('role').value = tableData.role;
        }
    } catch (error) {
        console.error("Error getting document:", error);
    }

    document.getElementById("updateDetail").style.display = "block";
}

window.confirmUpdate = async function () {
    const menuKey = document.getElementById('inputMenuKey').value;
    const menuRef = doc(firestore, 'MenuItem', menuKey);
    let newData;

    const imageInput = document.getElementById('imageFood');
    if (imageInput.files.length === 0) {
        newData = {
            foodName: document.getElementById('inputFoodName').value,
            description: document.getElementById('inputFoodDescription').value,
            price: parseFloat(document.getElementById('inputfoodPrice').value),
            role: document.getElementById('role').value
        };
    } else {
        const imageFile = imageInput.files[0];
        const imageRef = storageRef(storage, 'menu_images/' + imageFile.name);

        try {
            await uploadBytes(imageRef, imageFile);
            const imageURL = await getDownloadURL(imageRef);

            newData = {
                foodName: document.getElementById('inputFoodName').value,
                description: document.getElementById('inputFoodDescription').value,
                price: parseFloat(document.getElementById('inputfoodPrice').value),
                role: document.getElementById('role').value,
                imageURL: imageURL
            };
        } catch (error) {
            alert("Đã xảy ra lỗi khi tải ảnh lên: " + error);
            return;
        }
    }

    try {
        await updateDoc(menuRef, newData);
        alert("Dữ liệu đã được cập nhật thành công!");
        document.getElementById('updateDetail').style.display = "none";
    } catch (error) {
        alert("Đã xảy ra lỗi khi cập nhật dữ liệu: " + error);
    }
};

window.closeUpdateForm = function () {
    document.getElementById('updateDetail').style.display = "none";
};

// Delete
window.deleteMenuItem = async function (key) {
    const confirmDelete = confirm("Bạn có chắc chắn muốn xóa mục này?");

    if (confirmDelete) {
        const dataRef = doc(firestore, 'MenuItem', key);

        try {
            await updateDoc(dataRef, { status: 'deleted' })
            alert("Hủy đặt thành công!");
        } catch (error) {
            console.error("Error getting document:", error);
        }
    } else {
        alert("Hủy bỏ xóa");
    }
};