import { auth } from "./firebaseHelper.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

const firestore = getFirestore();

window.closeForm = function (idForm) {
    document.getElementById(idForm).style.display = "none";
}

auth.onAuthStateChanged(async user => {
    if (user) {
        // User logged in
        try {
            const uid = user.uid;
            const userData = await getUserData(uid);
            if (userData) {
                console.log("User data found:", userData);
                displayUserInfo(userData);
            } else {
                console.error("User data not found.");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    } else {
        // No user logged in
        console.error("No user is currently logged in.");
    }
});

async function getUserData(uid) {
    try {
        const userDocRef = doc(firestore, 'Employees', uid);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
            return userDocSnapshot.data();
        } else {
            console.error("User data not found.");
            return null;
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
}


function formatSalary(number) {
    return Number(number).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

async function displayUserInfo(userData) {
    document.getElementById('fullName').textContent = userData.fullName || '';
    document.getElementById('email').textContent = userData.email || '';
    document.getElementById('phoneNumber').textContent = userData.phoneNumber || '';
    document.getElementById('idCard').textContent = userData.idCard || '';
    document.getElementById('salary').textContent = formatSalary(userData.salary) || '';
    document.getElementById('jobPosition').textContent = userData.userType || '';
    document.getElementById('address').textContent = userData.address || '';
    document.getElementById('birthdate').textContent = new Date(userData.birthdate).toLocaleDateString() || '';

    // Chuyển đổi giá trị của gender
    if (userData.gender) {
        document.getElementById('gender').textContent = userData.gender === 'Male' ? 'Nam' : 'Nữ';
    } else {
        document.getElementById('gender').textContent = '';
    }

    document.getElementById('bio').textContent = userData.bio || '';
}

// Hàm cập nhật dữ liệu người dùng trong Firestore
async function updateUserData(uid, newData) {
    try {
        const userDocRef = doc(firestore, 'Employees', uid);
        await updateDoc(userDocRef, newData);
        console.log("User data updated successfully.");
        return true;
    } catch (error) {
        console.error("Error updating user data:", error);
        return false;
    }
}

window.updateUserInfo = async function () {
    document.getElementById('updateForm').style.display = "block";

    try {
        const user = auth.currentUser;
        if (user) {
            const uid = user.uid;
            const userData = await getUserData(uid);
            if (userData) {
                // Điền dữ liệu từ userData vào các trường trong form
                document.getElementById('updateFullName').value = userData.fullName;
                document.getElementById('updatePhoneNumber').value = userData.phoneNumber;
                document.getElementById('updateIdCard').value = userData.idCard;
                document.getElementById('updateAddress').value = userData.address || ""; // Kiểm tra nếu có địa chỉ, nếu không thì để là rỗng
                document.getElementById('updateBirthdate').value = userData.birthdate || "";
                document.getElementById('updateGender').value = userData.gender;
                document.getElementById('updateBio').value = userData.bio || "";
            } else {
                console.error("User data not found.");
            }
        } else {
            console.error("No user is currently logged in.");
        }
    } catch (error) {
        console.error("Error updating user data:", error);
    }
}

window.acceptUpdate = async function () {
    // Lấy giá trị từ các trường nhập liệu trong form
    const updateFullName = document.getElementById('updateFullName').value;
    const updatePhoneNumber = parseInt(document.getElementById('updatePhoneNumber').value);
    const updateIdCard = parseInt(document.getElementById('updateIdCard').value);
    const updateAddress = document.getElementById('updateAddress').value;
    const updateBirthdate = document.getElementById('updateBirthdate').value;
    const updateGender = document.getElementById('updateGender').value;
    const updateBio = document.getElementById('updateBio').value;

    // Kiểm tra điều kiện dữ liệu không được bỏ trống
    if (!updateFullName || !updatePhoneNumber || !updateIdCard || !updateAddress || !updateBirthdate || !updateGender || !updateBio) {
        alert("Vui lòng điền đầy đủ thông tin.");
        return;
    }

    try {
        const user = auth.currentUser;
        if (user) {
            const uid = user.uid;
            const userData = await getUserData(uid);
            if (!userData) {
                console.error("User data not available.");
                return;
            }

            // Tạo đối tượng mới chứa dữ liệu cập nhật
            const newData = {
                fullName: updateFullName,
                phoneNumber: updatePhoneNumber,
                idCard: updateIdCard,
                address: updateAddress,
                birthdate: updateBirthdate,
                gender: updateGender,
                bio: updateBio,
                email: userData.email,
                userType: userData.userType,
                salary: userData.salary
            };

            const success = await updateUserData(uid, newData);
            if (success) {
                closeForm('updateForm');
                alert("Cập nhật thành công");
                displayUserInfo(newData);
            } else {
                console.error("Update user data failed.");
            }
        } else {
            console.error("No user is currently logged in.");
        }
    } catch (error) {
        console.error("Error updating user data:", error);
    }
}
