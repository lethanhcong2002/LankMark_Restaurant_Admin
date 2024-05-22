import { auth, signInWithEmailAndPassword } from "./firebaseHelper.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

const firestore = getFirestore();

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('login-form').addEventListener('submit', async function (event) {
        event.preventDefault();

        const email = document.getElementById('emailAddress').value;
        const password = document.getElementById('password').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (user) {
                if (user.emailVerified) {
                    const userData = await getUserData(user.uid);
                    if (userData) {
                        handleUserData(userData, user.uid);
                        showMessage('Đăng nhập thành công! Đang chuyển hướng', 'success');
                        setTimeout(() => {
                            window.location.href = homeScreenUrl;
                        }, 3000);
                    } else {
                        showMessage('Dữ liệu người dùng không tồn tại.', 'fail');
                    }
                } else {
                    showMessage('Email chưa được xác minh.', 'fail');
                }
            } else {
                showMessage('Tài khoản hoặc mật khẩu không chính xác.', 'fail');
            }
        } catch (error) {
            showMessage('Tài khoản hoặc mật khẩu không chính xác.', 'fail');
        }
    });
});

function showMessage(message, type) {
    const backgroundOverlay = document.createElement('div');
    backgroundOverlay.style.position = 'fixed';
    backgroundOverlay.style.top = '0';
    backgroundOverlay.style.left = '0';
    backgroundOverlay.style.width = '100%';
    backgroundOverlay.style.height = '100%';
    backgroundOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
    backgroundOverlay.style.zIndex = '9998';
    document.body.appendChild(backgroundOverlay);

    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    if (type === 'success') {
        messageElement.style.backgroundColor = '#dff0d8';
        messageElement.style.color = '#3c763d';
        messageElement.style.border = '1px solid #d6e9c6';
    } else {
        messageElement.style.backgroundColor = '#f2dede';
        messageElement.style.color = '#a94442';
        messageElement.style.border = '1px solid #ebccd1';
    }
    messageElement.style.padding = '50px';
    messageElement.style.margin = 'auto';
    messageElement.style.width = 'fit-content';
    messageElement.style.textAlign = 'center';
    messageElement.style.borderRadius = '10px';
    messageElement.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
    messageElement.style.position = 'fixed';
    messageElement.style.top = '50%';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translate(-50%, -50%)';
    messageElement.style.zIndex = '9999';
    messageElement.style.fontWeight = 'bold';
    messageElement.style.fontSize = '20px';

    document.body.appendChild(messageElement);

    setTimeout(() => {
        messageElement.remove();
        backgroundOverlay.remove();
    }, 2000);
}

async function getUserData(userId) {
    try {
        const docRef = doc(firestore, 'Employees', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            console.error('User data not found.');
            return null;
        }
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

function handleUserData(userData, userId) {
    if (userData) {
        userData.userID = userId;
        console.log(userData.userID);
        if (auth.currentUser) {
            sessionStorage.setItem('userData', JSON.stringify(userData));
            console.log(auth.currentUser);
        } else {
            console.error('No user is currently logged in.');
        }
    } else {
        console.error('No user data available.');
    }
}
