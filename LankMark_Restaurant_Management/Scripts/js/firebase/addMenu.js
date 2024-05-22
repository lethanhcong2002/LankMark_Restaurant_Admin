import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-storage.js";
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';

const storage = getStorage();
const firestore = getFirestore();

async function saveMenuItemToFirestore(foodName, price, description, role, imageFile) {
    try {
        // Lưu ảnh vào Firebase Storage
        const storageImage = storageRef(storage, 'menu_images/' + imageFile.name);
        await uploadBytes(storageImage, imageFile);

        // Lấy đường dẫn của ảnh từ Firebase Storage
        const imageURL = await getDownloadURL(storageImage);

        // Lưu thông tin của món ăn vào Firestore cùng với đường dẫn của ảnh
        const collectionRef = collection(firestore, 'MenuItem');
        await addDoc(collectionRef, { foodName, price, description, role, imageURL });

        console.log("Data saved successfully to Firestore");
    } catch (error) {
        console.error("Error saving data to Firestore:", error);
    }
}

window.confirmAdd = async function () {
    event.preventDefault();
    const foodName = document.getElementById('foodName').value;
    const price = parseFloat(document.getElementById('price').value);
    const description = document.getElementById('description').value;
    const role = document.getElementById('role').value;
    const imageFile = document.getElementById('imageFood').files[0];

    if (!imageFile) {
        console.error("No image file selected.");
        return;
    }

    try {
        await saveMenuItemToFirestore(foodName, price, description, role, imageFile);
        alert('Thêm mới thành công');
        window.location.href = document.getElementById('menuUrl').value;
    } catch (error) {
        console.error("An error occurred while saving data:", error);
        // Thêm code để hiển thị thông báo lỗi cho người dùng nếu cần
    }
}

