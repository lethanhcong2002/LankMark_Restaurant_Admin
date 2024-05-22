import { getFirestore, doc, getDoc, setDoc, collection, addDoc, updateDoc, query, where, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

const firestore = getFirestore();

window.addStorage = function () {
    // Hiển thị input để chọn file
    document.getElementById("excelInput").style.display = "block";
}

window.handleFileInput = function () {
    const fileInput = document.getElementById("excelInput");
    const file = fileInput.files[0];

    if (!file) {
        console.error("No file selected.");
        return;
    }

    document.getElementById("addNewDataFromExcel").style.display = "block";
    const reader = new FileReader();

    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        displayData(jsonData);
    };

    reader.readAsArrayBuffer(file);
}

function displayData(data) {
    const tableBody = document.getElementById('dataBody');

    tableBody.innerHTML = '';

    let rowIndex = 0;

    data.forEach((row) => {
        if (rowIndex < 3) {
            rowIndex++;
            return;
        }

        const tr = document.createElement('tr');

        row.forEach((cell, cellIndex) => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });

        tableBody.appendChild(tr);
    });
}

window.acceptAdd = async function () {
    const tableRows = document.querySelectorAll("#dataBody tr");
    const productsCollection = collection(firestore, "Products");

    tableRows.forEach(async row => {
        const cells = row.querySelectorAll("td");
        const productName = cells[0].textContent;

        // Tạo truy vấn để kiểm tra xem sản phẩm đã tồn tại hay chưa
        const querySnapshot = await getDocs(query(productsCollection, where("productName", "==", productName)));

        if (!querySnapshot.empty) {
            console.log(`Sản phẩm "${productName}" đã tồn tại trong cơ sở dữ liệu.`);
        } else {
            // Chuyển đổi ngày tháng sang đối tượng Date
            const manufacturingDate = cells[2].textContent;
            const expiryDate = cells[3].textContent;

            const [dayManufacturing, monthManufacturing, yearManufacturing] = manufacturingDate.split('/');
            const [dayExpiry, monthExpiry, yearExpiry] = expiryDate.split('/');

            // Tạo đối tượng Date từ các thành phần ngày, tháng và năm
            const manufacturingDateObj = new Date(yearManufacturing, monthManufacturing - 1, dayManufacturing);
            const expiryDateObj = new Date(yearExpiry, monthExpiry - 1, dayExpiry);

            // Nếu sản phẩm chưa tồn tại, thêm sản phẩm mới vào cơ sở dữ liệu Firestore
            const productData = {
                productName: productName,
                productType: cells[1].textContent,
                manufacturingDate: manufacturingDateObj.toISOString(),
                expiryDate: expiryDateObj.toISOString(),
                unit: cells[4].textContent,
                minQuantity: parseFloat(cells[5].textContent),
                quantityInStock: cells[6].textContent,
                description: cells[7].textContent
            };

            try {
                await addDoc(productsCollection, productData);
                console.log("Dữ liệu sản phẩm đã được lưu vào Firestore.");
            } catch (error) {
                console.error("Lỗi khi lưu dữ liệu sản phẩm vào Firestore:", error);
            }
        }
    });

    closeForm('addNewDataFromExcel');
};


function loadDataFromFirestore() {
    const combinedTableBody = document.getElementById('listStorage');
    const productsCollection = collection(firestore, 'Products');

    onSnapshot(productsCollection, (querySnapshot) => {
        combinedTableBody.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const itemData = doc.data();
            const itemName = itemData.productName;
            const role = itemData.productType;
            const quantity = itemData.quantityInStock;
            const minQuantity = parseFloat(itemData.minQuantity);
            const status = itemData.status;

            if (status !== "deleted") {
                const tableRow = document.createElement('tr');
                tableRow.innerHTML = `
                    <td>${itemName}</td>
                    <td>${role}</td>
                    <td>${quantity}</td>
                    <td>${minQuantity}</td>
                    <td>
                        <button onclick="viewDetails('${doc.id}')">Xem chi tiết</button>
                        <button onclick="deleteItem('${doc.id}')">Xóa</button>
                        <button onclick="editItem('${doc.id}')">Sửa</button>
                    </td>   
                `;

                if (quantity < minQuantity) {
                    tableRow.classList.add('need-replenish');
                }

                combinedTableBody.appendChild(tableRow);
            }
        });
    }, (error) => {
        console.error("Error loading data from Firestore:", error);
    });
}

loadDataFromFirestore();

//Detail
window.viewDetails = function (key) {
    const documentRef = doc(firestore, `Products/${key}`); // Truy cập tài liệu qua đường dẫn
    document.getElementById("tableDetailModal").style.display = "block";
    getDoc(documentRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
            const tableData = docSnapshot.data();
            const itemName = tableData.productName;
            const itemType = tableData.productType;
            const itemUnit = tableData.unit;
            const itemDescription = tableData.description;
            const minQuantity = tableData.minQuantity;
            const itemQuantity = tableData.quantityInStock;
            const expiryDate = new Date(tableData.expiryDate).toLocaleDateString();
            const manufacturingDate = new Date(tableData.manufacturingDate).toLocaleDateString();
            const tableDetailContent = document.getElementById("tableDetailContent");

            tableDetailContent.innerHTML = '';

            let tableDetailHTML = `
                <h2>Thông tin chi tiết vật tư</h2>
                <p>Tên: ${itemName}</p>
                <p>Loại: ${itemType}</p>
                <p>Đơn vị tính: ${itemUnit}</p>
                <p>Tối thiểu: ${minQuantity}</p>
                <p>Tồn kho: ${itemQuantity}</p>               
                <h4>Mô tả:</h4>
                <p>${itemDescription}</p>
            `;
            tableDetailContent.innerHTML = tableDetailHTML;
            tableDetailContent.style.display = "block";
        } else {
            console.error("No such document!");
        }
    }).catch((error) => {
        console.error("Error getting document:", error);
    });
    //<p>Ngày sản xuất: ${manufacturingDate}</p>
    //<p>Ngày hết hạn: ${expiryDate}</p>
}

window.closeForm = function (formId) {
    if (formId === "addNewDataFromExcel") {
        document.getElementById("excelInput").value = "";
        document.getElementById("excelInput").style.display = "none";
    }
    document.getElementById(formId).style.display = "none";
}

window.editItem = function (key) {
    const documentRef = doc(firestore, 'Products', key);

    getDoc(documentRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
            const itemData = docSnapshot.data();
            document.getElementById('inputKey').value = key;
            document.getElementById('productName').value = itemData.productName;
            document.getElementById('productType').value = itemData.productType;
            document.getElementById('minQuantity').value = itemData.minQuantity;
            document.getElementById('quantityInStock').value = itemData.quantityInStock;
            document.getElementById('unit').value = itemData.unit;
            document.getElementById('description').value = itemData.description;

            // Chuyển đổi định dạng ngày tháng từ chuỗi ISO sang ngày và giờ địa phương
            const manufacturingDateISO = new Date(itemData.manufacturingDate);
            const manufacturingDateString = `${manufacturingDateISO.getFullYear()}-${('0' + (manufacturingDateISO.getMonth() + 1)).slice(-2)}-${('0' + manufacturingDateISO.getDate()).slice(-2)}T${('0' + manufacturingDateISO.getHours()).slice(-2)}:${('0' + manufacturingDateISO.getMinutes()).slice(-2)}`;
            document.getElementById('manufacturingDate').value = manufacturingDateString;

            const expiryDateISO = new Date(itemData.expiryDate);
            const expiryDateString = `${expiryDateISO.getFullYear()}-${('0' + (expiryDateISO.getMonth() + 1)).slice(-2)}-${('0' + expiryDateISO.getDate()).slice(-2)}T${('0' + expiryDateISO.getHours()).slice(-2)}:${('0' + expiryDateISO.getMinutes()).slice(-2)}`;
            document.getElementById('expiryDate').value = expiryDateString;

            document.getElementById("updateDetail").style.display = "block";
        } else {
            console.error("Document does not exist!");
        }
    }).catch((error) => {
        console.error("Error getting document:", error);
    });
}

window.confirmUpdate = function () {
    const key = document.getElementById('inputKey').value;
    const productName = document.getElementById('productName').value;
    const productType = document.getElementById('productType').value;
    const minQuantity = parseFloat(document.getElementById('minQuantity').value);
    const quantityInStock = document.getElementById('quantityInStock').value;
    const unit = document.getElementById('unit').value;
    const description = document.getElementById('description').value;

    // Lấy thời gian từ input datetime-local
    const manufacturingDateInput = document.getElementById('manufacturingDate').value;
    const expiryDateInput = document.getElementById('expiryDate').value;

    // Chuyển đổi thành đối tượng Date
    const manufacturingDate = new Date(manufacturingDateInput);
    const expiryDate = new Date(expiryDateInput);

    // Kiểm tra nếu thời gian hết hạn lớn hơn hoặc bằng thời gian sản xuất
    if (expiryDate >= manufacturingDate) {
        // Chuyển đổi sang chuỗi UTC
        const manufacturingDateUTC = manufacturingDate.toISOString();
        const expiryDateUTC = expiryDate.toISOString();

        // Thực hiện cập nhật dữ liệu
        const documentRef = doc(firestore, 'Products', key);
        setDoc(documentRef, {
            productName: productName,
            productType: productType,
            minQuantity: minQuantity,
            quantityInStock: quantityInStock,
            unit: unit,
            description: description,
            manufacturingDate: manufacturingDateUTC,
            expiryDate: expiryDateUTC
        }).then(() => {
            console.log("Dữ liệu sản phẩm đã được cập nhật thành công.");
            document.getElementById("updateDetail").style.display = "none";
        }).catch((error) => {
            console.error("Lỗi khi cập nhật dữ liệu sản phẩm:", error);
        });
    } else {
        console.error("Lỗi: Thời gian hết hạn phải lớn hơn hoặc bằng thời gian sản xuất.");
    }
}

window.deleteItem = function (key) {
    const confirmDelete = confirm("Bạn có chắc chắn muốn xóa mục này?");

    if (confirmDelete) {
        const documentRef = doc(firestore, 'Products', key);

        updateDoc(documentRef, { status: "deleted" })
            .then(() => {
                alert("Status updated successfully");
            })
            .catch((error) => {
                alert("Error updating status:" + error);
            });
    } else {
        alert("Hủy bỏ xóa");
    }
};

//CheckItem
window.checkItem = async function () {
    try {
        // Hiển thị form kiểm tra
        document.getElementById("checkItem").style.display = "block";

        // Lấy thông tin người dùng từ sessionStorage
        const userDataJSON = sessionStorage.getItem('userData');
        const userData = JSON.parse(userDataJSON);
        const userKey = userData.userID;

        // Hiển thị thông tin người dùng trên form
        document.getElementById("userKey").value = userKey;
        document.querySelector('.checkItem-user p:nth-of-type(1) span').textContent = userData.fullName;
        const currentDateTime = new Date().toLocaleDateString();
        document.querySelector('.checkItem-user p:nth-of-type(2)').textContent = `Ngày: ${currentDateTime}`;
        document.querySelector('.checkItem-user').hidden = false;

        // Lấy tham chiếu đến bảng dữ liệu
        const productsCollection = collection(firestore, 'Products');

        // Lấy danh sách sản phẩm từ Firestore và hiển thị trên form
        const querySnapshot = await getDocs(productsCollection);
        const combinedTableBody = document.getElementById("checkItemBody");
        combinedTableBody.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const key = doc.id;
            const itemData = doc.data();
            const itemName = itemData.productName;
            const quantity = itemData.quantityInStock;
            const status = itemData.status;

            // Kiểm tra xem status có tồn tại và khác "deleted" không
            if (!status || status !== "deleted") {
                // Tạo hàng dữ liệu cho sản phẩm
                const tableRow = document.createElement('tr');
                tableRow.innerHTML = `
                    <td>${key}</td>
                    <td>${itemName}</td>
                    <td><input type="number" class="quantity-input" value="${quantity}" min="0"></td>
                    <td><input type="number" class="quantity-input" min="0" value="0"></td>
                    <td style="display: none;"><input type="number" class="quantity-input" min="0" value="${quantity}" hidden></td>
                `;
                combinedTableBody.appendChild(tableRow);
            }
        });
    } catch (error) {
        console.error("Error getting documents:", error);
    }
}

window.acceptCheckItem = function () {
    const tableRows = document.querySelectorAll("#checkItemBody tr");
    const currentDate = new Date().toISOString();
    const date = new Date(currentDate).toLocaleDateString();
    const userID = document.getElementById("userKey").value;

    const reportData = {
        employeeId: userID,
        reportTime: currentDate,
        reportContent: `Báo cáo kiểm tra kho hàng ngày ${date} thực hiện bởi nhân viên ${document.getElementById("userName").textContent}.`,
    };

    const invetoragecheckCollectionRef = collection(firestore, 'ProductCheck');
    addDoc(invetoragecheckCollectionRef, reportData)
        .then((docRef) => {
            console.log("Report added successfully to InventorageCheck");

            const invetoragecheckKey = docRef.id;

            tableRows.forEach(row => {
                const key = row.cells[0].textContent;
                const quantity = parseInt(row.cells[2].querySelector("input").value);
                const damagedQuantity = parseInt(row.cells[3].querySelector("input").value);
                const originalQuantity = parseInt(row.cells[4].querySelector("input").value);

                const detailData = {
                    itemId: key,
                    quantityInStock: quantity,
                    damagedQuantity: damagedQuantity,
                    originalQuantity: originalQuantity,
                    invetoragecheckKey: invetoragecheckKey
                };

                const detailCollectionRef = collection(firestore, 'ProductCheckDetail');
                addDoc(detailCollectionRef, detailData)
                    .then(() => {
                        console.log("Detail data added successfully to detailcheckItem for item:", key);
                    })
                    .catch((error) => {
                        console.error("Error adding detail data to detailcheckItem for item:", key, error);
                    });

                const itemRef = doc(firestore, 'Products', key);
                updateDoc(itemRef, {
                    quantityInStock: quantity,
                })
                    .then(() => {
                        console.log("Data updated successfully for item:", key);
                    })
                    .catch((error) => {
                        console.error("Error updating data for item:", key, error);
                    });
            });

            document.getElementById("checkItem").style.display = "none";
        })
        .catch((error) => {
            console.error("Error adding report to InventorageCheck:", error);
        });
}