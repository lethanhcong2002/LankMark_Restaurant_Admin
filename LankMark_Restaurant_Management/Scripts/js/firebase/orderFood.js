//orderFood.js
import { getFirestore, collection, doc, addDoc, setDoc, query, getDocs, getDoc, onSnapshot, where, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';

const firestore = getFirestore();

function formatCurrency(number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
}

// Hàm lấy dữ liệu của một reservationKey cụ thể từ Firebase
async function getReservationData(reservationKey) {
    const docRef = doc(firestore, 'Reservations', reservationKey);

    try {
        const docSnapshot = await getDoc(docRef);
        if (docSnapshot.exists()) {
            return docSnapshot.data();
        }
    } catch (error) {
        throw error;
    }
}

async function getMenuData(menuItemKey) {
    const docRef = doc(firestore, 'MenuItem', menuItemKey);

    try {
        const docSnapshot = await getDoc(docRef);
        if (docSnapshot.exists()) {
            return docSnapshot.data();
        }
    } catch (error) {
        throw error;
    }
}

// Hàm lấy dữ liệu từ Firebase và hiển thị trong bảng
async function loadDataFromFirebase(selectedOption) {

    const tableBody = document.getElementById('receivedTablesBody');
    const collectionRef = collection(firestore, 'Invoice');

    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
        tableBody.innerHTML = '';

        snapshot.forEach((doc) => {
            const invoiceKey = doc.id;
            const invoiceData = doc.data();
            const status = invoiceData.status;

            let shouldDisplay = false;
            if (selectedOption === 'Tất cả') {
                shouldDisplay = true;
            } else if (selectedOption === 'Chưa thanh toán' && status === 'Chưa thanh toán') {
                shouldDisplay = true;
            } else if (selectedOption === 'Đã thanh toán' && status === 'Đã thanh toán') {
                shouldDisplay = true;
            }

            if (shouldDisplay) {
                const timeReceived = invoiceData.timeReceived;
                const reservationKey = invoiceData.reservationKey;

                getReservationData(reservationKey)
                    .then((reservationData) => {
                        const customerName = reservationData.customerName;
                        const bookingDateTime = new Date(timeReceived);
                        const formattedDate = `${bookingDateTime.getDate()}/${bookingDateTime.getMonth() + 1}/${bookingDateTime.getFullYear()}`;
                        const formattedTime = `${bookingDateTime.getHours()}:${bookingDateTime.getMinutes() < 10 ? '0' : ''}${bookingDateTime.getMinutes()}`;

                        const newRow = document.createElement('tr');

                        newRow.innerHTML = `
                            <td><i class="fab fa-angular fa-lg text-danger me-3"></i> <strong>${customerName}</strong></td>
                            <td>${formattedDate} ${formattedTime}</td>
                            <td>
                                <div class="dropdown">
                                    <button type="button" class="btn p-0 dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
                                        <i class="bx bx-dots-vertical-rounded"></i>
                                    </button>
                                    <div class="dropdown-menu">
                                        ${(status === 'Đã thanh toán') ?
                                            `<a href="javascript:void(0);" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#tableDetailModal" onclick="showDetail('${invoiceKey}', false)">
                                                <i class="bx bx-detail me-1"></i> Xem chi tiết
                                            </a>` :
                                            `<a href="javascript:void(0);" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#tableDetailModal" onclick="showDetail('${invoiceKey}', false)">
                                                <i class="bx bx-detail me-1"></i> Xem chi tiết
                                            </a>
                                            <a href="javascript:void(0);" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#modalScrollable" onclick="order('${invoiceKey}')">
                                                <i class="bx bx-dish me-1"></i> Đặt món
                                            </a>
                                            <a href="javascript:void(0);" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#tableDetailModal" onclick="showDetail('${invoiceKey}', true)">
                                                <i class='bx bx-cart'></i> Thanh toán
                                            </a>`
                            }
                                    </div>
                                </div>
                            </td>`;
                        tableBody.appendChild(newRow);
                    })
            }
        });
    });
    return unsubscribe;
}

loadDataFromFirebase('Chưa thanh toán');

document.querySelectorAll('.dropdown-menu a.dropdown-item').forEach(item => {
    item.addEventListener('click', function () {
        const selectedOption = this.textContent.trim();
        document.getElementById('nameButton').innerHTML = selectedOption;
        loadDataFromFirebase(selectedOption);
    });
});


let itemIdCounter = 0;
window.order = function (key) {

    const modalBody = document.getElementById("addMenu");
    modalBody.setAttribute("data-invoice-id", key);

    const menuRef = collection(firestore, 'MenuItem');
    const unsubscribe = onSnapshot(menuRef, (snapshot) => {
        let menuContent = '';

        snapshot.forEach((doc) => {
            const menuItem = doc.data();
            if (menuItem.status !== "deleted") {
                itemIdCounter++;
                const itemId = `itemQuality${itemIdCounter}`;
                menuContent += `
                    <tr>
                        <td><img src="${menuItem.imageURL}" alt="${menuItem.foodName}" width="100"></td>
                        <td>${menuItem.foodName}</td>
                        <td>${menuItem.role}</td>
                        <td>${formatCurrency(menuItem.price)}</td>
                        <td><input type="number" value="1" min="1" required class="form-control" id="${itemId}"></td>
                        <td><button onclick="addToOrder('${menuItem.foodName}', document.getElementById('${itemId}').value, '${doc.id}', '${menuItem.price}')" type="button" class="btn btn-outline-primary">Thêm vào đơn</button></td>
                    </tr>
                `;
            }
        });

        modalBody.innerHTML = `
            <table class="table">
                <thead class="table-light">
                    <tr>
                        <tr>
                            <th>Ảnh</th>
                            <th>Tên món</th>
                            <th>Loại</th>
                            <th>Giá</th>
                            <th>Số lượng</th>
                            <th>Chức năng</th>
                        </tr>
                    </tr>
                </thead>
                <tbody class="table-border-bottom-0" id="menuItems">
                    ${menuContent}
                </tbody>
            </table>
        `;
        document.getElementById('listMenu').innerHTML = '';
        checkOrderedItems(key)
    });

    return unsubscribe; // Trả về hàm unsubscribe để dừng lắng nghe sự kiện snapshot
}


// Hàm lấy dữ liệu các món đã đặt hàng và hiển thị trong bảng listMenu
async function checkOrderedItems(key) {
    const queryRef = query(collection(firestore, 'InvoiceDetail'), where('invoiceKey', '==', key));

    try {
        const snapshot = await getDocs(queryRef);
        if (!snapshot.empty) {
            snapshot.forEach(async (docs) => {
                const invoiceItem = docs.data();
                const menuItemKey = invoiceItem.menuItemKey;
                const itemQuantity = invoiceItem.itemQuantity;

                try {
                    const menuItemDoc = await getDoc(doc(firestore, 'MenuItem', menuItemKey));
                    if (menuItemDoc.exists()) {
                        const menuItemData = menuItemDoc.data();
                        addToOrder(menuItemData.foodName, itemQuantity, menuItemKey, menuItemData.price);
                    } else {
                        console.error('Món ăn không tồn tại');
                    }
                } catch (error) {
                    console.error('Lỗi khi lấy dữ liệu món ăn:', error);
                }
            });
        }
    } catch (error) {
        console.error('Lỗi khi truy vấn dữ liệu từ InvoiceDetail:', error);
    }
}

//search
window.onload = function () {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keyup', function () {
        const searchText = searchInput.value.toLowerCase();
        const menuItems = document.getElementById('menuItems');
        const menuItemsRows = menuItems.getElementsByTagName('tr');

        for (let i = 0; i < menuItemsRows.length; i++) {
            const itemName = menuItemsRows[i].getElementsByTagName('td')[1];
            if (itemName) {
                const itemText = itemName.textContent || itemName.innerText;
                if (itemText.toLowerCase().indexOf(searchText) > -1) {
                    menuItemsRows[i].style.display = '';
                } else {
                    menuItemsRows[i].style.display = 'none';
                }
            }
        }
    });
};

// Hàm thêm món vào đơn đặt hàng
window.addToOrder = function (foodName, itemQuantity, menuItemKey, price) {
    const listMenu = document.getElementById('listMenu');
    const listItems = listMenu.querySelectorAll('li');
    let existingItem = null;
    listItems.forEach(item => {
        if (item.getAttribute('data-menu-item-key') === menuItemKey) {
            existingItem = item;
        }
    });

    if (existingItem) {
        const quantityElement = existingItem.querySelector('.quantity');
        const currentQuantity = parseInt(existingItem.getAttribute('data-item-quantity'));
        const newQuantity = currentQuantity + parseInt(itemQuantity);
        quantityElement.textContent = `${newQuantity}`;
        existingItem.setAttribute('data-item-quantity', newQuantity);
    } else {
        const listItem = document.createElement('li');
        listItem.setAttribute('data-item-quantity', itemQuantity);
        listItem.setAttribute('data-menu-item-key', menuItemKey);
        listItem.setAttribute('data-item-price', price);
        listItem.innerHTML = `${foodName}: <span class="quantity">${itemQuantity}</span>`;
        listMenu.appendChild(listItem);
    }
};

//confirm Menu
window.confirmMenu = async function () {
    try {
        const invoiceKey = document.getElementById("addMenu").getAttribute("data-invoice-id");
        const orderedItems = document.querySelectorAll('#listMenu li');
        let totalAmount = 0;

        for (const item of orderedItems) {
            const itemQuantity = parseInt(item.getAttribute('data-item-quantity'));
            const itemPrice = parseInt(item.getAttribute('data-item-price'));
            const menuItemKey = item.getAttribute('data-menu-item-key');
            const totalPrice = itemPrice * itemQuantity;

            const invoiceDetailRef = collection(firestore, 'InvoiceDetail');
            const queryRef = query(invoiceDetailRef, where('invoiceKey', '==', invoiceKey), where('menuItemKey', '==', menuItemKey));
            const querySnapshot = await getDocs(queryRef);

            let found = false;

            querySnapshot.forEach((doc) => {
                found = true;
                const detailRef = doc.ref;
                updateDoc(detailRef, {
                    itemQuantity: itemQuantity,
                    totalPrice: totalPrice,
                });
            });

            if (!found) {
                // Thêm mới món ăn nếu không tồn tại
                await addDoc(invoiceDetailRef, {
                    invoiceKey: invoiceKey,
                    menuItemKey: menuItemKey,
                    itemQuantity: itemQuantity,
                    totalPrice: totalPrice,
                });
            }

            totalAmount += totalPrice;
        }

        const invoiceRef = doc(firestore, 'Invoice', invoiceKey);
        await updateDoc(invoiceRef, {
            totalAmount: totalAmount,
        });

        alert('Đặt món thành công.');
        document.getElementById('closeMenuButton').click();
    } catch (error) {
        console.error('Lỗi khi cập nhật hoặc thêm mới dữ liệu:', error);
    }
};

//Xem chi tiết
window.showDetail = async function (tableKey, check) {
    const modalBody = document.getElementById("tableDetailContent");
    modalBody.setAttribute("data-invoice-id", tableKey);
    modalBody.innerHTML = '';

    try {
        if (check === true) {
            document.getElementById("confirmPayment").style.display = "block";
        }
        else {
            document.getElementById("confirmPayment").style.display = "none";
        }
        // Lấy thông tin hóa đơn từ Firestore
        const invoiceRef = doc(firestore, 'Invoice', tableKey);
        const invoiceSnapshot = await getDoc(invoiceRef);

        if (invoiceSnapshot.exists()) {
            const invoiceData = invoiceSnapshot.data();

            // Lấy thông tin đặt bàn từ Firestore
            const reservationKey = invoiceData.reservationKey;
            const reservationData = await getReservationData(reservationKey);

            const timeRecived = new Date(invoiceData.timeReceived).toLocaleDateString();

            let html = ``;

            if (reservationData) {
                html += `
                    <p>Tên khách hàng: ${reservationData.customerName}</p>
                    <p>Số điện thoại: ${reservationData.phoneNumber}</p>
                    <p>Căn cước công dân: ${reservationData.idCard}</p>
                    <p>Ngày: ${timeRecived}</p>
                    <p>Trạng thái: ${invoiceData.status}
                    <input type="hidden" id="reservationID" value="${reservationKey}">`;
            }

            html += `
                <h5 class="modal-title">Thông tin hóa đơn</h5>
                <table class="table">
                    <thead class="table-light">
                        <tr>
                            <tr>
                                <th>Món ăn</th>
                                <th>Số lượng</th>
                                <th>Thành tiền</th>
                            </tr>
                        </tr>
                    </thead>
                    <tbody class="table-border-bottom-0">`;

            // Lấy danh sách các món ăn của hóa đơn từ Firestore
            const invoiceDetailRef = collection(firestore, 'InvoiceDetail');
            const queryRef = query(invoiceDetailRef, where('invoiceKey', '==', tableKey));
            const detailSnapshot = await getDocs(queryRef);

            if (!detailSnapshot.empty) {
                // Mảng chứa tất cả các promise để lấy tên món ăn
                const promises = [];

                detailSnapshot.forEach((docs) => {
                    const menuItemData = docs.data();
                    // Tạo promise để lấy tên món ăn
                    const promise = getMenuData(menuItemData.menuItemKey).then((menuData) => {
                        html += `
                            <tr>
                                <td>${menuData.foodName}</td>
                                <td>${menuItemData.itemQuantity}</td>
                                <td>${formatCurrency(menuItemData.totalPrice)}</td>
                            </tr>`;
                    }).catch((error) => {
                        console.error('Lỗi khi lấy thông tin món ăn:', error);
                    });
                    promises.push(promise);
                });

                // Chờ tất cả các promise hoàn thành
                await Promise.all(promises);
            } else {
                html += '<tr><td colspan="3">Không có món ăn nào trong hóa đơn này.</td></tr>';
            }

            html += `
                    </tbody>
                </table>
                <br>
                <h3 style="float: right">Tổng tiền: ${formatCurrency(invoiceData.totalAmount)}</h3>`;

            modalBody.innerHTML = html;
        } else {
            console.log('Hóa đơn không tồn tại.');
        }
    } catch (error) {
        console.error('Lỗi khi truy vấn thông tin hóa đơn:', error);
    }
}

//Thanh toán
window.billPayment = async function () {
    const invoiceKey = document.getElementById("tableDetailContent").getAttribute("data-invoice-id");
    if (invoiceKey) {
        try {
            // Cập nhật trạng thái của hóa đơn
            const invoiceRef = doc(firestore, 'Invoice', invoiceKey);
            await updateDoc(invoiceRef, { status: 'Đã thanh toán' });

            // Cập nhật trạng thái của đặt bàn
            const invoiceSnapshot = await getDoc(invoiceRef);
            if (invoiceSnapshot.exists()) {
                const reservationKey = invoiceSnapshot.data().reservationKey;
                const reservationRef = doc(firestore, 'Reservations', reservationKey);
                await updateDoc(reservationRef, { status: 'Đã thanh toán' });
            }

            alert("Thanh toán thành công");
            document.getElementById('closeDetailModal').click();
        } catch (error) {
            console.error("Lỗi khi thanh toán:", error);
            alert("Đã xảy ra lỗi khi thanh toán. Vui lòng thử lại sau.");
        }
    } else {
        console.error("Khóa hóa đơn không hợp lệ.");
        alert("Khóa hóa đơn không hợp lệ.");
    }
}
