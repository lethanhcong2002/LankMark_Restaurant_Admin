import { getFirestore, collection, doc, addDoc, setDoc, getDoc, onSnapshot, query, where, updateDoc, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';

const firestore = getFirestore();

function formatSalary(number) {
    return Number(number).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}


window.closeForm = function (modalId) {
    document.getElementById(modalId).style.display = "none";
}

async function getDataFromFirebase(selectedOption) {
    const tableBody = document.getElementById('listItem');
    const collectionRef = collection(firestore, 'OrderProduct');

    onSnapshot(collectionRef, async (snapshot) => {
        tableBody.innerHTML = '';

        snapshot.forEach(async (docs) => {
            const orderId = docs.id;
            const orderData = docs.data();
            const status = orderData.status;

            let shouldDisplay = false;
            if (selectedOption === 'Tất cả') {
                shouldDisplay = true;
            } else if (selectedOption === 'Chưa nhận hàng' && status !== 'Đã nhận') {
                shouldDisplay = true;
            } else if (selectedOption === 'Đã nhận hàng' && status === 'Đã nhận') {
                shouldDisplay = true;
            }

            if (shouldDisplay) {
                const orderTime = new Date(orderData.orderTime).toLocaleDateString();
                try {
                    const supplierDocRef = await getDoc(doc(firestore, 'Suppliers', orderData.supplierId));
                    if (supplierDocRef.exists()) {
                        const newRow = document.createElement('tr');
                        newRow.innerHTML = `
                            <td>${orderTime}</td>
                            <td>${supplierDocRef.data().supplierName}</td>
                            <td>${status}</td>
                            <td>                             
                                ${(status !== 'Đã nhận') ? `${getStatusButton(status, orderId)}` : ''}
                                <button onclick="showDetail('${orderId}', true)">Xem chi tiết</button>
                            </td>
                        `;
                        tableBody.appendChild(newRow);
                    }
                } catch (error) {
                    console.error('Lỗi khi lấy dữ liệu món ăn:', error);
                }
            }
        });
    });
}


function getStatusButton(status, orderId) {
    if (status === "Đã gửi") {
        return `<button onclick="receivedProduct('${orderId}')">Nhận hàng</button>`;
    } else if (status === "Chưa gửi"){
        return `<button onclick="showDetail('${orderId}', false)">Gửi yêu cầu nhập hàng</button>`;
    }
}
getDataFromFirebase('Chưa nhận hàng');

document.querySelectorAll('.dropdown-menu a.dropdown-item').forEach(item => {
    item.addEventListener('click', function () {
        const selectedOption = this.textContent.trim();
        document.getElementById('nameButton').innerHTML = selectedOption;
        getDataFromFirebase(selectedOption);
    });
});

//detail
window.showDetail = async function (key, check) {
    document.getElementById('tableDetailModal').style.display = "block";
    const supplierInfo = document.getElementById('supllierInfo');
    const productTableDetail = document.getElementById('productTableDetail');

    productTableDetail.innerHTML = '';
    supplierInfo.innerHTML = '';

    if (check === false) {
        document.getElementById('btnSubmit').style.display = "block";
    }
    else {
        document.getElementById('btnSubmit').style.display = "none";
    }

    const docRef = await getDoc(doc(firestore, 'OrderProduct', key));
    if (docRef.exists()) {

        const orderData = docRef.data();
        const supplierId = orderData.supplierId;
        const supplierData = await getDoc(doc(firestore, 'Suppliers', supplierId));
        const querySnapshot = await getDocs(query(collection(firestore, 'OrderProductDetail'), where('orderProductId', '==', docRef.id)));

        supplierInfo.setAttribute('data-supplier-name', supplierData.data().supplierName);
        supplierInfo.setAttribute('data-supplier-email', supplierData.data().supplierEmail);
        supplierInfo.setAttribute('data-order-id', key);

        const newData = `
                <p>Nhà cung cấp: ${supplierData.data().supplierName}</p>
                <p id="supplierEmail">Email: ${supplierData.data().supplierEmail}</p>
                <p>Số điện thoại: ${supplierData.data().supplierPhone}</p>
                <p>Ngày lập: ${new Date(orderData.orderTime).toLocaleDateString()}</p>
                <p>Trạng thái: ${orderData.status}</p>
            `;

        supplierInfo.innerHTML = newData;

        querySnapshot.forEach(async docs => {
            const orderProductData = docs.data();

            const productData = await getDoc(doc(firestore, 'Products', orderProductData.productId));

            const productName = productData.data().productName;

            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${productName}</td>
                <td>${orderProductData.quantity}</td>
                <td>${orderProductData.price}</td>
                ${(orderData.status === 'Đã nhận') ?
                    `<td>${orderProductData.realityQuantity}</td>
                     <td>${orderProductData.realityPrice}</td>` :
                    ``} <!-- Nếu chưa nhận, không hiển thị cột "Thực tế" -->
            `;
            productTableDetail.appendChild(newRow);
        });

        // Nếu trạng thái là "Đã nhận", hiển thị cột "Thực tế"
        if (orderData.status === 'Đã nhận') {
            document.getElementById('reality').style.display = "table-row";
            document.getElementById('realityQuantity').style.display = "table-cell";
            document.getElementById('realityPrice').style.display = "table-cell";
        } else { // Ngược lại, ẩn đi cột "Thực tế"
            document.getElementById('reality').style.display = "none";
            document.getElementById('realityQuantity').style.display = "none";
            document.getElementById('realityPrice').style.display = "none";
        }

        document.getElementById('totalAmount').textContent = 'Tổng tiền: ' + orderData.totalPrice;
    }
}

window.addNew =  async function () {
    try {
        document.getElementById('inputForm').style.display = "block";
        const suppliersRef = collection(firestore, 'Suppliers');

        const snapshot = await getDocs(suppliersRef);

        const selectElement = document.getElementById('supplier');

        selectElement.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Chọn nhà cung cấp';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        selectElement.appendChild(defaultOption);

        snapshot.forEach((doc) => {
            const supplierData = doc.data();
            const supplierName = supplierData.supplierName;
            const supplierId = doc.id;

            const option = document.createElement('option');
            option.value = supplierId;
            option.textContent = supplierName;

            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching suppliers:', error);
    }
}

let itemCounter = 0;
async function fetchProductsAndUpdateTable() {
    try {
        const selectedSupplierId = document.getElementById('supplier').value;

        const supplierProductsCollectionRef = collection(firestore, 'SupplierProducts');

        const queryRef = query(supplierProductsCollectionRef, where('supplierId', '==', selectedSupplierId));

        onSnapshot(queryRef, async (snapshot) => {
            const tableBody = document.getElementById('productTable').getElementsByTagName('tbody')[0];

            tableBody.innerHTML = '';

            snapshot.forEach(async (docs) => {
                const supplierData = docs.data();
                const productId = supplierData.productId;
                const productPrice = supplierData.price;

                itemCounter++;
                const itemId = `item${itemCounter}`;
                const productRef = doc(firestore, 'Products', productId);

                const productSnapshot = await getDoc(productRef);

                if (productSnapshot.exists()) {
                    const productData = productSnapshot.data();

                    const rowHTML = `
                            <tr>
                                <td>${productData.productName}</td>
                                <td><input type="number" placeholder="Số lượng" min="0" id="${itemId}"></td>
                                <td>${productPrice}</td>
                                <td><button class="confirm-button" onclick="addToOrder( '${productId}', '${productData.productName}', ${productPrice}, document.getElementById('${itemId}').value)">Thêm vào</button></td>
                            </tr>
                        `;

                    tableBody.insertAdjacentHTML('beforeend', rowHTML);
                }
            });
        });
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

document.getElementById('supplier').addEventListener('change', fetchProductsAndUpdateTable);

fetchProductsAndUpdateTable();

window.addToOrder = function (productId, productName, productPrice, itemQuantity) {
    event.preventDefault();
    const listMenu = document.getElementById('selectedProducts');
    const listItems = listMenu.querySelectorAll('li');
    let existingItem = null;

    listItems.forEach(item => {
        if (item.getAttribute('data-product-key') === productId) {
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
        listItem.setAttribute('data-product-key', productId);
        listItem.setAttribute('data-item-price', productPrice);
        listItem.innerHTML = `${productName}: <span class="quantity">${itemQuantity}</span>`;
        listMenu.appendChild(listItem);
    }
};

window.confirmAdd = function () {
    event.preventDefault();
    const currentDate = new Date();
    const orderDate = currentDate.toISOString();

    const listItems = document.getElementById('selectedProducts').querySelectorAll('li');
    let totalPrice = 0;

    listItems.forEach(item => {
        const itemQuantity = parseInt(item.getAttribute('data-item-quantity'));
        const itemPrice = parseInt(item.getAttribute('data-item-price'));
        totalPrice += itemQuantity * itemPrice;
    });

    const selectedSupplierId = document.getElementById('supplier').value;

    const orderRef = collection(firestore, 'OrderProduct');
    const newOrderRef = doc(orderRef);
    setDoc(newOrderRef, {
        orderTime: orderDate,
        totalPrice: totalPrice,
        supplierId: selectedSupplierId,
        status: 'Chưa gửi'
    }).then(() => {
        const orderId = newOrderRef.id;
        listItems.forEach(item => {
            const menuItemKey = item.getAttribute('data-product-key');
            const itemQuantity = parseInt(item.getAttribute('data-item-quantity'));
            const itemPrice = parseInt(item.getAttribute('data-item-price'));

            const orderDetailRef = collection(firestore, 'OrderProductDetail');
            addDoc(orderDetailRef, {
                orderProductId: orderId,
                productId: menuItemKey,
                quantity: itemQuantity,
                price: itemPrice * itemQuantity
            }).then(() => {
                console.log('Dữ liệu đã được lưu thành công vào cả 2 bảng.');
            }).catch(error => {
                console.error('Lỗi khi lưu dữ liệu vào bảng ChiTietDonDatHang:', error);
            });
        });
    }).catch(error => {
        console.error('Lỗi khi lưu dữ liệu vào bảng DonDatHang:', error);
    });
}

window.acceptSendMail = async function () {
    const supplierInfo = document.getElementById('supllierInfo');
    const supplierName = supplierInfo.getAttribute('data-supplier-name');
    const supplierEmail = supplierInfo.getAttribute('data-supplier-email');
    const orderId = supplierInfo.getAttribute('data-order-id');
    const subject = "Yêu cầu đặt hàng từ Lankmark Restaurant";

    let productsList = "<ul>";
    const productTable = document.getElementById('productTableDetail');
    const rows = productTable.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        const productName = cells[0].innerText;
        const productQuantity = cells[1].innerText;
        productsList += `<li>${productName}: ${productQuantity}</li>`;
    }
    productsList += "</ul>";

    const bodyContent = `
        <p>Xin chào ${supplierName},</p>
        <p>Lankmark Restaurant đang muốn đặt hàng từ bạn. Dưới đây là danh sách các mặt hàng chúng tôi muốn đặt hàng:</p>
        ${productsList}
        <p>Xin vui lòng liên hệ với chúng tôi để xác nhận đơn đặt hàng và thời gian giao hàng.</p>
        <p>Xin cảm ơn.</p>
        <p>Lankmark Restaurant</p>
    `;
    Email.send({
        Host: "smtp.elasticemail.com",
        Username: "lankmarkrestaurant@gmail.com",
        Password: "6302100AD1A0ABBDAB915DE1EDACB6CE3759",
        To: supplierEmail,
        From: "lankmarkrestaurant@gmail.com",
        Subject: subject,
        Body: bodyContent
    }).then(
        async function (message) {
            const orderProductRef = doc(firestore, 'OrderProduct', orderId);
            await updateDoc(orderProductRef, {
                status: 'Đã gửi'
            });
            alert("Yêu cầu đặt hàng đã được gửi đi!");
            closeForm('tableDetailModal');
        },
        function (error) {
            console.error("Lỗi khi gửi email:", error);
        }
    );
}

window.receivedProduct = async function (key) {
    document.getElementById('receivedProduct').style.display = 'block';
    document.getElementById('orderKey').value = key;
    const tableBody = document.querySelector('#receivedOrderTable tbody');
    const supplierInfo = document.getElementById('detailOrder');
    const divTotalPrice = document.getElementById('totalAmountProduct');
    divTotalPrice.innerHTML = '';

    supplierInfo.innerHTML = '';
    tableBody.innerHTML = '';

    const docRef = await getDoc(doc(firestore, 'OrderProduct', key));
    if (docRef.exists()) {

        const orderData = docRef.data();
        const supplierId = orderData.supplierId;
        const supplierData = await getDoc(doc(firestore, 'Suppliers', supplierId));
        const querySnapshot = await getDocs(query(collection(firestore, 'OrderProductDetail'), where('orderProductId', '==', docRef.id)));

        const newData = `
                <p>Nhà cung cấp: ${supplierData.data().supplierName}</p>
                <p id="supplierEmail">Email: ${supplierData.data().supplierEmail}</p>
                <p>Số điện thoại: ${supplierData.data().supplierPhone}</p>
                <p>Ngày lập: ${new Date(orderData.orderTime).toLocaleDateString()}</p>
                <p>Ngày nhận hàng: ${new Date().toLocaleDateString()}</p>
                <p>Trạng thái: ${orderData.status}</p>
            `;
        supplierInfo.innerHTML = newData;

        querySnapshot.forEach(async docs => {
            const orderProductData = docs.data();

            const productData = await getDoc(doc(firestore, 'Products', orderProductData.productId));

            const productName = productData.data().productName;

            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${productName}</td>
                <td>${orderProductData.quantity}</td>
                <td>${formatSalary(orderProductData.price)}</td>
                <td><input type="number" id="realityQuantity" required></td>
                <td><input type="number" id="realityPrice" required></td>
            `;
            newRow.dataset.productId = orderProductData.productId;
            tableBody.appendChild(newRow);

        });
        
        divTotalPrice.innerHTML = `
                <h3>Tổng tiền</h3>
                <p>Dự kiến: ${formatSalary(orderData.totalPrice)}</p>
                <p>Thực tế: <input type="number" id="inputTotalAmountProduct" required></p>
            `;
    }
}

window.acceptReceivedProduct = async function () {
    const totalAmountProduct = parseFloat(document.getElementById('inputTotalAmountProduct').value);
    const realityQuantityInputs = document.querySelectorAll('#receivedOrderTable tbody input[id=realityQuantity]');
    const realityPriceInputs = document.querySelectorAll('#receivedOrderTable tbody input[id=realityPrice]');

    // Tạo một mảng chứa dữ liệu về số lượng thực tế và giá thực tế của từng sản phẩm
    const productUpdates = [];
    realityQuantityInputs.forEach((quantityInput, index) => {
        const productId = quantityInput.closest('tr').dataset.productId;
        const realityQuantity = parseInt(quantityInput.value);
        const realityPrice = parseFloat(realityPriceInputs[index].value);
        productUpdates.push({ productId, realityQuantity, realityPrice });
    });

    // Cập nhật dữ liệu trong Firestore cho đơn hàng chính
    const orderId = document.getElementById('orderKey').value;
    const orderRef = doc(firestore, 'OrderProduct', orderId);
    await updateDoc(orderRef, {
        totalAmountReceived: totalAmountProduct,
        status: 'Đã nhận',
        timeReceived: new Date().toISOString()
    });

    // Lặp qua từng sản phẩm và cập nhật dữ liệu trong Product và OrderProductDetail
    for (const update of productUpdates) {
        const { productId, realityQuantity, realityPrice } = update;

        // Cập nhật dữ liệu trong OrderProductDetail
        const orderProductDetailQuery = query(collection(firestore, 'OrderProductDetail'),
            where('orderProductId', '==', orderId),
            where('productId', '==', productId));
        const orderProductDetailSnapshot = await getDocs(orderProductDetailQuery);
        if (!orderProductDetailSnapshot.empty) {
            const orderProductDetailDoc = orderProductDetailSnapshot.docs[0];
            await updateDoc(orderProductDetailDoc.ref, {
                realityQuantity: realityQuantity,
                realityPrice: realityPrice
            });
        } else {
            console.error('Không tìm thấy dữ liệu OrderProductDetail cho sản phẩm có id: ', productId);
        }

        // Cập nhật dữ liệu trong Product
        const productRef = doc(firestore, 'Products', productId);
        const productSnapshot = await getDoc(productRef);
        const currentQuantityReceived = productSnapshot.data().quantityInStock || 0;
        const newQuantityReceived = currentQuantityReceived + realityQuantity;
        await updateDoc(productRef, {
            quantityInStock: newQuantityReceived
        });
    }

    alert('Dữ liệu đã được cập nhật thành công.');
}
