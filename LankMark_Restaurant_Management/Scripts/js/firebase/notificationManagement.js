import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';

const firestore = getFirestore();

async function displayNotifications() {
    const notificationTable = document.getElementById('notificationTable');
    // Clear existing table content
    notificationTable.innerHTML = '';

    try {
        // Query the "Notification" collection
        const querySnapshot = await getDocs(collection(firestore, 'Notification'));

        // Iterate through each document in the collection
        querySnapshot.forEach(doc => {
            // Create a new row for each notification
            const row = document.createElement('tr');

            // Create table cells to display notification content and time
            const contentCell = document.createElement('td');
            contentCell.textContent = doc.data().title;
            const timeCell = document.createElement('td');
            timeCell.textContent = new Date(doc.data().sentAt).toLocaleString();

            // Append cells to the row
            row.appendChild(contentCell);
            row.appendChild(timeCell);

            // Create action button cell
            const actionsCell = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'xóa';
            deleteButton.addEventListener('click', () => deleteNotification(doc.id)); // Pass document ID to delete function
            actionsCell.appendChild(deleteButton);

            // Append actions cell to the row
            row.appendChild(actionsCell);

            // Append row to the table
            notificationTable.appendChild(row);
        });
    } catch (error) {
        console.error('Error displaying notifications:', error);
    }
}

// Function to delete a notification
async function deleteNotification(notificationId) {
    try {
        await deleteDoc(doc(firestore, 'Notification', notificationId));
        console.log('Notification deleted successfully');
        // Refresh notification table after deletion
        displayNotifications();
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
}

displayNotifications();

window.createNotification = function () {
    document.getElementById('inputForm').style.display = "block";
}

window.addNotification = async function () {
    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;
    const currentTime = new Date().toISOString(); // Lấy thời gian hiện tại

    // Gửi email cho tất cả nhân viên
    sendEmail(title, content)
        .then(async () => {
            // Nếu gửi email thành công, thêm thông báo vào Firestore với thời gian gửi
            const collectionRef = collection(firestore, 'Notification');
            try {
                const docRef = await addDoc(collectionRef, {
                    title: title,
                    content: content,
                    sentAt: currentTime 
                });
                console.log('Document written with ID: ', docRef.id);
            } catch (error) {
                console.error('Error adding document: ', error);
            }
        })
        .catch(error => {
            console.error('Error sending emails:', error);
        });
    closeForm('inputForm');
}

window.updateForm = function() {
    const notificationType = document.getElementById('notificationType').value;
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');

    // Xác định nội dung cho title và content dựa trên loại thông báo đã chọn
    switch (notificationType) {
        case 'holiday':
            titleInput.value = 'Thông báo nghỉ lễ';
            contentInput.value = `
                    <p>Kính gửi toàn thể nhân viên,</p>

                    <p>Chúng tôi xin thông báo rằng do dịp Tết Nguyên Đán đang đến gần, công ty sẽ tạm nghỉ làm việc trong thời gian sau:</p>

                    <ul>
                        <li><strong>Thời gian nghỉ:</strong> Từ ngày 30/01/2025 (thứ Tư) đến hết ngày 03/02/2025 (thứ Năm).</li>
                        <li><strong>Thời gian làm việc trở lại:</strong> Bắt đầu từ ngày 04/02/2025 (thứ Sáu).</li>
                    </ul>

                    <p>Trong thời gian nghỉ này, toàn bộ hoạt động kinh doanh sẽ tạm dừng. Chúng tôi khuyến khích tất cả nhân viên thư giãn và tận hưởng những khoảnh khắc ý nghĩa bên gia đình và người thân.</p>

                    <p>Mọi thắc mắc hoặc yêu cầu cần hỗ trợ, xin vui lòng liên hệ với bộ phận nhân sự hoặc quản lý trực tiếp của bạn.</p>

                    <p>Chúc mừng năm mới và chúc các bạn có những ngày nghỉ vui vẻ và an lành!</p>

                    <p>Trân trọng,<br>
                    Ban Quản lý Nhân sự<br>
                    LankMark Restaurant</p>`;
            break;
        case 'meeting':
            titleInput.value = 'Thông báo cuộc họp';
            contentInput.value = `
                    <p>Kính gửi toàn thể nhân viên,</p>

                    <p>Chúng tôi xin thông báo về cuộc họp thường kỳ của công ty sẽ diễn ra vào:</p>

                    <ul>
                        <li><strong>Thời gian:</strong> Thứ Hai, ngày 15/04/2024, từ 8:00 sáng đến 10:00 sáng.</li>
                        <li><strong>Địa điểm:</strong> Phòng họp tầng 5, tòa nhà A.</li>
                    </ul>

                    <p>Nội dung cuộc họp bao gồm:</p>
                    <ul>
                        <li>Báo cáo về tình hình hoạt động kinh doanh trong quý 1/2024.</li>
                        <li>Phân tích các chỉ số hiệu suất và doanh thu.</li>
                        <li>Thảo luận về kế hoạch và mục tiêu cho quý 2/2024.</li>
                        <li>Các vấn đề và ý kiến phát triển từ các bộ phận.</li>
                    </ul>

                    <p>Vui lòng sắp xếp thời gian để tham dự cuộc họp này. Mọi thông tin chi tiết sẽ được thông báo trong email mời chính thức sắp tới.</p>

                    <p>Xin cảm ơn và mong sự tham gia tích cực từ tất cả các bạn.</p>

                    <p>Trân trọng,<br>
                    Ban Quản lý<br>
                    LankMark Restaurant</p>`;
            break;
        default:
            titleInput.value = '';
            contentInput.value = '';
    }
}

async function sendEmail(Subject, Body) {

    const employeeCollection = collection(firestore, "Employees");
    const snapshot = await getDocs(employeeCollection);

    snapshot.forEach((doc) => {
        if (doc.data().status !== "inactive") {
            Email.send({
                Host: "smtp.elasticemail.com",
                Username: "lankmarkrestaurant@gmail.com",
                Password: "6302100AD1A0ABBDAB915DE1EDACB6CE3759",
                To: doc.data().email,
                From: "lankmarkrestaurant@gmail.com",
                Subject: Subject,
                Body: Body
            }).then(
                async function (message) {
                    console.log("Gửi email thành công:", message);
                },
                function (error) {
                    console.error("Lỗi khi gửi email:", error);
                }
            );
        }
    });   
}

window.closeForm = function (idForm) {
    document.getElementById(idForm).style.display = "none";
}