import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';

const firestore = getFirestore();

function getISOStringFromDate(date) {
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    if (month < 10) {
        month = '0' + month;
    }

    if (day < 10) {
        day = '0' + day;
    }

    return `${year}-${month}-${day}T00:00:00.000Z`;
}

async function fetchDataFromFirebase() {
    const today = getISOStringFromDate(new Date());
    console.log(today);

    // Khởi tạo các biến để lưu số liệu
    let totalBookedTables = 0;
    let totalUnpaidInvoices = 0;
    let totalCancelledTables = 0;

    const reservationQuery = query(collection(firestore, 'Reservations'), where('bookingTime', '>=', today));
    const reservationSnapshot = await getDocs(reservationQuery);
    reservationSnapshot.forEach(doc => {
        const status = doc.data().status;
        if (status === 'Đã đặt' || status === 'Đã nhận bàn' || status === 'Đã thanh toán') {
            totalBookedTables++;
        } else if (status === 'Đã hủy') {
            totalCancelledTables++;
        }
    });

    const invoiceQuery = query(collection(firestore, 'Invoice'), where('timeReceived', '>=', today));
    const invoiceSnapshot = await getDocs(invoiceQuery);
    invoiceSnapshot.forEach(doc => {
        const status = doc.data().status;
        if (status === 'Chưa thanh toán') {
            totalUnpaidInvoices++;
        }
    });

    // Gán giá trị cho các phần tử HTML
    document.getElementById('countBooking').innerHTML = totalBookedTables;
    document.getElementById('countPayment').innerHTML = totalUnpaidInvoices;
    document.getElementById('countCancel').innerHTML = totalCancelledTables;
}

// Gọi hàm để lấy dữ liệu từ Firebase
fetchDataFromFirebase();

async function fetchBookedTables() {
    const today = getISOStringFromDate(new Date()); // Lấy ngày hôm nay dưới dạng chuỗi ISOString (YYYY-MM-DD)

    const reservationQuery = query(collection(firestore, 'Reservations'), where('bookingTime', '>=', today));
    const reservationSnapshot = await getDocs(reservationQuery);
  
    const listTable = document.getElementById('listTable');
    listTable.innerHTML = '';

    reservationSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === "Đã đặt" || data.status === "Đã nhận bàn") {
            const customerName = data.customerName;
            const receiveTime = data.bookingDate;
            const numberOfPeople = data.numberOfPeople;
            const status = data.status;

            const row = document.createElement('tr');
            row.innerHTML = `
            <td>${customerName}</td>
            <td>${new Date(receiveTime).toLocaleString()}</td>
            <td>${numberOfPeople}</td>
            <td>${status}</td>
        `;
            listTable.appendChild(row);
        }
    });
}

// Gọi hàm để lấy dữ liệu từ Firebase và hiển thị trong bảng HTML
fetchBookedTables();

async function fetchInvoiceTables() {
    const today = getISOStringFromDate(new Date()); // Lấy ngày hôm nay dưới dạng chuỗi ISOString (YYYY-MM-DD)

    const invoiceQuery = query(collection(firestore, 'Invoice'), where('timeReceived', '>=', today));
    const invoiceSnapshot = await getDocs(invoiceQuery);

    const listTable = document.getElementById('listInvoice');
    listTable.innerHTML = '';

    invoiceSnapshot.forEach(async docs => {
        const data = docs.data();
        if (data.status === "Chưa thanh toán") {
            const reservationKey = data.reservationKey;

            const reservationDocRef = doc(firestore, 'Reservations', reservationKey);

            try {
                const reservationDocSnapshot = await getDoc(reservationDocRef);
                if (reservationDocSnapshot.exists()) {
                    const reservationData = reservationDocSnapshot.data();
                    const customerName = reservationData.customerName;
                    const receiveTime = data.timeReceived;
                    const numberOfPeople = reservationData.numberOfPeople;
                    const status = data.status;

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${customerName}</td>
                        <td>${new Date(receiveTime).toLocaleString()}</td>
                        <td>${numberOfPeople}</td>
                        <td>${status}</td>
                    `;
                    listTable.appendChild(row);
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu đặt bàn:', error);
            }
        }
    });
}

// Gọi hàm để lấy dữ liệu từ Firebase và hiển thị trong bảng HTML
fetchInvoiceTables();