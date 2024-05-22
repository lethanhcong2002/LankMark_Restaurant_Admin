import { getFirestore, collection, doc, addDoc, setDoc, getDoc, onSnapshot, query, where, updateDoc, getDocs, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js';

const firestore = getFirestore();

function formatCurrency(number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
}

function updateButtonValue(element) {
    var selectedYear = parseInt(element.textContent.trim());
    var button = document.getElementById('growthReportId');
    button.textContent = selectedYear;
    monthlyRevenueChart(selectedYear);
    yearGrowthChart(selectedYear)
}

function getYearForButton() {
    const growthReportButton = document.getElementById('growthReportId');

    const currentYear = new Date().getFullYear();

    growthReportButton.textContent = currentYear;

    const dropdownMenu = document.getElementById('latestYears');

    dropdownMenu.innerHTML = '';

    const recentYears = [];
    for (let i = 0; i < 5; i++) {
        recentYears.push(currentYear - i);
    }

    recentYears.forEach(year => {
        const link = document.createElement('a');
        link.classList.add('dropdown-item');
        link.href = 'javascript:void(0);';
        link.textContent = year;
        link.onclick = function () {
            updateButtonValue(this);
        };
        dropdownMenu.appendChild(link);
    });

    monthlyRevenueChart(currentYear);
    yearGrowthChart(currentYear);
}
getYearForButton();

async function getTotalAmountsIncome() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let thisMonthTotalIncome = 0;
    let lastMonthTotalIncome = 0;

    try {
        const thisMonthQuerySnapshot = await getDocs(
            query(
                collection(firestore, "Invoice"),
                where("timeReceived", ">=", new Date(currentYear, currentMonth, 1).toISOString()),
                where("timeReceived", "<", new Date(currentYear, currentMonth + 1, 1).toISOString())
            )
        );
        thisMonthQuerySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.status === "Đã thanh toán") {
                thisMonthTotalIncome += data.totalAmount;
            }
        });

        const lastMonthQuerySnapshot = await getDocs(
            query(
                collection(firestore, "Invoice"),
                where("timeReceived", ">=", new Date(lastYear, lastMonth, 1).toISOString()),
                where("timeReceived", "<", new Date(currentYear, currentMonth, 1).toISOString())
            )
        );
        lastMonthQuerySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.status === "Đã thanh toán") {
                lastMonthTotalIncome += data.totalAmount;
            }
        });

        return { thisMonthTotalIncome, lastMonthTotalIncome };
    } catch (error) {
        console.error("Error getting total amounts: ", error);
        return { thisMonthTotalIncome: 0, lastMonthTotalIncome: 0 };
    }
}

async function getTotalAmountsSpending() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let thisMonthTotalSpending = 0;
    let lastMonthTotalSpending = 0;

    try {
        const thisMonthQuerySnapshot = await getDocs(
            query(
                collection(firestore, "OrderProduct"),
                where("timeReceived", ">=", new Date(currentYear, currentMonth, 1).toISOString()),
                where("timeReceived", "<", new Date(currentYear, currentMonth + 1, 1).toISOString())
            )
        );
        thisMonthQuerySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.status === "Đã nhận") {
                thisMonthTotalSpending += data.totalAmountReceived;
            }
        });

        const lastMonthQuerySnapshot = await getDocs(
            query(
                collection(firestore, "OrderProduct"),
                where("timeReceived", ">=", new Date(lastYear, lastMonth, 1).toISOString()),
                where("timeReceived", "<", new Date(currentYear, currentMonth, 1).toISOString())
            )
        );
        lastMonthQuerySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.status === "Đã nhận") {
                lastMonthTotalSpending += data.totalAmountReceived;
            }
        });

        return { thisMonthTotalSpending, lastMonthTotalSpending };
    } catch (error) {
        console.error("Error getting total amounts: ", error);
        return { thisMonthTotalSpending: 0, lastMonthTotalSpending: 0 };
    }
}

async function getTotalReservation() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const lastMonth = (currentMonth === 0) ? 11 : currentMonth - 1;
    const lastYear = (currentMonth === 0) ? currentYear - 1 : currentYear;

    let thisMonthTotalReservation = 0;
    let lastMonthTotalReservation = 0;

    try {
        const [thisMonthQuerySnapshot, lastMonthQuerySnapshot] = await Promise.all([
            getDocs(
                query(
                    collection(firestore, "Reservations"),
                    where("bookingTime", ">=", new Date(currentYear, currentMonth, 1).toISOString()),
                    where("bookingTime", "<", new Date(currentYear, currentMonth + 1, 1).toISOString())
                )
            ),
            getDocs(
                query(
                    collection(firestore, "Reservations"),
                    where("bookingTime", ">=", new Date(lastYear, lastMonth, 1).toISOString()),
                    where("bookingTime", "<", new Date(currentYear, currentMonth, 1).toISOString())
                )
            )
        ]);

        // Tính số lượng đặt hàng cho tháng hiện tại
        thisMonthQuerySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === "Đã thanh toán") {
                thisMonthTotalReservation++;
            }
        });

        // Tính số lượng đặt hàng cho tháng trước
        lastMonthQuerySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === "Đã thanh toán") {
                lastMonthTotalReservation++;
            }
        });

        return { thisMonthTotalReservation, lastMonthTotalReservation };
    } catch (error) {
        console.error("Error getting total amounts: ", error);
        return { thisMonthTotalReservation: 0, lastMonthTotalReservation: 0 };
    }
}

async function getTotalAmountsByYear(year) {
    const thisYearData = [];
    const lastYearData = [];

    try {
        // Lặp qua từ tháng 1 đến tháng 12 của năm hiện tại
        for (let month = 0; month < 12; month++) {
            const firstDayOfMonth = new Date(year, month, 1);
            const lastDayOfMonth = new Date(year, month + 1, 0);

            let totalIncome = 0;

            const querySnapshot = await getDocs(
                query(
                    collection(firestore, "Invoice"),
                    where("timeReceived", ">=", firstDayOfMonth.toISOString()),
                    where("timeReceived", "<=", lastDayOfMonth.toISOString())
                )
            );

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.status === "Đã thanh toán") {
                    totalIncome += data.totalAmount;
                    console.log(data.totalAmount);
                }
            });

            thisYearData.push({ month: month + 1, year: year, totalIncome: totalIncome });
        }

        // Lặp qua từ tháng 1 đến tháng 12 của năm trước đó
        for (let month = 0; month < 12; month++) {
            const firstDayOfMonth = new Date(year - 1, month, 1);
            const lastDayOfMonth = new Date(year - 1, month + 1, 0);

            let totalIncome = 0;

            const querySnapshot = await getDocs(
                query(
                    collection(firestore, "Invoice"),
                    where("timeReceived", ">=", firstDayOfMonth.toISOString()),
                    where("timeReceived", "<=", lastDayOfMonth.toISOString())
                )
            );

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.status === "Đã thanh toán") {
                    totalIncome += data.totalAmount;
                }
            });

            lastYearData.push({ month: month + 1, year: year - 1, totalIncome: totalIncome });
        }

        return { thisYearData, lastYearData };
    } catch (error) {
        console.error("Error getting total amounts by year: ", error);
        return { thisYearData: [], lastYearData: [] };
    }
}

async function getGrowthRevenue(year) {
    const currentYear = year;
    const lastYear = year - 1;

    let thisYearTotalIncome = 0;
    let lastYearTotalIncome = 0;

    try {
        // Tính toán tổng doanh thu của năm hiện tại (year)
        const thisYearQuerySnapshot = await getDocs(
            query(
                collection(firestore, "Invoice"),
                where("timeReceived", ">=", new Date(currentYear, 0, 1).toISOString()), // Năm hiện tại, tháng 1
                where("timeReceived", "<", new Date(currentYear + 1, 0, 1).toISOString()) // Năm hiện tại, tháng 1 của năm sau
            )
        );
        thisYearQuerySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.status === "Đã thanh toán") {
                thisYearTotalIncome += data.totalAmount;
            }
        });

        // Tính toán tổng doanh thu của năm trước (year - 1)
        const lastYearQuerySnapshot = await getDocs(
            query(
                collection(firestore, "Invoice"),
                where("timeReceived", ">=", new Date(lastYear, 0, 1).toISOString()), // Năm trước, tháng 1
                where("timeReceived", "<", new Date(currentYear, 0, 1).toISOString()) // Năm hiện tại, tháng 1
            )
        );
        lastYearQuerySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.status === "Đã thanh toán") {
                lastYearTotalIncome += data.totalAmount;
            }
        });

        // Tính toán phần trăm tăng trưởng doanh thu giữa hai năm
        let revenueGrowthPercentage = ((thisYearTotalIncome - lastYearTotalIncome) / lastYearTotalIncome) * 100;

        // Xử lý trường hợp revenueGrowthPercentage trả về Infinity
        if (!isFinite(revenueGrowthPercentage)) {
            revenueGrowthPercentage = 100;
        } else {
            // Làm tròn phần trăm tăng trưởng doanh thu thành số nguyên
            revenueGrowthPercentage = Math.round(revenueGrowthPercentage);
        }

        return {
            thisYearTotalIncome,
            lastYearTotalIncome,
            revenueGrowthPercentage
        };
    } catch (error) {
        console.error("Error getting total amounts: ", error);
        return {
            thisYearTotalIncome: 0,
            lastYearTotalIncome: 0,
            revenueGrowthPercentage: 0
        };
    }
}

async function getTotalAmountsByRole() {
    const menuItemsByRole = {
        'Món chính': { totalAmount: 0, callCount: 0 },
        'Khai vị': { totalAmount: 0, callCount: 0 },
        'Tráng miệng': { totalAmount: 0, callCount: 0 },
        'Nước': { totalAmount: 0, callCount: 0 }
    };

    try {
        const invoiceIds = [];

        const invoicesSnapshot = await getDocs(collection(firestore, "Invoice"), where("status", "==", "Đã thanh toán"));
        invoicesSnapshot.forEach(doc => {
            const invoiceId = doc.id;
            invoiceIds.push(invoiceId);
        });

        for (const invoiceId of invoiceIds) {
            const invoiceDetailsSnapshot = await getDocs(collection(firestore, "InvoiceDetail"), where("invoiceKey", "==", invoiceId));
            for (const detailDoc of invoiceDetailsSnapshot.docs) {
                const detailData = detailDoc.data();
                const menuItemId = detailData.menuItemKey;

                console.log(menuItemId);

                const menuItemSnapshot = await getDoc(doc(collection(firestore, "MenuItem"), menuItemId));
                if (menuItemSnapshot.exists()) {
                    const menuItem = menuItemSnapshot.data();
                    const role = menuItem.role;

                    if (role && role in menuItemsByRole) {
                        menuItemsByRole[role].totalAmount += detailData.totalPrice;
                        menuItemsByRole[role].callCount += 1; // Tăng số lần gọi món lên 1
                    }
                }
            }
        }

        return menuItemsByRole;
    } catch (error) {
        console.error("Error getting total amounts by role: ", error);
        return {
            'Món chính': { totalAmount: 0, callCount: 0 },
            'Khai vị': { totalAmount: 0, callCount: 0 },
            'Tráng miệng': { totalAmount: 0, callCount: 0 },
            'Nước': { totalAmount: 0, callCount: 0 }
        };
    }
}

getTotalAmountsByRole();

async function getTopMenuItemsByCallCount() {
    const menuItemsByRole = {};

    try {
        const invoiceIds = [];

        const invoicesSnapshot = await getDocs(collection(firestore, "Invoice"), where("status", "==", "Đã thanh toán"));
        invoicesSnapshot.forEach(doc => {
            const invoiceId = doc.id;
            invoiceIds.push(invoiceId);
        });

        for (const invoiceId of invoiceIds) {
            const invoiceDetailsSnapshot = await getDocs(collection(firestore, "InvoiceDetail"), where("invoiceKey", "==", invoiceId));
            for (const detailDoc of invoiceDetailsSnapshot.docs) {
                const detailData = detailDoc.data();
                const menuItemId = detailData.menuItemKey;

                console.log(menuItemId);

                const menuItemSnapshot = await getDoc(doc(collection(firestore, "MenuItem"), menuItemId));
                if (menuItemSnapshot.exists()) {
                    const menuItem = menuItemSnapshot.data();
                    console.log(menuItem);
                    const name = menuItem.foodName;
                    const totalPrice = detailData.totalPrice;

                    if (!menuItemsByRole[name]) {
                        menuItemsByRole[name] = { totalAmount: 0, callCount: 0 };
                    }

                    menuItemsByRole[name].totalAmount += totalPrice;
                    menuItemsByRole[name].callCount += 1;
                }
            }
        }

        const sortedMenuItems = Object.entries(menuItemsByRole).sort((a, b) => b[1].callCount - a[1].callCount).slice(0, 10);

        // Thêm số lần gọi món vào kết quả trả về
        return sortedMenuItems.map(([name, { totalAmount, callCount }]) => ({ name, totalAmount, callCount }));
    } catch (error) {
        console.error("Error getting top menu items by call count: ", error);
        return [];
    }
}

async function loadDataFromFirestore() {
    getTotalAmountsIncome()
        .then(({ thisMonthTotalIncome, lastMonthTotalIncome }) => {

            const percentIncome = document.getElementById('percentIncome');

            let percentageChangeIncome = 0;

            if (lastMonthTotalIncome !== 0) {
                percentageChangeIncome = ((thisMonthTotalIncome - lastMonthTotalIncome) / lastMonthTotalIncome) * 100;
            }
            else {
                percentageChangeIncome = 100;
            }
            document.getElementById('income').textContent = formatCurrency(thisMonthTotalIncome) || 0;

            let icons;
            if (percentageChangeIncome >= 0) {
                percentIncome.classList.add("text-success", "fw-semibold");
                icons = '<i class="bx bx-up-arrow-alt"></i> +';
            } else {
                percentIncome.classList.add("text-danger", "fw-semibold");
                icons = '<i class="bx bx-down-arrow-alt"></i> -';
            }
            document.getElementById('percentIncome').innerHTML = icons + percentageChangeIncome + '%';

        })
        .catch((error) => {
            console.error("Error:", error);
        });

    getTotalAmountsSpending()
        .then(({ thisMonthTotalSpending, lastMonthTotalSpending }) => {

            const percentSpending = document.getElementById('percentSpending');

            let percentageChangeSpending = 0;

            if (lastMonthTotalSpending !== 0) {
                percentageChangeSpending = ((thisMonthTotalSpending - lastMonthTotalSpending) / lastMonthTotalSpending) * 100;
            }
            else {
                percentageChangeSpending = 100;
            }
            document.getElementById('spending').textContent = formatCurrency(thisMonthTotalSpending) || 0;

            let icons;
            if (percentageChangeSpending >= 0) {
                percentSpending.classList.add("text-danger", "fw-semibold");
                icons = '<i class="bx bx-up-arrow-alt"></i> +';
            } else {
                percentSpending.classList.add("text-success", "fw-semibold");
                icons = '<i class="bx bx-down-arrow-alt"></i> -';
            }

            document.getElementById('percentSpending').innerHTML = icons + percentageChangeSpending + '%';

        })
        .catch((error) => {
            console.error("Error:", error);
        });

    getTotalReservation()
        .then(({ thisMonthTotalReservation, lastMonthTotalReservation }) => {

            const percentReservation = document.getElementById('afterTotalReservation');

            let percentageChangeRerservation = 0;

            if (lastMonthTotalReservation !== 0) {
                percentageChangeRerservation = ((thisMonthTotalReservation - lastMonthTotalReservation) / lastMonthTotalReservation) * 100;
            }
            else {
                percentageChangeRerservation = 100;
            }
            document.getElementById('totalReservation').textContent = thisMonthTotalReservation || 0;

            let icons;
            if (percentageChangeRerservation >= 0) {
                percentReservation.classList.add("text-success", "fw-semibold");
                icons = '<i class="bx bx-up-arrow-alt"></i> +';
            } else {
                percentReservation.classList.add("text-danger", "fw-semibold");
                icons = '<i class="bx bx-down-arrow-alt"></i> -';
            }

            document.getElementById('afterTotalReservation').innerHTML = icons + percentageChangeRerservation + '%';

        })
        .catch((error) => {
            console.error("Error:", error);
        });
    getTopMenuItemsByCallCount().then(topMenuItems => {
        const listTotalQuantity = document.getElementById("listTotalQunatity");

        topMenuItems.forEach(menuItem => {
            // Tạo phần tử li
            const li = document.createElement("li");
            li.classList.add("d-flex", "mb-4", "pb-1");

            // Tạo cấu trúc nội dung cho li
            li.innerHTML = `
            <div class="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                <div class="me-2">
                    <small class="text-muted d-block mb-1">${menuItem.name}</small>
                    <h6 class="mb-0">${menuItem.callCount}</h6>
                </div>
                <div class="user-progress d-flex align-items-center gap-1">
                    <h6 class="mb-0">${menuItem.totalAmount}</h6>
                    <span class="text-muted">VNĐ</span>
                </div>
            </div>
        `;

            // Append li vào danh sách
            listTotalQuantity.appendChild(li);
        });
    }).catch(error => {
        console.error("Error retrieving top menu items: ", error);
    });
}

loadDataFromFirestore();

////////////////////////////////Chart
let cardColor, headingColor, axisColor, shadeColor, borderColor;

cardColor = config.colors.white;
headingColor = config.colors.headingColor;
axisColor = config.colors.axisColor;
borderColor = config.colors.borderColor;

// Total Revenue Report Chart - Bar Chart
// --------------------------------------------------------------------
async function monthlyRevenueChart(year) {
    const totalRevenueChartEl = document.querySelector('#totalRevenueChart');

    totalRevenueChartEl.innerHTML = '';

    getTotalAmountsByYear(year).then(({ thisYearData, lastYearData }) => {

        const totalRevenueChartOptions = {
            series: [
                {
                    name: year,
                    data: thisYearData.map(item => item.totalIncome)
                },
                {
                    name: year - 1,
                    data: lastYearData.map(item => item.totalIncome)
                },

            ],
            chart: {
                type: 'bar',
                height: 300,
                toolbar: { show: false }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '50%',
                }
            },
            colors: [config.colors.primary, config.colors.info],
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                show: true,
                width: 6,
                lineCap: 'round',
                colors: ['transparent']
            },
            legend: {
                show: true,
                horizontalAlign: 'left',
                position: 'top',
                markers: {
                    height: 8,
                    width: 8,
                    radius: 12,
                    offsetX: -3
                },
                labels: {
                    colors: axisColor
                },
                itemMargin: {
                    horizontal: 10
                }
            },
            grid: {
                borderColor: borderColor,
                padding: {
                    top: 0,
                    bottom: -8,
                    left: 20,
                    right: 20
                }
            },
            xaxis: {
                categories: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                labels: {
                    style: {
                        fontSize: '13px',
                        colors: axisColor
                    }
                },
                axisTicks: {
                    show: false
                },
                axisBorder: {
                    show: false
                }
            },
            yaxis: {
                labels: {
                    style: {
                        fontSize: '13px',
                        colors: axisColor
                    }
                }
            },
            fill: {
                opacity: 1,
            },
            responsive: [
                {
                    breakpoint: 1700,
                    options: {
                        plotOptions: {
                            bar: {
                                borderRadius: 10,
                                columnWidth: '49%'
                            }
                        }
                    }
                },
                {
                    breakpoint: 1580,
                    options: {
                        plotOptions: {
                            bar: {
                                borderRadius: 10,
                                columnWidth: '52%'
                            }
                        }
                    }
                },
                {
                    breakpoint: 1440,
                    options: {
                        plotOptions: {
                            bar: {
                                borderRadius: 10,
                                columnWidth: '59%'
                            }
                        }
                    }
                },
                {
                    breakpoint: 1300,
                    options: {
                        plotOptions: {
                            bar: {
                                borderRadius: 10,
                                columnWidth: '65%'
                            }
                        }
                    }
                },
                {
                    breakpoint: 1200,
                    options: {
                        plotOptions: {
                            bar: {
                                borderRadius: 10,
                                columnWidth: '58%'
                            }
                        }
                    }
                },
                {
                    breakpoint: 1040,
                    options: {
                        plotOptions: {
                            bar: {
                                borderRadius: 11,
                                columnWidth: '65%'
                            }
                        }
                    }
                },
                {
                    breakpoint: 991,
                    options: {
                        plotOptions: {
                            bar: {
                                borderRadius: 10,
                                columnWidth: '48%'
                            }
                        }
                    }
                },
                {
                    breakpoint: 840,
                    options: {
                        plotOptions: {
                            bar: {
                                borderRadius: 10,
                                columnWidth: '52%'
                            }
                        }
                    }
                },
                {
                    breakpoint: 768,
                    options: {
                        plotOptions: {
                            bar: {
                                borderRadius: 10,
                                columnWidth: '45%'
                            }
                        }
                    }
                },
                {
                    breakpoint: 640,
                    options: {
                        plotOptions: {
                            bar: {
                                borderRadius: 10,
                                columnWidth: '49%'
                            }
                        }
                    }
                },
                {
                    breakpoint: 576,
                    options: {
                        plotOptions: {
                            bar: {
                                borderRadius: 10,
                                columnWidth: '54%'
                            }
                        }
                    }
                },
                {
                    breakpoint: 480,
                    options: {
                        plotOptions: {
                            bar: {
                                borderRadius: 10,
                                columnWidth: '62%'
                            }
                        }
                    }
                },
                {
                    breakpoint: 420,
                    options: {
                        plotOptions: {
                            bar: {
                                borderRadius: 10,
                                columnWidth: '69%'
                            }
                        }
                    }
                },
                {
                    breakpoint: 380,
                    options: {
                        plotOptions: {
                            bar: {
                                borderRadius: 10,
                                columnWidth: '67%'
                            }
                        }
                    }
                }
            ],
            states: {
                hover: {
                    filter: {
                        type: 'none'
                    }
                },
                active: {
                    filter: {
                        type: 'none'
                    }
                }
            },
            tooltip: {
                x: {
                    formatter: function (val) {
                        return "Tháng " + val;
                    }
                },
                y: {
                    formatter: function (val) {
                        return formatCurrency(val);
                    }
                }
            }
        };

        if (typeof totalRevenueChartEl !== undefined && totalRevenueChartEl !== null) {
            const totalRevenueChart = new ApexCharts(totalRevenueChartEl, totalRevenueChartOptions);
            totalRevenueChart.render();
        }

    }).catch(error => {
        console.error('Error getting total amounts by year:', error);
    });
}

// Growth Chart - Radial Bar Chart
// --------------------------------------------------------------------
async function yearGrowthChart(year) {
    const growthChartEl = document.querySelector('#growthChart');
    growthChartEl.innerHTML = '';
    getGrowthRevenue(year).then(({ thisYearTotalIncome, lastYearTotalIncome, revenueGrowthPercentage }) => {

        document.getElementById('currentYear').textContent = year;
        document.getElementById('lastYear').textContent = year - 1;
        document.getElementById('amountCurrentYear').textContent = formatCurrency(thisYearTotalIncome);
        document.getElementById('amountLastYear').textContent = formatCurrency(lastYearTotalIncome);

        const growthChartOptions = {
            series: [revenueGrowthPercentage],
            labels: ['Doanh thu'],
            chart: {
                height: 240,
                type: 'radialBar'
            },
            plotOptions: {
                radialBar: {
                    size: 150,
                    offsetY: 10,
                    startAngle: -150,
                    endAngle: 150,
                    hollow: {
                        size: '55%'
                    },
                    track: {
                        background: cardColor,
                        strokeWidth: '100%'
                    },
                    dataLabels: {
                        name: {
                            offsetY: 15,
                            color: headingColor,
                            fontSize: '15px',
                            fontWeight: '600',
                            fontFamily: 'Public Sans'
                        },
                        value: {
                            offsetY: -25,
                            color: headingColor,
                            fontSize: '22px',
                            fontWeight: '500',
                            fontFamily: 'Public Sans'
                        }
                    }
                }
            },
            colors: [config.colors.primary],
            fill: {
                type: 'gradient',
                gradient: {
                    shade: 'dark',
                    shadeIntensity: 0.5,
                    gradientToColors: [config.colors.primary],
                    inverseColors: true,
                    opacityFrom: 1,
                    opacityTo: 0.6,
                    stops: [30, 70, 100]
                }
            },
            stroke: {
                dashArray: 5
            },
            grid: {
                padding: {
                    top: -35,
                    bottom: -10
                }
            },
            states: {
                hover: {
                    filter: {
                        type: 'none'
                    }
                },
                active: {
                    filter: {
                        type: 'none'
                    }
                }
            }
        };
        if (typeof growthChartEl !== undefined && growthChartEl !== null) {
            const growthChart = new ApexCharts(growthChartEl, growthChartOptions);
            growthChart.render();
        }
    });
}

// --------------------------------------------------------------------
async function circleTotalOrderMenuItem() {
    const chartOrderStatistics = document.querySelector('#orderStatisticsChart');
    chartOrderStatistics.innerHTML = '';
    getTotalAmountsByRole().then(data => {
        const roles = Object.keys(data);
        const amounts = Object.values(data).map(item => item.totalAmount);
        const callCounts = Object.values(data).map(item => item.callCount);

        const colorRole = ['bg-label-primary', 'bg-label-secondary', 'bg-label-info', 'bg-label-success'];
        for (let i = 0; i < roles.length; i++) {
            const role = roles[i];
            const amount = amounts[i];
            const callCount = callCounts[i];

            let icon;
            if (role !== "Nước") {
                icon = 'bx bx-dish';
            }
            else {
                icon = 'bx bx-drink';
            }

            const listItemHTML = `
                <li class="d-flex mb-4 pb-1">
                    <div class="avatar flex-shrink-0 me-3">
                            <span class="avatar-initial rounded ${colorRole[i]}"><i class="${icon}"></i></span>
                          </div>
                    <div class="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                            <div class="me-2">
                                <h6 class="mb-0">${role}</h6>
                                <small class="text-muted">Số lần gọi món: ${callCount}</small>
                            </div>
                            <div class="user-progress">
                                <small class="fw-semibold">${formatCurrency(amount)}</small>
                            </div>
                    </div>
                </li> 
            `;

            // Tạo phần tử li từ HTML đã tạo
            const newItem = document.createElement('li');
            newItem.innerHTML = listItemHTML;

            // Thêm phần tử li vào danh sách ul
            const listRoleMenu = document.querySelector('#listRoleMenu');
            listRoleMenu.appendChild(newItem);
        }

        const orderChartConfig = {
            chart: {               
                type: 'donut'
            },
            labels: roles,
            series: amounts,
            colors: [config.colors.primary, config.colors.secondary, config.colors.info, config.colors.success],
            stroke: {
                width: 5,
                colors: cardColor
            },
            dataLabels: {
                formatter: function (val, opt) {
                    return parseInt(val) + '%';
                }
            },
            legend: {
                position: 'right'
            },
            grid: {
                padding: {
                    top: 0,
                    bottom: 0,
                    right: 15
                }
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '75%',
                        labels: {
                            show: true,
                            value: {
                                fontSize: '1.5rem',
                                fontFamily: 'Public Sans',
                                color: headingColor,
                                offsetY: -15,
                                formatter: function (val) {
                                    return formatCurrency(val);
                                }
                            },
                            name: {
                                offsetY: 20,
                                fontFamily: 'Public Sans'
                            },                           
                        }
                    }
                }
            }
        };
        if (typeof chartOrderStatistics !== undefined && chartOrderStatistics !== null) {
            const statisticsChart = new ApexCharts(chartOrderStatistics, orderChartConfig);
            statisticsChart.render();
        }
    }).catch(error => {
        console.error("Error getting total amounts by role: ", error);
    });
}

circleTotalOrderMenuItem();