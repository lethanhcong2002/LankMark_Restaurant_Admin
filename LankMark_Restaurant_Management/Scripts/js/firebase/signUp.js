import { auth } from "./firebaseHelper.js";
import { createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, query, where, getDocs, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

const firestore = getFirestore();
async function createStaffAccount(email, password, fullName, phoneNumber, userType, salary, idCard) {
    try {
        idCard = parseInt(idCard); // Chuyển đổi sang kiểu số
        phoneNumber = parseInt(phoneNumber); // Chuyển đổi sang kiểu số

        // Kiểm tra xem idCard đã tồn tại chưa
        const idCardQuery = query(collection(firestore, 'Employees'), where('idCard', '==', idCard));
        const idCardSnapshot = await getDocs(idCardQuery);

        if (!idCardSnapshot.empty) {
            idCardSnapshot.forEach(async (doc) => {
                const employeeData = doc.data();
                if (employeeData.status === 'inactive') {
                    // Xóa trạng thái 'deleted'
                    await updateDoc(doc.ref, { status: 'active' });
                    // Tiếp tục tạo tài khoản nhân viên
                    await continueCreateStaffAccount(email, password, fullName, phoneNumber, userType, salary, idCard);
                } else {
                    alert("Căn cước công dân đã tồn tại.");
                }
            });
        } else {
            // Tiếp tục tạo tài khoản nhân viên
            await continueCreateStaffAccount(email, password, fullName, phoneNumber, userType, salary, idCard);
        }
    } catch (error) {
        console.error("Error signing up:", error);
    }
}

async function continueCreateStaffAccount(email, password, fullName, phoneNumber, userType, salary, idCard) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential && userCredential.user) {
        await sendEmailVerification(userCredential.user);
        const userInfo = {
            fullName,
            phoneNumber: parseInt(phoneNumber),
            userType,
            salary: parseInt(salary),
            idCard: parseInt(idCard),
            email: email,
            createdAt: new Date().toISOString(),
            status: "active"
        };
        await saveUserInfo(userCredential.user.uid, userInfo);
    } else {
        console.error("Error signing up: User not available");
    }
}

async function saveUserInfo(userId, userInfo) {
    try {
        const userRef = doc(firestore, 'Employees', userId);
        await setDoc(userRef, userInfo);
        window.location.href = document.getElementById("targetUrl").value;
        console.log("User info saved successfully.");
    } catch (error) {
        console.error("Error saving user info:", error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('signup-form').addEventListener('submit', async function (event) {
        event.preventDefault();

        const email = document.getElementById('emailAddress').value;
        const password = document.getElementById('password').value;
        const fullName = document.getElementById('fullName').value;
        const phoneNumber = document.getElementById('phoneNumber').value;
        const idCard = document.getElementById('idCard').value;
        const userType = document.getElementById('userType').value;
        const salary = document.getElementById('salary').value;

        await createStaffAccount(email, password, fullName, phoneNumber, userType, salary, idCard);
    });
});
