import { getFirestore, collection, doc, addDoc, setDoc, getDoc, onSnapshot, query, where, updateDoc, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';

const firestore = getFirestore();

function formatCurrency(number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
}


window.closeForm = function (idForm) {
    document.getElementById(idForm).style.display = "none";
}
function getDataFromFirestore() {
    const tableBody = document.getElementById("listSupplier");
    const q = collection(firestore, 'Suppliers');

    onSnapshot(q, (snapshot) => {
        tableBody.innerHTML = '';
        snapshot.docChanges().forEach((change) => {
            const docs = change.doc;
            const key = docs.id;
            const data = docs.data();
            const itemName = data.supplierName;
            const itemAddress = data.supplierAddress;
            const itemPhone = data.supplierPhone;

            if (data.status !== "deleted") {
                const tableRow = document.createElement('tr');
                tableRow.innerHTML = `
                <td>${itemName}</td>
                <td>${itemPhone}</td>
                <td>${itemAddress}</td>
                <td>
                    <button onclick="viewDetails('${key}')">Xem chi tiết</button>
                    <button onclick="deleteItem('${key}')">Xóa</button>
                    <button onclick="editItem('${key}')">Sửa</button>
                    <button onclick="addSupplierProducts('${key}', '${itemName}')">Thêm sản phẩm</button>
                </td>   
            `;
                tableBody.appendChild(tableRow);
            }
        });
    });
}

getDataFromFirestore();

window.addSupplier = function () {
    document.getElementById("inputForm").style.display = "block";
}

window.confirmAdd = async function () {
    event.preventDefault();
    const supplierName = document.getElementById('inputSupplierName').value;
    const supplierAddress = document.getElementById('inputAddress').value;
    const supplierPhone = parseFloat(document.getElementById('inputPhoneNumber').value);
    const supplierEmail = document.getElementById('inputEmail').value;
    const description = document.getElementById('inputDescription').value;

    if (!supplierName || !supplierAddress || !supplierPhone || !supplierEmail) {
        alert("Xin vui lòng điền đầy đủ thông tin!");
        return;
    }

    try {
        const collectionRef = collection(firestore, 'Suppliers');
        await addDoc(collectionRef, {
            supplierName: supplierName,
            supplierAddress: supplierAddress,
            supplierPhone: supplierPhone,
            supplierEmail: supplierEmail,
            description: description,
        });

        alert("Thêm thành công.");
    } catch (error) {
        console.error("Error adding supplier: ", error);
    }
}

window.editItem = async function (key) {
    document.getElementById('updateForm').style.display = "block";
    try {
        const docRef = doc(firestore, 'Suppliers', key);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('inputKey').value = key;
            document.getElementById('updateSupplierName').value = data.supplierName;
            document.getElementById('updateAddress').value = data.supplierAddress;
            document.getElementById('updatePhoneNumber').value = data.supplierPhone;
            document.getElementById('updateEmail').value = data.supplierEmail;
            document.getElementById('updateDescription').value = data.description;
        } else {
            console.log("No such document!");
        }
    } catch (error) {
        console.error("Error getting supplier data: ", error);
    }
}

window.confirmUpdate = async function () {
    event.preventDefault();
    const supplierId = document.getElementById('inputKey').value;
    const supplierName = document.getElementById('updateSupplierName').value;
    const supplierAddress = document.getElementById('updateAddress').value;
    const supplierPhone = parseFloat(document.getElementById('updatePhoneNumber').value);
    const supplierEmail = document.getElementById('updateEmail').value;
    const description = document.getElementById('updateDescription').value;

    if (!supplierName || !supplierAddress || !supplierPhone || !supplierEmail) {
        alert("Xin vui lòng điền đầy đủ thông tin!");
        return;
    }

    try {
        const docRef = doc(firestore, 'Suppliers', supplierId);
        await updateDoc(docRef, {
            supplierName: supplierName,
            supplierAddress: supplierAddress,
            supplierPhone: supplierPhone,
            supplierEmail: supplierEmail,
            description: description,
        });
        alert("Cập nhật thành công.");
        closeForm('updateForm');
    } catch (error) {
        console.error("Error updating supplier: ", error);
    }
}

window.deleteItem = async function (key) {
    const docRef = doc(firestore, 'Suppliers', key);
    try {
        await updateDoc(docRef, {
            status: 'deleted'
        })
        alert("Huy thanh cong");
    } catch (error) {
        console.error("Error getting document:", error);
    }
}

// Function to open the modal and populate it with supplier products
window.addSupplierProducts = function (supplierKey, supplierName) {
    document.getElementById('inputSupplierKey').value = supplierKey;

    document.getElementById('supplierName').innerText = "Danh sách sản phẩm của " + supplierName;

    document.getElementById('listSupplierProducts').innerHTML = '';

    document.getElementById('addSupplierProducts').style.display = "block";

    fetchSupplierProducts(supplierKey);
}

// Function to fetch and display supplier products
let itemIdCounter = 0;
async function fetchSupplierProducts(key) {
    try {
        document.getElementById('menuItems').innerHTML = '';

        const productsRef = collection(firestore, 'Products');

        const snapshot = await getDocs(productsRef);

        snapshot.forEach((doc) => {
            itemIdCounter++;
            const data = doc.data();
            const productId = doc.id;
            const productName = data.productName;
            const itemId = `item${itemIdCounter}`;

            const tableRow = document.createElement('tr');
            tableRow.innerHTML = `
                <td hidden>${productId}</td>
                <td>${productName}</td>
                <td><input type="number" id="${itemId}" required></td>
                <td><button onclick="addProductToSupplier('${productId}', '${productName}', document.getElementById('${itemId}').value)">Thêm</button></td>
            `;
            document.getElementById('menuItems').appendChild(tableRow);
        });
        const listMenu = document.getElementById("listSupplierProducts");
        listMenu.innerHTML = "";
        getIProductOfSupplier(key);
    } catch (error) {
        console.error("Error fetching supplier products: ", error);
    }
}

async function getIProductOfSupplier(key) {
    const queryRef = query(collection(firestore, 'SupplierProducts'), where('supplierId', '==', key));

    try {
        const snapshot = await getDocs(queryRef);
        if (!snapshot.empty) {
            snapshot.forEach(async (docs) => {
                const dataItem = docs.data();
                const productID = dataItem.productId;
                const itemPrice = dataItem.price;

                try {
                    const productDoc = await getDoc(doc(firestore, 'Products', productID));
                    if (productDoc.exists()) {
                        const productData = productDoc.data();
                        addProductToSupplier( productID ,productData.productName, itemPrice);
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

window.addProductToSupplier = function (productId, productName, price) {
    if (price === null || price === '') {

        return;
    }

    const list = document.getElementById('listSupplierProducts');
    const listItems = list.querySelectorAll('li');
    let existingItem = null;
    listItems.forEach(item => {
        if (item.getAttribute('data-item-key') === productId) {
            existingItem = item;
        }
    });

    if (existingItem) {
        const priceElement = existingItem.querySelector('.price');
        priceElement.textContent = `${price}`;
        existingItem.setAttribute('data-item-price', price);
    } else {
        const listItem = document.createElement('li');
        listItem.setAttribute('data-item-key', productId);
        listItem.setAttribute('data-item-price', price);
        listItem.innerHTML = `${productName}: <span class="price">${price}</span>`;
        list.appendChild(listItem);
    }
}

window.confirmSupplierProducts = async function () {
    try {
        const supplierKey = document.getElementById('inputSupplierKey').value;

        const listItems = document.getElementById('listSupplierProducts').getElementsByTagName('li');

        for (const listItem of listItems) {
            const productKey = listItem.getAttribute('data-item-key');
            const price = parseFloat(listItem.getAttribute('data-item-price'));

            const productRef = doc(firestore, 'SupplierProducts', productKey);
            const productSnapshot = await getDoc(productRef);

            if (productSnapshot.exists()) {
                await updateDoc(productRef, {
                    price: price,
                    timestamp: new Date().toISOString(),
                });
            } else {
                await setDoc(productRef, {
                    productId: productKey,
                    price: price,
                    supplierId: supplierKey,
                    timestamp: new Date().toISOString(),
                });
            }
        }

        alert('Dữ liệu sản phẩm của nhà cung cấp đã được cập nhật hoặc thêm mới vào Firestore.');

        closeForm('addSupplierProducts');
    } catch (error) {
        console.error('Lỗi khi lưu dữ liệu sản phẩm của nhà cung cấp:', error);
    }
};

window.closeForm = function (modalId) {
    document.getElementById(modalId).style.display = "none";
}
//Detail
async function fetchSupplierDetail(supplierKey) {
    try {
        const supplierRef = doc(firestore, 'Suppliers', supplierKey);
        const supplierSnapshot = await getDoc(supplierRef);

        if (supplierSnapshot.exists()) {
            const supplierData = supplierSnapshot.data();
            const supplierName = supplierData.supplierName;
            const supplierAddress = supplierData.supplierAddress;
            const supplierPhone = supplierData.supplierPhone;
            const supplierEmail = supplierData.supplierEmail;

            const supplierProductsRef = collection(firestore, 'SupplierProducts');
            const querySnapshot = await getDocs(query(supplierProductsRef, where('supplierId', '==', supplierKey)));

            const products = [];

            for (const docs of querySnapshot.docs) {
                const productData = docs.data();
                const productId = productData.productId;
                const productRef = doc(firestore, 'Products', productId);
                const productSnapshot = await getDoc(productRef);

                if (productSnapshot.exists()) {
                    const productInfo = productSnapshot.data();
                    const productName = productInfo.productName;
                    const productPrice = productData.price;

                    products.push({ productName, productPrice });
                }
            }

            return { supplierName, supplierAddress, supplierPhone, supplierEmail, products };
        } else {
            console.error('Supplier not found');
            return null;
        }
    } catch (error) {
        console.error('Error fetching supplier detail:', error);
        return null;
    }
}

window.viewDetails = async function (key) {
    try {
        const modal = document.getElementById('tableDetailModal');
        modal.style.display = 'block';

        const tableDetailContent = document.getElementById('tableDetailContent');
        tableDetailContent.innerHTML = '';

        const supplierDetail = await fetchSupplierDetail(key);

        if (supplierDetail) {
            const { supplierName, supplierAddress, supplierPhone, supplierEmail, products } = supplierDetail;

            const supplierInfo = document.createElement('div');
            supplierInfo.innerHTML = `
                <h2>${supplierName}</h2>
                <p>Address: ${supplierAddress}</p>
                <p>Phone: ${supplierPhone}</p>
                <p>Email: ${supplierEmail}</p>
                <h3>Products:</h3>
            `;
            tableDetailContent.appendChild(supplierInfo);

            const productList = document.createElement('ul');
            products.forEach(product => {
                const listItem = document.createElement('li');
                const price = formatCurrency(product.productPrice);
                listItem.textContent = `${product.productName}: ${price}`;
                productList.appendChild(listItem);
            });
            tableDetailContent.appendChild(productList);
        } else {
            tableDetailContent.textContent = 'Supplier not found or error fetching supplier detail.';
        }
    } catch (error) {
        console.error('Error opening table detail modal:', error);
    }
}