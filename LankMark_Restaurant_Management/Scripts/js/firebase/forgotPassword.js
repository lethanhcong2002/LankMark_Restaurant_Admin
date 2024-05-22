import { auth } from "./firebaseHelper.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

window.sendResetLink = async function () {
    event.preventDefault();

    const email = document.getElementById('email').value;

    try {
        await sendPasswordResetEmail(auth, email);
        alert('Password reset email sent! Please check your email inbox.');
        window.location.href = signInUrl;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        alert('An error occurred. Please try again later.');
    }
}