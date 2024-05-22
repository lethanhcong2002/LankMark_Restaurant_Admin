//listReservation.js
import { getFirestore, collection, doc, addDoc, setDoc, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';


const firestore = getFirestore();
// get list Table
async function loadDataFromFirebase(selectedOption) {
    const tableBody = document.getElementById('listTable');
    const collectionRef = collection(firestore, 'Reservations');

    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
        tableBody.innerHTML = '';
        snapshot.forEach((doc) => {
            const data = doc.data();

            let shouldDisplay = false;
            if (selectedOption === 'Tất cả') {
                shouldDisplay = true;
            } else if (selectedOption === 'Còn hoạt động' && (data.status === 'Đã đặt' || data.status === 'Đã nhận bàn')) {
                shouldDisplay = true;
            } else if (selectedOption === 'Đã hết hạn' && (data.status === 'Đã thanh toán' || data.status === 'Hủy đặt')) {
                shouldDisplay = true;
            }

            if (shouldDisplay) {
                const customerName = data.customerName;
                const numberOfPeople = data.numberOfPeople;
                const bookingDate = data.bookingDate;

                const newRow = document.createElement('tr');

                let statusClass = '';
                if (data.status === 'Đã đặt') {
                    statusClass = "badge bg-label-warning me-1";
                } else if (data.status === 'Đã nhận bàn') {
                    statusClass = 'badge bg-label-info me-1';
                }

                const bookingDateTime = new Date(bookingDate);
                const formattedDate = `${bookingDateTime.getDate()}/${bookingDateTime.getMonth() + 1}/${bookingDateTime.getFullYear()}`;
                const formattedTime = `${bookingDateTime.getHours()}:${bookingDateTime.getMinutes() < 10 ? '0' : ''}${bookingDateTime.getMinutes()}`;

                newRow.innerHTML = `
                    <td><i class="fab fa-angular fa-lg text-danger me-3"></i> <strong>${customerName}</strong></td>
                    <td>${formattedDate} ${formattedTime}</td>
                    <td>${numberOfPeople}</td>
                    <td><span class="${statusClass}">${data.status}</span></td>
                    <td>
                        <div class="dropdown">
                            <button type="button" class="btn p-0 dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
                                <i class="bx bx-dots-vertical-rounded"></i>
                            </button>
                            <div class="dropdown-menu">
                                    ${getButtonHtml(doc.id, data.status)}
                            </div>
                        </div>
                    </td>
                `;
                tableBody.appendChild(newRow);
            }
        });
    });
    return unsubscribe;
}

loadDataFromFirebase("Còn hoạt động");
// Lắng nghe sự kiện khi click vào một dropdown item
document.querySelectorAll('.dropdown-menu a.dropdown-item').forEach(item => {
    item.addEventListener('click', function () {
        const selectedOption = this.textContent.trim();
        document.getElementById('nameButton').innerHTML = selectedOption;
        loadDataFromFirebase(selectedOption);
    });
});


function getButtonHtml(reservationKey, status) {
    if (status === 'Đã đặt') {
        return `
            <a href="javascript:void(0);" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#modalScrollable" onclick="showDetail('${reservationKey}', false)"><i class="bx bx-detail me-1"></i> Chi tiết</a>

            <a href="javascript:void(0);" class="dropdown-item" onclick="if (confirm('Bạn có muốn hủy đặt bàn này không?')) { cancelBooking('${reservationKey}'); }"><i class="bx bx-trash me-1"></i> Hủy Đặt Bàn</a>

            <a href="javascript:void(0);" class="dropdown-item" onclick="showDetail('${reservationKey}', true)" data-bs-toggle="modal" data-bs-target="#modalScrollable"><i class="bx bx-check-circle me-1"></i> Nhận Bàn</a>`;
    }
    else {
        return `
            <a href="javascript:void(0);" class="dropdown-item" onclick="showDetail('${reservationKey}', false)" data-bs-toggle="modal" data-bs-target="#modalScrollable"><i class="bx bx-detail me-1"></i> Xem Chi Tiết</a>`;
    }
}

//reservation table
window.confirmBooking = async function () {
    const customerName = document.getElementById('inputCustomerName').value;
    const phoneNumber = parseFloat(document.getElementById('inputPhoneNumber').value);
    const idCard = parseFloat(document.getElementById('inputIdCard').value);
    const bookingDate = document.getElementById('inputPickupDate').value;
    const numberOfPeople = parseFloat(document.getElementById('inputNumberOfPeople').value);
    const bookingDateTime = new Date(bookingDate).toISOString();

    const currentTime = new Date().toISOString();
    if (customerName && phoneNumber && idCard && bookingDate && numberOfPeople) {
        try {
            const collectionRef = collection(firestore, 'Reservations');
            const docRef = await addDoc(collectionRef, {
                customerName: customerName,
                phoneNumber: phoneNumber,
                idCard: idCard,
                bookingDate: bookingDateTime,
                numberOfPeople: numberOfPeople,
                bookingTime: currentTime,
                status: "Đã đặt"
            });
            alert('Thêm thành công');
            document.getElementById('closeInputForm').click();
        } catch (error) {
            console.error('Error adding document: ', error);
        }
    } else {
        alert("Vui lòng nhập đủ thông tin.");
        return;
    }
}

function resetForm() {
    document.getElementById('booking-form').reset();
}

document.getElementById('closeInputForm').addEventListener('click', function () {
    resetForm();
});
// viewDetail
window.showDetail = async function (reservationId, check) {
    const docRef = doc(firestore, 'Reservations', reservationId);

    try {
        const docSnapshot = await getDoc(docRef);
        if (docSnapshot.exists()) {
            const reservationData = docSnapshot.data();

            const bookingDateTime = new Date(reservationData.bookingDate);
            const formattedDate = `${bookingDateTime.getDate()}/${bookingDateTime.getMonth() + 1}/${bookingDateTime.getFullYear()}`;
            const formattedTime = `${bookingDateTime.getHours()}:${bookingDateTime.getMinutes() < 10 ? '0' : ''}${bookingDateTime.getMinutes()}`;

            if (check === false) {
                document.getElementById('confirmTakeTable').style.display = 'none';
            } else {
                document.getElementById('confirmTakeTable').style.display = 'block';
            }

            const modalBody = document.getElementById('detailReservation');
            modalBody.innerHTML = `
                <p><strong>Tên khách hàng:</strong> ${reservationData.customerName || 'N/A'}</p>
                <p><strong>Số điện thoại:</strong> ${reservationData.phoneNumber || 'N/A'}</p>
                <p><strong>Căn cước:</strong> ${reservationData.idCard || 'N/A'}</p>
                <p><strong>Số người dự kiến:</strong> ${reservationData.numberOfPeople || 'N/A'}</p>
                <p><strong>Ngày đặt:</strong> ${formattedDate} ${formattedTime}</p>
            `;
            modalBody.setAttribute('data-reservation-id', reservationId);
            modalBody.setAttribute('data-reservation-name', reservationData.customerName);
        } else {
            console.log("Reservation not found!");
        }
    } catch (error) {
        console.error("Error getting document:", error);
    }
}
// Hàm confirmReservation
window.confirmReservation = async function () {

    const reservationKey = document.getElementById('detailReservation').getAttribute('data-reservation-id');

    const reservationRef = doc(firestore, 'Reservations', reservationKey);
    const invoiceRef = collection(firestore, 'Invoice');

    const currentTime = new Date().toISOString();

    try {
        await addDoc(invoiceRef, {
            reservationKey: reservationKey,
            timeReceived: currentTime,
            totalAmount: 0, 
            status: "Chưa thanh toán",
            content: "Hóa đơn khách hàng " + document.getElementById('detailReservation').getAttribute('data-reservation-name')
        });

        await setDoc(reservationRef, {
            status: 'Đã nhận bàn'
        }, { merge: true });

        alert("Nhận bàn thành công");
        document.getElementById('closeModalButton').click();
    } catch (error) {
        console.error("Error getting document:", error);
    }
}

//CancelBooking
window.cancelBooking = async function (reservationKey) {
    const reservationRef = doc(firestore, 'Reservations', reservationKey);

    try {
        await setDoc(reservationRef, {
            status: 'Hủy đặt'
        }, { merge: true });

        alert("Hủy đặt thành công!");
    } catch (error) {
        console.error("Error getting document:", error);
    }
}
