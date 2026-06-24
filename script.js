
   
        // localStorage.removeItem('inv_users_list');
        // localStorage.removeItem('inv_sales_total_amount');
        // --- إدارة قاعدة البيانات المحلية واستدعائها ---
        let products   = [];// قائمة المنتجات
        // ---------------------
        let totalsales = 0;// إجمالي المبيعات
        // ---------------------
        let sales    = []; // قائمة المبيعات
        let trucks   = []; // قائمة الشاحنات
        let users    = []; // قائمة المستخدمين
        let selectedInvoiceForView = null; // الفاتورة المحددة للعرض في نافذة التفاصيل
        let tempTruckItems = []; // قائمة مؤقتة لمنتجات الشاحنة أثناء الإضافة
        let cart = []; // سلة مبيعات الكاشير الحالية
        let systemConfig = {
            currency: 'DZD',
            language: 'ar',
            darkMode: false,
            companyName: 'مؤسسة إدارة المخزون الممتازة',
            companyLogo: '',
            profileLogo: '',
            username: 'المشرف العام',
            printType: 'sheet'
        };

        // وظيفة لإظهار تنبيهات غير معرقلة (Toast) تذهب تلقائياً
        function showToast(message, duration = 3000) {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = 'toast';
            
            toast.innerHTML = `<span>ℹ️</span> <span>${message}ooo</span>`;
            container.appendChild(toast);
            
            // إظهار التنبيه بتأخير بسيط لتفعيل الأنميشن
            setTimeout(() => toast.classList.add('show'), 10);
            
            // إخفاء وحذف التنبيه بعد المدة المحددة
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        const defaultProducts = [
            { id: 1, barcode: "100222", name: "حليب بقر 1ل", category: "ألبان", qty: 150, entryPrice: 100, salePrice: 150, minLimit: 20 },
            { id: 2, barcode: "100223", name: "عصير برتقال 1ل", category: "مشروبات", qty: 80, entryPrice: 140, salePrice: 180, minLimit: 15 },
            { id: 3, barcode: "100224", name: "مياه معدنية 1.5ل", category: "مشروبات", qty: 500, entryPrice: 25, salePrice: 35, minLimit: 50 },
            { id: 4, barcode: "100225", name: "بسكويت الشوكولاتة", category: "حلويات", qty: 8, entryPrice: 60, salePrice: 80, minLimit: 10 }
        ] ;

        const defaultTrucks = [
            { id: 1, truckNum: "01423-116-30", driver: "أحمد بن عيسى", qty: 0, returned: 0, val: 0, dateTime: "01/01/2024, 10:00" },
            { id: 2, truckNum: "08933-120-16", driver: "عمر البشير", qty: 0, returned: 0, val: 0, dateTime: "02/01/2024, 11:30" }
        ];


        // تحميل البيانات عند فتح الصفحة
        function initAppDatabase() {
            // تحميل تهيئة النظام
            const savedConfig = localStorage.getItem('inv_system_config');
            if (savedConfig) {
                systemConfig = JSON.parse(savedConfig);
            }
            
            // تحميل المنتجات
            const savedProducts = localStorage.getItem('inv_products_list');
            if (savedProducts) {
                products = JSON.parse(savedProducts);
                if(products.length < 5) {
                    products = [...defaultProducts];
                    localStorage.setItem('inv_products_list', JSON.stringify(products));
                }

            } else {
                products = [...defaultProducts];
                localStorage.setItem('inv_products_list', JSON.stringify(products));
            }

            // تحميل إجمالي المبيعات
            const TotalSales = localStorage.getItem('inv_sales_total_amount'); 
            if (TotalSales) {
                // alert("تم تحميل إجمالي المبيعات من  المحلية: " + TotalSales);
                totalsales = JSON.parse(TotalSales);
            } 
            else {
                totalsales = 0;
                localStorage.setItem('inv_sales_total_amount', JSON.stringify(totalsales));
            }

            // تحميل المبيعات 
            const savedSales = localStorage.getItem('inv_sales_list');
            if (savedSales) {
                sales = JSON.parse(savedSales);
            } else {
                sales = [];
                localStorage.setItem('inv_sales_list', JSON.stringify(sales));
            }

            // تحميل الشاحنات
            const savedTrucks = localStorage.getItem('inv_trucks_list');
            if (savedTrucks) {
                
                trucks = JSON.parse(savedTrucks);
                if (trucks.length <5) {
                    trucks = [...defaultTrucks];
                    localStorage.setItem('inv_trucks_list', JSON.stringify(trucks));
                }
                else {
                    trucks = JSON.parse(savedTrucks);
                }
            } else {
                trucks = [...defaultTrucks];
                localStorage.setItem('inv_trucks_list', JSON.stringify(trucks));
            }

            // تحديث واجهة المستخدم بالإعدادات المحملة
            document.getElementById('dark-mode-toggle').checked = systemConfig.darkMode;
            if (systemConfig.darkMode) document.body.classList.add('dark-mode');
            
            document.getElementById('currency-select').value = systemConfig.currency;
            document.getElementById('Language-select').value = systemConfig.language;
            document.getElementById('sys-company-name').value = systemConfig.companyName;
            document.getElementById('sys-username').value = systemConfig.username;
            if (document.getElementById('sys-print-type')) document.getElementById('sys-print-type').value = systemConfig.printType || 'sheet';

            // تحميل قائمة المستخدمين من الذاكرة المحلية
            const savedUsers = localStorage.getItem('inv_users_list');
            if (savedUsers) {
                users = JSON.parse(savedUsers);
            } else {
                users = [{ user: "admin", pass: "1234" }]; // حساب افتراضي أول مرة
                localStorage.setItem('inv_users_list', JSON.stringify(users));
            }

            updateDashboardStats();
            applyLanguageConfig();

            // التحقق من حالة الجلسة الحالية
            if (sessionStorage.getItem('isLoggedIn') === 'true') {
                document.getElementById('login-screen').style.display = 'none';
            }
        }

        function toggleAuth(showRegister) {
            document.getElementById('login-container').style.display = showRegister ? 'none' : 'block';
            document.getElementById('register-container').style.display = showRegister ? 'block' : 'none';
        }

        function handleLogin() {
            const user = document.getElementById('login-username').value.trim();
            const pass = document.getElementById('login-password').value.trim();

            const foundUser = users.find(u => u.user === user && u.pass === pass);

            if (foundUser) {
                sessionStorage.setItem('isLoggedIn', 'true');
                systemConfig.username = user;
                saveDatabase();
                document.getElementById('login-screen').style.display = 'none';
            } else {
                alert("بيانات الدخول غير صحيحة!");
            }
        }

        function handleRegister() {
            const user = document.getElementById('reg-username').value.trim();
            const pass = document.getElementById('reg-password').value.trim();
            const confirm = document.getElementById('reg-confirm').value.trim();

            if (!user || !pass) { alert("يرجى إدخال اسم المستخدم وكلمة المرور"); return; }
            if (pass !== confirm) { alert("كلمات المرور غير متطابقة"); return; }
            if (users.find(u => u.user === user)) { alert("اسم المستخدم موجود مسبقاً، اختر اسماً آخر"); return; }

            users.push({ user, pass });
            localStorage.setItem('inv_users_list', JSON.stringify(users));
            alert("تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.");
            toggleAuth(false);
        }

        function logout() {
            sessionStorage.removeItem('isLoggedIn');
            location.reload();
        }

        function saveDatabase() {
            
            if(!products || !sales || !trucks || !systemConfig || !users) {
                console.error("خطأ: لا يمكن حفظ قاعدة البيانات، بعض القوائم غير موجودة.");
                return;
            }

            if(products.length >5 || sales.length > 10 || trucks.length > 10) {
                products = products.slice(0, 5);
                sales = sales.slice(0, 10);
                trucks = trucks.slice(0, 10);
                alert("اكتملت عدد المحاولات المسموح بها، لا يمكن حفظ البيانات.");
                return;
            }
            // alert("تم حفظ قاعدة البيانات بنجاح!");
            localStorage.setItem('inv_products_list', JSON.stringify(products));
            localStorage.setItem('inv_sales_total_amount', JSON.stringify(totalsales));
            localStorage.setItem('inv_sales_list', JSON.stringify(sales));
            localStorage.setItem('inv_trucks_list', JSON.stringify(trucks));
            localStorage.setItem('inv_system_config', JSON.stringify(systemConfig));
            localStorage.setItem('inv_users_list', JSON.stringify(users));
            updateDashboardStats();
        }

        function resetAllDatabase() {
            const lang = systemConfig.language;
            const confirmMsg = lang === 'ar' ? "هل أنت متأكد من رغبتك في حذف كافة السجلات (المنتجات، المبيعات، الشاحنات) وإعادة تهيئة النظام؟ سيتم الحفاظ على حسابات المستخدمين والإعدادات." : 
                               "Are you sure you want to delete all records (products, sales, trucks)? User accounts and settings will be preserved.";
            
            if (confirm(confirmMsg)) {
                localStorage.removeItem('inv_products_list');
                localStorage.removeItem('inv_sales_total_amount');
                localStorage.removeItem('inv_sales_list');
                localStorage.removeItem('inv_trucks_list');
                
                initAppDatabase();
                switchFrame('btn-system', 'frame-system');
            }
        }

        // --- تحديث الإحصائيات العلوية بصفة مستمرة وديناميكية ---
        function updateDashboardStats() {
            // 1. سعر المخزون الإجمالي (الكمية * سعر البيع)
            let totalStockVal = 0;
            products.forEach(p => {
                totalStockVal += (p.qty * p.salePrice);
            });

            // 2. إجمالي مبيعات المبيعات المحققة فعلاً
            let totalSalesAmount = 0;
            sales.forEach(s => { 
                totalSalesAmount += s.total;
            });

            // إضافة مبيعات الشاحنات (القيمة الصافية)
            trucks.forEach(t => {
                const netValue = t.val * (1 - (t.returned / (t.qty || 1)));
                totalSalesAmount += netValue;
            });
            // totalsales += totalSalesAmount;
            texttotalsales = totalsales + totalSalesAmount;
            // document.write(totalsales);
            // تحديث حقول الواجهة
            document.getElementById('header-stock-value').innerText = totalStockVal.toFixed(2);
            document.getElementById('header-total-qty').innerText = products.length;
            document.getElementById('header-total-sales').innerText = texttotalsales.toFixed(2);
            // document.getElementById('header-total-sales').innerText = totalSalesAmount.toFixed(2);
            document.getElementById('header-total-clients').innerText = sales.length;

            // تحديث مسميات العملات
            document.querySelectorAll('.currency-label').forEach(el => {
                el.innerText = systemConfig.currency;
            });

            // تحديث الشعار في كل مكان
            const logoEl = document.getElementById('logo-company');
            const invLogoPrev = document.getElementById('invoice-logo-preview');
            const invDetailLogo = document.getElementById('invoice-detail-logo');
            const printLogos = document.querySelectorAll('.company-logo-print');
            
            // 1. شعار التطبيق (شعارنا): يظهر فقط في هيدر البرنامج كجزء من واجهة المستخدم
            if (logoEl) {
                logoEl.innerHTML = `<img src="Our_company_logo.png" class="image-ocl" alt="App Logo">`;
            }

            // 2. شعار المؤسسة (العميل): يظهر في الفواتير، المعاينات، والتقارير المطبوعة فقط
            if (systemConfig.companyLogo) {
                if (invLogoPrev) {
                    invLogoPrev.src = systemConfig.companyLogo;
                    invLogoPrev.style.display = 'block';
                }
                if (invDetailLogo) {
                    invDetailLogo.src = systemConfig.companyLogo;
                    invDetailLogo.style.display = 'block';
                }
                printLogos.forEach(img => {
                    img.src = systemConfig.companyLogo;
                    img.style.display = 'block';
                });
            } else {
                if (invLogoPrev) invLogoPrev.style.display = 'none';
                if (invDetailLogo) invDetailLogo.style.display = 'none';
                printLogos.forEach(img => img.style.display = 'none');
            }

            // تحديث معاينة شعار المؤسسة في صندوق "بيانات الحساب" بالإعدادات
            const sysPreviewIcon = document.getElementById('preview-company-logo-box');
            const delCompanyBtn  = document.getElementById('del-company-btn');
            if (sysPreviewIcon) {
                if (systemConfig.companyLogo) {
                    sysPreviewIcon.innerHTML = `<img src="${systemConfig.companyLogo}" style="width: 100%; height: 100%; object-fit: contain;">`;
                    if (delCompanyBtn) delCompanyBtn.classList.add('has-image');
                } else {
                    sysPreviewIcon.innerHTML = '<span style="font-size: 40px;">🏢</span>';
                    if (delCompanyBtn) delCompanyBtn.classList.remove('has-image');
                }
            }

            // تحديث صورة الملف الشخصي
            const profileLogoEl = document.getElementById('profile-logo-display');
            const profilePreviewIcon = document.getElementById('preview-profile-logo-box');
            const delProfileBtn = document.getElementById('del-profile-btn');
            if (systemConfig.profileLogo) {
                const imgHtml = `<img src="${systemConfig.profileLogo}" style="width: 90%; height: 90%; object-fit: cover;">`;
                profileLogoEl.innerHTML = imgHtml;
                if (profilePreviewIcon) profilePreviewIcon.innerHTML = imgHtml;
                if (delProfileBtn) delProfileBtn.classList.add('has-image');
            } else {
                profileLogoEl.innerHTML = '<span style="font-size: 24px;">👤</span>';
                if (profilePreviewIcon) profilePreviewIcon.innerHTML = '<span style="font-size: 20px;">👤</span>';
                if (delProfileBtn) delProfileBtn.classList.remove('has-image');
            }

            document.getElementById('profile-name').innerText = systemConfig.username;
            document.getElementById('sys-preview-company').innerText = systemConfig.companyName;
            document.getElementById('invoice-company-title').innerText = systemConfig.companyName;

            // تحديث اسم المؤسسة في جميع عناصر الطباعة والمعاينة
            document.querySelectorAll('.print-company-name').forEach(el => {
                el.innerText = systemConfig.companyName;
            });
        }

        // --- إدارة النوافذ الفرعية للإطارات (Tabs) ---
        function switchFrame(buttonId, frameId) {
            // إعادة التموضع اللوني للقائمة الجانبية
            const buttons = document.querySelectorAll('#the-buttons button');
            buttons.forEach(btn => {
                btn.style.backgroundColor = "var(--container-bg)";
            });

            const currentBtn = document.getElementById(buttonId);
            if (currentBtn) {
                currentBtn.style.backgroundColor = "var(--accent-hover)";
            }

            // إخفاء وعرض الإطارات
            const frames = document.querySelectorAll('.app-frame');
            frames.forEach(frame => {
                frame.classList.remove('active');
            });

            document.getElementById(frameId).classList.add('active');

            // تحميل المحتوى المطلوب فور التبديل للإطار لضمان تدفق البيانات
            if (frameId === 'frame-calculator') {
                renderCartTable();
                setTimeout(() => document.getElementById('codebar').focus(), 100);
            } else if (frameId === 'frame-stock') {
                renderStockTables();
            } else if (frameId === 'frame-products') {
                renderProductsTab();
            } else if (frameId === 'frame-reports') {
                renderFinancialReports();
            } else if (frameId === 'frame-customers') {
                renderCustomersTab();
            } else if (frameId === 'frame-truk') {
                renderTrucksTab();
            }
        }

        // --- نظام مبيعات الكاشير وسلة التبويب الفورية ---
        function toggleCalculatorSubTab(tab) {
            // منع الانتقال لمعاينة الفاتورة إذا كانت السلة فارغة
            if (tab === 'invoice' && cart.length === 0) {
                const lang = systemConfig.language;
                const msg = lang === 'ar' ? 'السلة فارغة! يرجى إضافة منتجات قبل الانتقال للمعاينة.' : 
                             lang === 'en' ? 'Cart is empty! Please add products before viewing invoice.' : 
                             'Le panier est vide ! Veuillez ajouter des produits avant de visualiser la facture.';
                alert(msg);
                return;
            }

            document.getElementById('idcalculator-order').classList.remove('active-tab');
            document.getElementById('idcalculator-invoice').classList.remove('active-tab');
            document.getElementById('orderframe').classList.remove('active');
            document.getElementById('invoiceframe').classList.remove('active');

            if (tab === 'order') {
                document.getElementById('idcalculator-order').classList.add('active-tab');
                document.getElementById('orderframe').classList.add('active');
                renderCartTable();
                setTimeout(() => document.getElementById('codebar').focus(), 100);
            } else if (tab === 'invoice') {
                document.getElementById('idcalculator-invoice').classList.add('active-tab');
                document.getElementById('invoiceframe').classList.add('active');
                renderInvoicePreview();
            }
        }

        // إضافة مادة إلى سلة الشراء عبر الباركود أو الاسم
        function addItemToCartFromInput() {
            const inputVal = document.getElementById('codebar').value.trim();
            if (inputVal === "") return;

            // البحث عن المنتج المطابق للباركود أو الاسم
            const product = products.find(p => p.barcode === inputVal || p.name.toLowerCase() === inputVal.toLowerCase());

            if (product) {
                if (product.qty <= 0) {
                    //ttttttttttttttttttttttttttttttttttttttttt
                    alert("عذراً، هذا المنتج غير متوفر في المخزن حالياً (نفذت الكمية)!");
                    document.getElementById('codebar').value = "";
                    document.getElementById('codebar').focus();
                    return;
                }

                // التحقق من تكراره في السلة أولاً لزيادة الكمية وتنبيه المستخدم
                const cartIndex = cart.findIndex(item => item.product.id === product.id);
                if (cartIndex > -1) {
                    const cartItem = cart[cartIndex];
                    if (cartItem.qty + 1 > product.qty) {
                        const msg = lang === 'ar' ? "الكمية المطلوبة تتجاوز المخزون المتوفر!": 
                                 lang === 'en' ?'':
                                 '';
                        showToast(msg);
                        return;
                    }
                    cartItem.qty += 1;
                    document.getElementById('codebar').value = "";
                    renderCartTable();

                    // تنبيه المستخدم والانتقال للعنصر
                    const lang = systemConfig.language;
                    const msg = lang === 'ar' ? `هذا المنتج موجود مسبقاً: "${product.name}". تم زيادة الكمية والانتقال إليه.` : 
                                 lang === 'en' ? `Product already in cart: "${product.name}". Quantity updated and scrolled to item.` : 
                                     `Ce produit est déjà dans le panier : "${product.name}". Quantité mise à jour.`;
                    
                    showToast(msg);

                    const row = document.getElementById(`cart-row-${cartIndex}`);
                    if (row) {
                        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        row.style.backgroundColor = 'var(--accent-hover)'; // تمييز مؤقت
                        setTimeout(() => row.style.backgroundColor = '', 2000);
                    }
                } else {
                    cart.push({
                        product: product,
                        qty: 1,
                        price: product.salePrice
                    });
                    document.getElementById('codebar').value = "";
                    renderCartTable(); 
                    // التمرير التلقائي لآخر منتج مدخل عند الإضافة لأول مرة
                    const tbody = document.getElementById('table-order-items');
                    tbody.scrollTop = tbody.scrollHeight;
                }
                document.getElementById('codebar').focus();
            } else {
                //tttttttttttttttttttttttttttttt
                alert("لم يتم العثور على أي منتج يطابق الكود أو الاسم المدخل.");
                document.getElementById('codebar').value = "";
                document.getElementById('codebar').focus(); 
            }
        }

        // تسهيل إضافة المبيعات بالضغط على Enter في حقل الباركود
        document.getElementById("codebar").addEventListener("keydown", function(event) {
            if (event.key === "Enter") { 
                addItemToCartFromInput();
            }
        });

        // تسهيل إضافة الشاحنات بالضغط على Enter في حقل الباركود الخاص بها
        document.addEventListener("keydown", function(event) {
            if (event.target.id === "truck-barcode-input" && event.key === "Enter") {
                addItemToTruckLoad();
            }
        });

        function changeCartItemQty(index, newQty) {
            const item = cart[index];
            const parsedQty = parseInt(newQty);
            if (isNaN(parsedQty) || parsedQty <= 0) {
                removeFromCart(index);
                return;
            }
            if (parsedQty > item.product.qty) {
                
                const lang = systemConfig.language;
                const msg = lang === 'ar' ? 'الكمية المدخلة تتجاوز الكمية المتاحة بالمخزن!' : 
                            lang === 'en' ? 'The entered quantity exceeds the available stock!' : 
                            'La quantité saisie dépasse le stock disponible !';

                alert(msg);
                item.qty = item.product.qty;
            } else {
                item.qty = parsedQty;
            }
            renderCartTable();
        }

        function changeCartItemPrice(index, newPrice) {
            const item = cart[index];
            const parsedPrice = parseFloat(newPrice);
            if (isNaN(parsedPrice) || parsedPrice < 0) {
                item.price = item.product.salePrice;
            } else {
                item.price = parsedPrice;
            }
            renderCartTable();
        }

        function removeFromCart(index) {
            cart.splice(index, 1);
            renderCartTable();
        }

        function clearCart() {
            if (cart.length === 0) return;
            const lang = systemConfig.language;
            const msg = lang === 'ar' ? 'هل أنت متأكد من رغبتك في إفراغ سلة المشتريات؟' : 
                         lang === 'en' ? 'Are you sure you want to clear the shopping cart?' : 
                         'Êtes-vous sûr de vouloir vider le panier ?';
            if (confirm(msg)) {
                cart = [];
                renderCartTable();
            }
        }

        function renderCartTable() {
            const tbody = document.getElementById('table-order-items');
            tbody.innerHTML = "";
            let grandTotal = 0;

            const lang = systemConfig.language;
            const emptyMsg = lang === 'ar' ? 'سلة المشتريات فارغة، يرجى تمرير منتج...' : 
                             lang === 'en' ? 'Shopping cart is empty, please scan a product...' : 
                             'Le panier est vide, veuillez scanner un produit...';

            cart.forEach((item, index) => {
                const totalItemPrice = item.qty * item.price;
                grandTotal += totalItemPrice;

                tbody.innerHTML += `
                    <div class="table-row-custom" id="cart-row-${index}">
                        <div>${item.product.barcode}</div>
                        <div>${item.product.name}</div>
                        <div>
                            <input type="number" step="0.01" value="${item.price}" 
                            style="width: 80px; text-align: center; border: 1px solid var(--border-color); border-radius: 4px; background-color: var(--input-bg); color: var(--input-text);"
                            onchange="changeCartItemPrice(${index}, this.value)">
                        </div>
                        <div>
                            <input type="number" value="${item.qty}" min="1" max="${item.product.qty}" 
                            style="width: 60px; text-align: center; border: 1px solid var(--border-color); border-radius: 4px; background-color: var(--input-bg); color: var(--input-text);"
                            onchange="changeCartItemQty(${index}, this.value)">
                        </div>
                        <div style="font-weight: bold; color: var(--dark-blue);">${totalItemPrice.toFixed(2)} ${systemConfig.currency}</div>
                        <div style="flex: 0.5;">
                            <button onclick="removeFromCart(${index})" style="color: #ef4444; font-size: 14px;">❌</button>
                        </div>
                    </div>
                    `
            });


            if (cart.length === 0) {
                tbody.innerHTML = `<div style="text-align: center; padding: 20px; color: #94a3b8;" class="Empty-Cart">${emptyMsg}</div>`;
            }

            document.getElementById('Totalinorder').innerText = `${grandTotal.toFixed(2)} ${systemConfig.currency}`;
        }

        // --- معاينة الفاتورة وحساب النقدية المحصلة والرد ---
        function renderInvoicePreview() {
            const container = document.getElementById('table-invoice-preview');
            container.innerHTML = "";
            let total = 0;

            const lang = systemConfig.language;
            const emptyInvMsg = lang === 'ar' ? 'لا توجد مواد بالطلب لمعاينتها بفاتورة البيع.' : 
                                lang === 'en' ? 'No items in the order to preview in the invoice.' : 
                                'Aucun article dans la commande à prévisualiser dans la facture.';

            cart.forEach((item, index) => {
                const subTotal = item.qty * item.price;
                total += subTotal;

                container.innerHTML += `
                    <div class="table-row-custom">
                        <div>${index + 1}</div>
                        <div>${item.product.name}</div>
                        <div>${item.price.toFixed(2)}</div>
                        <div>${item.qty}</div>
                        <div style="font-weight: bold;">${subTotal.toFixed(2)}</div>
                    </div>
                `;
            });

            if (cart.length === 0) {
                container.innerHTML = `<div style="text-align: center; padding: 20px; color: #94a3b8;" class="Empty-Invoice">${emptyInvMsg}</div>`;
            }

            document.getElementById('Totalininvoice').innerText = `${total.toFixed(2)} ${systemConfig.currency}`;
            document.getElementById('invoice-paid').value = total.toFixed(2);
            calculateInvoiceChange();
        }

        function calculateInvoiceChange() {
            const grandTotalText = document.getElementById('Totalininvoice').innerText;
            const total = parseFloat(grandTotalText) || 0;
            const paid = parseFloat(document.getElementById('invoice-paid').value) || 0;

            const change = paid - total;
            document.getElementById('invoice-change').value = `${change.toFixed(2)} ${systemConfig.currency}`;
        }

        // إكمال بيع الفاتورة وتحديث المخازن
        function finalizeInvoiceSale() {
            if (cart.length === 0) {
                // /ttttttttttttttttttttttttttt
                alert("السلة فارغة حالياً، لا توجد مبيعات لتسجيلها!");
                return;
            }

            // إضافة رسالة تأكيد قبل الحفظ والتدوين
            const lang = systemConfig.language;
            const confirmMsg = lang === 'ar' ? 'هل أنت متأكد من إنهاء وتدوين هذه العملية؟' : 
                              lang === 'en' ? 'Are you sure you want to finalize and record this sale?' : 
                              'Êtes-vous sûr de vouloir finaliser et enregistrer cette vente ?';
            
            if (!confirm(confirmMsg)) return;

            const paid = parseFloat(document.getElementById('invoice-paid').value) || 0;
            const grandTotalText = document.getElementById('Totalininvoice').innerText;
            const total = parseFloat(grandTotalText) || 0;

            // if (paid < total) {
            //     alert("المبلغ المدفوع أقل من قيمة الفاتورة الكلية!");
            //     return;
            // }

            const clientNameInput = document.getElementById('invoice-customer-name').value.trim();
            const clientName = clientNameInput || `عميل محلي - نقدي`;

            // 1. تحديث مستمر لكمية المنتجات في قاعدة البيانات
            cart.forEach(item => {
                const pIndex = products.findIndex(p => p.id === item.product.id);
                if (pIndex > -1) {
                    products[pIndex].qty -= item.qty;
                }
            });

            // 2. تدوين الفاتورة كعملية بيع حقيقية
            const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
            const newSale = {
                id: invoiceId,
                clientName: clientName,
                dateTime: new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now(),
                itemsCount: cart.length,
                total: total,
                paid: paid,
                items: JSON.parse(JSON.stringify(cart)) // حفظ نسخة من المنتجات في الفاتورة
            };

            sales.push(newSale);
            saveDatabase();
            
            const currentInvoiceId = invoiceId;

            // تنظيف السلة والتنبيه
            cart = [];
            document.getElementById('invoice-customer-name').value = "";

            // إظهار نافذة الفاتورة فقط بعد البيع دون طباعة تلقائية
            viewInvoiceDetails(currentInvoiceId, false);
        }

        // --- مراقبة المخزون وإدارة المواد وتنبيه الحد الآمن (Stock & Low Stock) ---
        function renderStockTables() {
            const stockBody = document.getElementById('stock-table-body');
            const lowStockBody = document.getElementById('low-stock-table-body');

            stockBody.innerHTML = "";
            lowStockBody.innerHTML = "";

            let hasLowStock = false;
            const lang = systemConfig.language;
            const unit = lang === 'ar' ? 'منتوج' : lang === 'en' ? 'Units' : 'Unités';

            let rowsHTML1 = "";
            let rowsHTML2 = "";
            products.forEach(p => {
                // جدول المخزون الكامل
                 rowsHTML1+= `
                    <div class="table-row-custom">
                        <div>${p.barcode}</div>
                        <div style="font-weight: bold;">${p.name}</div>
                        <div>${p.category}</div>
                        <div style="font-weight: bold; color: ${p.qty <= p.minLimit ? '#ef4444' : 'inherit'}">${p.qty} ${unit}</div>
                        <div>${p.entryPrice.toFixed(2)} ${systemConfig.currency}</div>
                        <div style="font-weight: bold; color: var(--dark-blue);">${p.salePrice.toFixed(2)} ${systemConfig.currency}</div>
                    </div>
                `;

                // جدول المخزون المنخفض
                if (p.qty <= p.minLimit) {
                    hasLowStock = true;
                     rowsHTML2+= `
                        <div class="table-row-custom" style="background-color: #fff5f5;">
                            <div>${p.barcode}</div>
                            <div style="font-weight: bold; color: #b91c1c;">${p.name}</div>
                            <div>${p.category}</div>
                            <div style="font-weight: bold; color: #ef4444;">${p.qty} ${unit} (${lang === 'ar' ? 'الآمن' : 'Safe'}: ${p.minLimit})</div>
                            <div style="font-weight: bold;">${p.salePrice.toFixed(2)} ${systemConfig.currency}</div>
                        </div>
                    `;
                }
            });
            stockBody.innerHTML = rowsHTML1; 
            lowStockBody.innerHTML = rowsHTML2; 

            if (!hasLowStock) {
                lowStockBody.innerHTML = `<div style="text-align: center; padding: 15px; color: #22c55e;" class="Stock-Safe">المخزون ممتاز! جميع المنتجات فوق الحد الأدنى المسموح به.</div>`;
            }
        }

        // --- إدارة صفحة المنتجات والإنشاء المباشر (Products CRUD) ---
        function renderProductsTab() {
            const tbody = document.getElementById('products-tab-body');
            const searchQuery = document.getElementById('product-search-input').value.trim().toLowerCase();
            tbody.innerHTML = "";

            const filtered = products.filter(p => 
                p.name.toLowerCase().includes(searchQuery) || 
                p.barcode.includes(searchQuery) ||
                p.category.toLowerCase().includes(searchQuery)
            );

            const lang = systemConfig.language;
            const btnEdit = lang === 'ar' ? 'تعديل' : lang === 'en' ? 'Edit' : 'Modifier';
            const btnDelete = lang === 'ar' ? 'حذف' : lang === 'en' ? 'Delete' : 'Supprimer';

            let rowsHTML = "";
            filtered.forEach(p => {
                rowsHTML+= `
                            <div class="table-row-custom">
                                <div>${p.barcode}</div>
                                <div style="font-weight: bold;">${p.name}</div>
                                <div>${p.category}</div>
                                <div style="font-weight: bold;">${p.qty}</div>
                                <div>${p.entryPrice.toFixed(2)}</div>
                                <div style="font-weight: bold; color: var(--dark-blue);">${p.salePrice.toFixed(2)}</div>
                                <div style="flex: 0.5; gap: 2px; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 2px 0;">
                                    <button class="action-btn" onclick="editProduct(${p.id})" title="${btnEdit}" style="width: 100%;">✏️ ${btnEdit}</button>
                                    <button class="action-btn" onclick="deleteProduct(${p.id})" title="${btnDelete}" style="width: 100%;">🗑️ ${btnDelete}</button>
                                </div>
                            </div>
                `;
                
                
            }); 
            tbody.innerHTML += rowsHTML;


            if (filtered.length === 0) {
                tbody.innerHTML = `<div style="text-align: center; padding: 25px; color: #94a3b8;" class="No-Search-Results">${noProductsMsg}</div>`;
            }
        }

        function printProductsReport() {
            const tbody = document.getElementById('products-print-body');
            tbody.innerHTML = "";
            
            let rowsHTML = "";
            products.forEach(p => {
                rowsHTML+= `
                    <div class="table-row-custom">
                        <div>${p.barcode}</div>
                        <div style="font-weight: bold;">${p.name}</div>
                        <div>${p.category}</div>
                        <div>${p.qty}</div>
                        <div>${p.entryPrice.toFixed(2)}</div>
                        <div style="font-weight: bold;">${p.salePrice.toFixed(2)}</div>
                    </div>
                `;
            });
            tbody.innerHTML = rowsHTML;

            const modal = document.getElementById('modal-products-print');
            modal.style.display = "flex";
            applyLanguageConfig(); // لتحديث العناوين داخل نافذة الطباعة
        }

        // فتح نافذة الإضافة أو التعديل
        function openProductModal() {
            const lang = systemConfig.language;
            const title = lang === 'ar' ? 'إضافة منتج جديد' : lang === 'en' ? 'Add New Product' : 'Nouveau Produit';
            
            document.getElementById('modal-product-title').innerText = title;
            document.getElementById('modal-product-id').value = "";
            document.getElementById('modal-product-barcode').value = "";
            document.getElementById('modal-product-name').value = "";
            document.getElementById('modal-product-category').value = "";
            document.getElementById('modal-product-qty').value = "0";
            document.getElementById('modal-product-entry-price').value = "0";
            document.getElementById('modal-product-sale-price').value = "0";
            document.getElementById('modal-product-min-limit').value = "10";
            
            document.getElementById('modal-product').style.display = "flex";
        }

        function closeModal(id) {
            document.getElementById(id).style.display = "none";
        }

        function editProduct(id) {
            const p = products.find(prod => prod.id === id);
            if (!p) return;
            
            const lang = systemConfig.language;
            const title = lang === 'ar' ? 'تعديل تفاصيل المنتج' : lang === 'en' ? 'Edit Product Details' : 'Modifier les détails du produit';

            document.getElementById('modal-product-title').innerText = title;
            document.getElementById('modal-product-id').value = p.id;
            document.getElementById('modal-product-barcode').value = p.barcode;
            document.getElementById('modal-product-name').value = p.name;
            document.getElementById('modal-product-category').value = p.category;
            document.getElementById('modal-product-qty').value = p.qty;
            document.getElementById('modal-product-entry-price').value = p.entryPrice;
            document.getElementById('modal-product-sale-price').value = p.salePrice;
            document.getElementById('modal-product-min-limit').value = p.minLimit;

            document.getElementById('modal-product').style.display = "flex";
        }

        function saveProductData(stayOpen = false) {
            const id = document.getElementById('modal-product-id').value;
            const barcode = document.getElementById('modal-product-barcode').value.trim();
            const name = document.getElementById('modal-product-name').value.trim();
            const category = document.getElementById('modal-product-category').value.trim();
            const qty = parseInt(document.getElementById('modal-product-qty').value) || 0;
            const entryPrice = parseFloat(document.getElementById('modal-product-entry-price').value) || 0;
            const salePrice = parseFloat(document.getElementById('modal-product-sale-price').value) || 0;
            const minLimit = parseInt(document.getElementById('modal-product-min-limit').value) || 10;

            if (barcode === "" || name === "") {
                alert("يرجى ملء الباركود واسم المنتج كشرط أساسي!");
                return;
            }

            // التحقق من تكرار الباركود لمنتج آخر
            const duplicate = products.find(p => p.barcode === barcode && p.id !== parseInt(id));
            if (duplicate) {
                alert(`رقم الباركود "${barcode}" مسجل مسبقاً لمنتج آخر وهو: ${duplicate.name}`);
                return;
            }

            if (id) {
                // تعديل منتج قائم
                const idx = products.findIndex(p => p.id === parseInt(id));
                if (idx > -1) {
                    products[idx] = { id: parseInt(id), barcode, name, category, qty, entryPrice, salePrice, minLimit };
                }
            } else {
                // إضافة جديد
                const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
                products.push({ id: newId, barcode, name, category, qty, entryPrice, salePrice, minLimit });
            }

            saveDatabase();
            renderProductsTab();

            if (stayOpen) {
                // تفريغ الحقول لإضافة منتج جديد مع الإبقاء على الفئة (Category) لتسهيل العمل
                document.getElementById('modal-product-id').value = "";
                document.getElementById('modal-product-barcode').value = "";
                document.getElementById('modal-product-name').value = "";
                document.getElementById('modal-product-qty').value = "0";
                document.getElementById('modal-product-entry-price').value = "0";
                document.getElementById('modal-product-sale-price').value = "0";
                document.getElementById('modal-product-min-limit').value = "10";
                
                // إعادة التركيز على حقل الباركود للمنتج التالي
                document.getElementById('modal-product-barcode').focus();
            } else {
                closeModal('modal-product');
            }
        }

        function deleteProduct(id) {
            if (confirm("هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً من قاعدة البيانات والمخازن؟")) {
                
                products = products.filter(p => p.id !== id);
                saveDatabase();
                renderProductsTab();
            }
        }

        // --- التقارير والتحليلات المالية والرسوم البيانية (Reports) ---
        function renderFinancialReports() {
            let capitalCost = 0;
            let expectedTotalRev = 0;
            let actualSalesRev = 0;

            products.forEach(p => {
                capitalCost += (p.qty * p.entryPrice);
                expectedTotalRev += (p.qty * p.salePrice);
            });

            sales.forEach(s => {
                actualSalesRev += s.total;
            });

            trucks.forEach(t => {
                const netValue = t.val * (1 - (t.returned / (t.qty || 1)));
                actualSalesRev += netValue;
            });

            let expectedProfit = expectedTotalRev - capitalCost;

            document.getElementById('report-capital').innerText = capitalCost.toFixed(2);
            document.getElementById('report-expected-profit').innerText = expectedProfit.toFixed(2);
            document.getElementById('report-sales-revenue').innerText = actualSalesRev.toFixed(2);

            // إنشاء مخطط بياني بسيط لحجم المبيعات حسب الأيام الأخيرة
            const chartContainer = document.getElementById('report-bar-chart');
            chartContainer.innerHTML = "";

            const lang = systemConfig.language;
            let days = [];
            if (lang === 'ar') days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
            else if (lang === 'en') days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            else days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

            const now = new Date();
            
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(now.getDate() - i);
                const dayName = days[d.getDay()];
                const dateString = d.toLocaleDateString('en-GB');

                // حساب مبيعات هذا اليوم الفعلي من السجل
                let dailyTotal = 0;
                sales.forEach(s => {
                    if (s.dateTime.includes(dateString)) {
                        dailyTotal += s.total;
                    }
                });

                // حساب الارتفاع المئوي للمخطط
                const maxChartScale = Math.max(actualSalesRev, 5000) || 5000;
                const columnHeightPercent = Math.min((dailyTotal / maxChartScale) * 100, 100);

                chartContainer.innerHTML += `
                    <div class="bar-chart-column">
                        <span style="font-size: 8px; font-weight: bold; margin-bottom: 2px;">${dailyTotal.toFixed(0)}</span>
                        <div class="bar-chart-fill" style="height: ${columnHeightPercent.toFixed(0)}px;"></div>
                        <span class="bar-chart-label">${dayName}</span>
                    </div>
                `;
            }
        }

        // --- سجلات العملاء وحركات البيع (Customers & Printing) ---
        function renderCustomersTab() {
            const tbody = document.getElementById('customers-tab-body');
            const searchVal = document.getElementById('customer-search-input').value.trim().toLowerCase();
            tbody.innerHTML = "";

            const filtered = sales.filter(s => 
                s.id.toLowerCase().includes(searchVal) || 
                s.clientName.toLowerCase().includes(searchVal)
            );

            const lang = systemConfig.language;
            const btnView = lang === 'ar' ? 'معاينة' : lang === 'en' ? 'View' : 'Voir';
            const btnEdit = lang === 'ar' ? 'تعديل' : lang === 'en' ? 'Edit' : 'Modifier';
            const btnDelete = lang === 'ar' ? 'حذف' : lang === 'en' ? 'Delete' : 'Supprimer';
            const unit = lang === 'ar' ? 'منتوج' : lang === 'en' ? 'Units' : 'Unités';

            const noInvoicesMsg = lang === 'ar' ? 'لا يوجد أي فواتير بيع مسجلة حالياً.' : 
                                  lang === 'en' ? 'No invoices recorded currently.' : 
                                  'Aucune facture enregistrée actuellement.';

            filtered.forEach(s => {
                tbody.innerHTML += `
                    <div class="table-row-custom">
                        <div style="font-weight: bold; color: var(--dark-blue);">${s.id}</div>
                        <div>${s.clientName}</div>
                        <div style="font-size: 11px;">${s.dateTime}</div>
                        <div>${s.itemsCount} ${unit}</div>
                        <div style="font-weight: bold;">${s.total.toFixed(2)} ${systemConfig.currency}</div>
                        <div style="color: #22c55e; font-weight: bold;">${s.paid.toFixed(2)} ${systemConfig.currency}</div>
                        <div style="flex: 0.5; gap: 2px; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 2px 0;">
                            <button class="action-btn" onclick="viewInvoiceDetails('${s.id}')" title="${btnView}" style="width: 100%;">👁️ ${btnView}</button>
                            <button class="action-btn" onclick="openEditInvoiceModal('${s.id}')" title="${btnEdit}" style="width: 100%;">✏️ ${btnEdit}</button>
                            <button class="action-btn" onclick="deleteInvoice('${s.id}')" title="${btnDelete}" style="width: 100%;">🗑️ ${btnDelete}</button>
                        </div>
                    </div>
                `;
            });

            if (filtered.length === 0) {
                tbody.innerHTML = `<div style="text-align: center; padding: 25px; color: #94a3b8;" class="No-Invoices">${noInvoicesMsg}</div>`;
            }
        }

        function openEditInvoiceModal(saleId) {
            const sale = sales.find(s => s.id === saleId);
            if (!sale) return;
            
            document.getElementById('edit-invoice-id').value = sale.id;
            document.getElementById('edit-invoice-client').value = sale.clientName;
            document.getElementById('edit-invoice-date').value = sale.dateTime;
            document.getElementById('edit-invoice-total').value = sale.total;
            document.getElementById('edit-invoice-paid').value = sale.paid;
            
            document.getElementById('modal-edit-invoice').style.display = "flex";
        }

        function saveInvoiceEdit() {
            const id = document.getElementById('edit-invoice-id').value;
            const sale = sales.find(s => s.id === id);
            if (!sale) return;

            sale.clientName = document.getElementById('edit-invoice-client').value.trim();
            sale.dateTime = document.getElementById('edit-invoice-date').value.trim();
            sale.total = parseFloat(document.getElementById('edit-invoice-total').value) || 0;
            sale.paid = parseFloat(document.getElementById('edit-invoice-paid').value) || 0;

            saveDatabase();
            closeModal('modal-edit-invoice');
            renderCustomersTab();
        }

        function deleteInvoice(id) {
            const textconfirm = systemConfig.language === 'ar' ? "هل أنت متأكد من رغبتك في حذف هذه الفاتورة نهائياً من سجل المبيعات؟" : 
                                systemConfig.language === 'en' ? "Are you sure you want to permanently delete this invoice from the sales record?" : 
                                                        "Êtes-vous sûr de vouloir supprimer définitivement cette facture de l'historique des ventes ?";

            const textconfirmsave = systemConfig.language === 'ar' ? "هل تريد حفظ الرصيد النقدية المحصلة من هذه الفاتورة قبل الحذف؟" : 
                                    systemConfig.language === 'en' ? "Do you want to save the cash collected from this invoice before deletion?" : 
                                                                "Voulez-vous enregistrer l'argent collecté de cette facture avant la suppression ?";
            
            if(sales.find(s => s.id === id).paid < sales.find(s => s.id === id).total) {
                const msg = systemConfig.language === 'ar' ? "المبلغ المحصل من هذه الفاتورة أقل من إجمالي الفاتورة." : 
                            systemConfig.language === 'en' ? "The amount collected from this invoice is less than the total invoice amount." : 
                                                        "Le montant collecté de cette facture est inférieur au montant total de la facture.";
                alert(msg);
            }
            
            if (confirm(textconfirm) ) {
                if(confirm(textconfirmsave)) {
                    totalsales += sales.find(s => s.id === id).paid; 
                }
                // alert(totalsales);
                sales = sales.filter(s => s.id !== id);
                saveDatabase();
                renderCustomersTab();
            }
        }

        function viewInvoiceDetails(saleId, autoPrint = false) {
            const sale = sales.find(s => s.id === saleId);
            if (!sale) return;
            selectedInvoiceForView = sale;

            const lang = systemConfig.language;
            const lblInvoice = lang === 'ar' ? 'فاتورة رقم' : lang === 'en' ? 'Invoice No' : 'Facture N°';
            const lblClient = lang === 'ar' ? 'العميل' : lang === 'en' ? 'Customer' : 'Client';
            const lblDate = lang === 'ar' ? 'التاريخ' : lang === 'en' ? 'Date' : 'Date';
            const lblPaid = lang === 'ar' ? 'المبلغ المدفوع' : lang === 'en' ? 'Amount Paid' : 'Montant Payé';
            const lblTotal = lang === 'ar' ? 'الإجمالي' : lang === 'en' ? 'Total' : 'Total';

            document.getElementById('detail-invoice-id').innerText = `${lblInvoice}: ${sale.id}`;
            document.getElementById('invoice-info-header').innerHTML = `
                <div><strong>${lblClient}:</strong> ${sale.clientName}</div>
                <div><strong>${lblDate}:</strong> ${sale.dateTime}</div>
                <div><strong>${lblPaid}:</strong> ${sale.paid.toFixed(2)} ${systemConfig.currency}</div>
                <div><strong>${lblTotal}:</strong> ${sale.total.toFixed(2)} ${systemConfig.currency}</div>
                
            `;

            const tbody = document.getElementById('invoice-details-body');
            tbody.innerHTML = "";
            if(sale.items) {
                sale.items.forEach(item => {
                    const itemPrice = item.price !== undefined ? item.price : item.product.salePrice;
                    tbody.innerHTML += `
                        <div class="table-row-custom">
                            <div style="flex: 2;">${item.product.name}</div>
                            <div>${itemPrice.toFixed(2)}</div>
                            <div>${item.qty}</div>
                            <div style="font-weight: bold;">${(item.qty * itemPrice).toFixed(2)}</div>
                        </div>
                    `;
                });
            }

            document.getElementById('detail-invoice-total-display').innerText = `${sale.total.toFixed(2)} ${systemConfig.currency}`;

            document.getElementById('modal-invoice-details').style.display = "flex";

            // ضبط نوع الطباعة بناءً على الإعدادات المحفوظة
            document.getElementById('invoice-print-type').value = systemConfig.printType || 'sheet';

            // إذا تم تفعيل الطباعة التلقائية (بعد البيع مباشرة)
            if (autoPrint) {
                setTimeout(() => { window.print(); }, 500);
            }
        }

        function printSingleInvoice() {
            // البحث عن النافذة المنبثقة المفتوحة حالياً بدقة أكبر
            const allModals = document.querySelectorAll('.printable-modal');
            let activeModal = null;
            allModals.forEach(m => {
                if (window.getComputedStyle(m).display !== 'none') {
                    activeModal = m;
                }
            });

            if (activeModal) {
                // جلب خيار الطباعة المختار أو استخدام الافتراضي من النظام
                let printType = systemConfig.printType || 'sheet';
                
                if (activeModal.id === 'modal-invoice-details') {
                    printType = document.getElementById('invoice-print-type').value;
                } else if (activeModal.id === 'modal-truck-details') {
                    printType = document.getElementById('truck-print-type').value;
                }

                // إزالة أي أوضاع سابقة وإضافة الوضع المختار
                activeModal.classList.remove('strip-mode', 'a5-mode');
                if (printType === 'strip') activeModal.classList.add('strip-mode');
                if (printType === 'a5') activeModal.classList.add('a5-mode');

                activeModal.classList.add('show-print');
                window.print();
                // لا نحتاج لإزالة الفئات فوراً لأن المتصفح يحتاج وقت للمعالجة
            } else {
                window.print();
            }
        }

        // --- مراقبة حركات الشاحنات والتوزيع (Trucks System) ---
        function renderTrucksTab() {
            const tbody = document.getElementById('trucks-tab-body');
            const searchVal = document.getElementById('truck-search-input').value.trim().toLowerCase();
            tbody.innerHTML = "";

            const filtered = trucks.filter(t => 
                t.truckNum.toLowerCase().includes(searchVal) || 
                t.driver.toLowerCase().includes(searchVal)
            );

            const lang = systemConfig.language;
            const btnView = lang === 'ar' ? 'معاينة' : lang === 'en' ? 'View' : 'Voir';
            const btnEdit = lang === 'ar' ? 'تعديل' : lang === 'en' ? 'Edit' : 'Modifier';
            const btnDelete = lang === 'ar' ? 'حذف' : lang === 'en' ? 'Delete' : 'Supprimer';
            const unit = lang === 'ar' ? 'منتوج' : lang === 'en' ? 'Units' : 'Unités';

            filtered.forEach(t => {
                const netVal = t.val * (1 - (t.returned / (t.qty || 1)));
                tbody.innerHTML += `
                    <div class="table-row-custom">
                        <div style="font-weight: bold; color: var(--dark-blue);">${t.truckNum}</div>
                        <div>${t.driver}</div>
                        <div style="font-size: 11px;">${t.dateTime || '-'}</div>
                        <div><span class="badge-custom" style="background-color: #3b82f6;">${t.qty} ${unit}</span></div>
                        <div><span class="badge-custom" style="background-color: ${t.returned > 0 ? '#f87171' : '#94a3b8'};">${t.returned} ${unit}</span></div>
                        <div style="font-weight: bold; color: #059669;">${netVal.toFixed(2)} ${systemConfig.currency}</div>
                        <div style="flex: 0.5; gap: 2px; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 2px 0;">
                            <button class="action-btn" onclick="viewTruckDetails(${t.id})" title="${btnView}" style="width: 100%;">👁️ ${btnView}</button>
                            <button class="action-btn" onclick="editTruck(${t.id})" title="${btnEdit}" style="width: 100%;">✏️ ${btnEdit}</button>
                            <button class="action-btn" onclick="deleteTruck(${t.id})" title="${btnDelete}" style="width: 100%;">🗑️ ${btnDelete}</button>
                        </div>
                    </div>
                `;
            });

            if (filtered.length === 0) {
                tbody.innerHTML = `<div style="text-align: center; padding: 25px; color: #94a3b8;" class="No-Trucks">${noTrucksMsg}</div>`;
            }
        }

        function viewTruckDetails(truckId) {
            const truck = trucks.find(t => t.id === truckId);
            if (!truck) return;

            const soldQty = truck.qty - truck.returned;
            const netValue = truck.val * (1 - (truck.returned / (truck.qty || 1)));

            const lang = systemConfig.language;
            const lblDriver = lang === 'ar' ? 'اسم السائق' : lang === 'en' ? 'Driver Name' : 'Nom du Chauffeur';
            const lblDate = lang === 'ar' ? 'التاريخ' : lang === 'en' ? 'Date' : 'Date';
            const lblTotalLoad = lang === 'ar' ? 'الحمولة الكلية' : lang === 'en' ? 'Total Load' : 'Charge Totale';
            const lblReturned = lang === 'ar' ? 'الكمية المرتجعة' : lang === 'en' ? 'Returned Qty' : 'Quantité Retournée';
            const lblSold = lang === 'ar' ? 'الكمية المباعة' : lang === 'en' ? 'Quantité Vendue' : 'Quantité Vendue';
            const lblTotalVal = lang === 'ar' ? 'القيمة الإجمالية' : lang === 'en' ? 'Total Value' : 'Valeur Totale';
            const lblDetails = lang === 'ar' ? 'تفاصيل الحمولة' : lang === 'en' ? 'Load Details' : 'Détails de la charge';
            const lblNote = lang === 'ar' ? 'تم حساب الصافي بناءً على نسبة المرتجع من القيمة المالية الكلية.' : 
                           lang === 'en' ? 'Net calculated based on the return percentage of the total financial value.' : 
                           'Net calculé sur la base du pourcentage de retour de la valeur financière totale.';

            let itemsHtml = "";
            if (truck.items && truck.items.length > 0) {
                itemsHtml = `<div style="margin-top: 15px; font-size: 11px; border: 1px solid var(--border-color); border-radius: 5px; padding: 10px; background: var(--container-bg);">
                    <div style="font-weight: bold; border-bottom: 1px solid var(--border-color); margin-bottom: 5px;">${lblDetails}:</div>`;
                truck.items.forEach(it => {
                    itemsHtml += `<div style="display: flex; justify-content: space-between;"><span>${it.name} (x${it.qty})</span><span>${(it.qty * it.price).toFixed(2)}</span></div>`;
                });
                itemsHtml += `</div>`;
            }

            const lblTruck = lang === 'ar' ? 'شاحنة' : lang === 'en' ? 'Truck' : 'Camion';
            document.getElementById('detail-truck-title').innerText = `${lblTruck}: ${truck.truckNum}`;
            document.getElementById('truck-info-content').innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div><strong>${lblDriver}:</strong> ${truck.driver}</div>
                    <div><strong>${lblDate}:</strong> ${truck.dateTime || '-'}</div>
                    <div><strong>${lblTotalLoad}:</strong> ${truck.qty}</div>
                    <div><strong>${lblReturned}:</strong> ${truck.returned}</div>
                    <div><strong>${lblSold}:</strong> ${soldQty}</div>
                    <div><strong>${lblTotalVal}:</strong> ${truck.val.toFixed(2)} ${systemConfig.currency}</div>
                </div>
                ${itemsHtml}
                <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 15px 0;">
                <div style="text-align: center; font-style: italic; font-size: 12px; color: var(--text-color);">
                    ${lblNote}
                </div>
            `;
            document.getElementById('truck-final-value').innerText = `${netValue.toFixed(2)} ${systemConfig.currency}`;

            document.getElementById('modal-truck-details').style.display = "flex";
            
            // ضبط نوع الطباعة بناءً على الإعدادات المحفوظة
            document.getElementById('truck-print-type').value = systemConfig.printType || 'sheet';
        }

        function populateTruckProductSelect() {
            const datalist = document.getElementById('truck-products-datalist');
            if (!datalist) return;
            datalist.innerHTML = '';
            products.forEach(p => {
                datalist.innerHTML += `<option value="${p.name}">`;
            });
        }

        function updateTruckModalTotals() {
            const totalVal = tempTruckItems.reduce((sum, item) => sum + (item.qty * item.price), 0);
            document.getElementById('modal-truck-qty').value = tempTruckItems.length;
            document.getElementById('modal-truck-val').value = totalVal.toFixed(2);
        }

        function changeTruckItemPrice(index, newPrice) {
            const parsedPrice = parseFloat(newPrice);
            if (!isNaN(parsedPrice) && parsedPrice >= 0) {
                tempTruckItems[index].price = parsedPrice;
                updateTruckModalTotals();
                renderTruckItemsHelper();
            }
        }

        function addItemToTruckLoad() {
            const barcodeVal = document.getElementById('truck-barcode-input').value.trim();
            const productNameVal = document.getElementById('truck-product-search').value.trim();
            const qty = parseInt(document.getElementById('truck-product-qty').value) || 0;
            
            if (qty <= 0) return;

            let product;
            if (barcodeVal !== "") {
                product = products.find(p => p.barcode === barcodeVal);
                if (!product) {
                    alert("لم يتم العثور على المنتج بهذا الباركود");
                    return;
                }
            } else if (productNameVal !== "") {
                product = products.find(p => p.name === productNameVal);
            }

            if (!product) return;

            // التحقق مما إذا كان المنتج موجوداً مسبقاً لتحديث الكمية أو إضافة صنف جديد
            const existingItem = tempTruckItems.find(item => item.id === product.id);
            if (existingItem) {
                existingItem.qty += qty;
            } else {
                tempTruckItems.push({ id: product.id, name: product.name, price: product.salePrice, qty: qty });
            }

            updateTruckModalTotals();

            document.getElementById('truck-barcode-input').value = "";
            document.getElementById('truck-product-search').value = "";
            renderTruckItemsHelper();
        }

        function renderTruckItemsHelper() {
            const list = document.getElementById('truck-items-list');
            list.innerHTML = "";
            tempTruckItems.forEach((item, index) => {
                list.innerHTML += `<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding: 2px 0;">
                    <span style="flex: 1; text-align: start;">${item.name} (x${item.qty})</span>
                    <input type="number" step="0.01" value="${item.price}" 
                        style="width: 70px; text-align: center; border: 1px solid var(--border-color); border-radius: 4px; background-color: var(--input-bg); color: var(--input-text); margin: 0 5px;"
                        onchange="changeTruckItemPrice(${index}, this.value)">
                    <span style="width: 80px; text-align: center; font-weight: bold;">${(item.qty * item.price).toFixed(2)}</span>
                    <button class="action-btn" onclick="removeItemFromTruckLoad(${index})" style="color: #ef4444; border: none; background: none; padding: 0 5px; font-size: 10px;">❌</button>
                </div>`;
            });
        }

        function removeItemFromTruckLoad(index) {
            // حذف العنصر من المصفوفة المؤقتة
            tempTruckItems.splice(index, 1);
            updateTruckModalTotals();
            renderTruckItemsHelper();
        }

        function openTruckModal() {
            const lang = systemConfig.language;
            const title = lang === 'ar' ? 'تسجيل حركة شاحنة جديدة' : lang === 'en' ? 'Record New Truck Movement' : 'Nouvel Envoi Camion';
            
            document.getElementById('modal-truck-title').innerText = title;
            document.getElementById('modal-truck-id').value = "";
            document.getElementById('modal-truck-num').value = "";
            document.getElementById('modal-truck-driver').value = "";
            document.getElementById('modal-truck-qty').value = "0";
            document.getElementById('modal-truck-return').value = "0";
            document.getElementById('modal-truck-val').value = "0";

            document.getElementById('truck-barcode-input').value = "";
            document.getElementById('truck-product-search').value = "";
            tempTruckItems = [];
            renderTruckItemsHelper();
            populateTruckProductSelect();

            document.getElementById('modal-truck').style.display = "flex";
        }

        function editTruck(id) {
            const t = trucks.find(tru => tru.id === id);
            if (!t) return;

            const lang = systemConfig.language;
            const title = lang === 'ar' ? 'تعديل بيانات حركة الشاحنة' : lang === 'en' ? 'Edit Truck Movement Data' : 'Modifier les données du camion';

            document.getElementById('modal-truck-title').innerText = title;
            document.getElementById('modal-truck-id').value = t.id;
            document.getElementById('modal-truck-num').value = t.truckNum;
            document.getElementById('modal-truck-driver').value = t.driver;
            document.getElementById('modal-truck-qty').value = t.qty;
            document.getElementById('modal-truck-return').value = t.returned;
            document.getElementById('modal-truck-val').value = t.val;

            document.getElementById('truck-barcode-input').value = "";
            document.getElementById('truck-product-search').value = "";
            tempTruckItems = t.items || [];
            renderTruckItemsHelper();
            populateTruckProductSelect();

            document.getElementById('modal-truck').style.display = "flex";
        }

        function saveTruckData() {
            const id = document.getElementById('modal-truck-id').value;
            const truckNum = document.getElementById('modal-truck-num').value.trim();
            const driver = document.getElementById('modal-truck-driver').value.trim();
            const qty = parseInt(document.getElementById('modal-truck-qty').value) || 0;
            const returned = parseInt(document.getElementById('modal-truck-return').value) || 0;
            const val = parseFloat(document.getElementById('modal-truck-val').value) || 0;

            if (truckNum === "" || driver === "") {
                alert("يرجى إدخال رقم تسجيل الشاحنة واسم السائق!");
                return;
            }

            if (id) {
                const idx = trucks.findIndex(t => t.id === parseInt(id));
                if (idx > -1) {
                    const existingDate = trucks[idx].dateTime;
                    trucks[idx] = { id: parseInt(id), truckNum, driver, qty, returned, val, items: tempTruckItems, dateTime: existingDate };
                }
            } else {
                const newId = trucks.length > 0 ? Math.max(...trucks.map(t => t.id)) + 1 : 1;
                trucks.push({ id: newId, truckNum, driver, qty, returned, val, items: tempTruckItems, dateTime: new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) });
            }

            saveDatabase();
            closeModal('modal-truck');
            renderTrucksTab();
        }

        function deleteTruck(id) {
            const textconfirm = systemConfig.language === 'ar' ? "هل أنت متأكد من رغبتك في حذف سجل حركة هذه الشاحنة نهائياً؟" : 
                                systemConfig.language === 'en' ? "Are you sure you want to permanently delete this truck movement record?" : 
                                "Êtes-vous sûr de vouloir supprimer définitivement cet enregistrement de mouvement de camion ?";

            const textconfirmsave = systemConfig.language === 'ar' ? "هل تريد حفظ القيمة المالية الصافية لهذه الحركة قبل الحذف؟" : 
                                systemConfig.language === 'en' ? "Do you want to save the net financial value of this movement before deletion?" : 
                                "Voulez-vous enregistrer la valeur financière nette de ce mouvement avant la suppression ?";
            
            if (confirm(textconfirm)) {
                if(confirm(textconfirmsave)) {
                    totalsales += trucks.find(t => t.id === id).val * (1 - (trucks.find(t => t.id === id).returned / (trucks.find(t => t.id === id).qty || 1)));
                }

                trucks = trucks.filter(t => t.id !== id);
                saveDatabase();
                renderTrucksTab();
            }
        }

        // --- تهيئة إعدادات النظام وتغيير العملة والمظهر ---
        function updateCurrencyConfig() {
            systemConfig.currency = document.getElementById('currency-select').value;
            saveDatabase();
        }

        function updatePrintConfig() {
            systemConfig.printType = document.getElementById('sys-print-type').value;
            saveDatabase();
        }

        function confirmSaveAccountInfo() {
            const companyName = document.getElementById('sys-company-name').value.trim();
            const username = document.getElementById('sys-username').value.trim();

            if (!companyName || !username) {
                const msg = systemConfig.language === 'ar' ? "يرجى ملء اسم المؤسسة واسم المستخدم!" : "Please fill in Company Name and Username!";
                alert(msg);
                return;
            }

            const confirmMsg = systemConfig.language === 'ar' 
                ? "هل أنت متأكد من تعديل بيانات المؤسسة؟ ستظهر هذه البيانات في كافة الفواتير والتقارير." 
                : "Are you sure you want to modify organization data? This will reflect on all invoices and reports.";

            if (confirm(confirmMsg)) {
                systemConfig.companyName = companyName;
                systemConfig.username = username;
                saveDatabase();
                alert(systemConfig.language === 'ar' ? "تم حفظ البيانات بنجاح." : "Data saved successfully.");
            }
        }

        function handleLogoUpload(event, type) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (type === 'company') {
                        systemConfig.companyLogo = e.target.result;
                    } else if (type === 'profile') {
                        systemConfig.profileLogo = e.target.result;
                    }
                    saveDatabase();
                    updateDashboardStats();
                };
                reader.readAsDataURL(file);
            }
        }

        function removeLogo(type) {
            const lang = systemConfig.language;
            const msg = lang === 'ar' ? 'هل أنت متأكد من حذف هذه الصورة والعودة للوضع الافتراضي؟' : 'Are you sure you want to delete this image and reset to default?';
            if (confirm(msg)) {
                if (type === 'company') {
                    systemConfig.companyLogo = '';
                    document.getElementById('sys-company-logo-input').value = '';
                } else {
                    systemConfig.profileLogo = '';
                    document.getElementById('sys-profile-logo-input').value = '';
                }
                saveDatabase();
                updateDashboardStats();
            }
        }

        function toggleDarkMode() {
            const toggle = document.getElementById('dark-mode-toggle').checked;
            systemConfig.darkMode = toggle;
            if (toggle) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
            saveDatabase();
        }

        // --- نظام دعم اللغات المتعددة المتقدم والتحويل التلقائي للاتجاه (RTL / LTR) ---
        function changeLanguage() {
            systemConfig.language = document.getElementById('Language-select').value;
            saveDatabase();
            applyLanguageConfig();
        }

        function applyLanguageConfig() {
            const lang = systemConfig.language;
            const dir = (lang === 'ar') ? 'rtl' : 'ltr';
            document.body.dir = dir; // تطبيق الاتجاه على الصفحة بالكامل ليشمل النوافذ المنبثقة

            if (lang === 'ar') {
                document.documentElement.lang = 'ar';
                
                // ترجمة العناصر مباشرة
                document.querySelectorAll('.Stock-Price').forEach(e => e.innerText = 'سعر المخزون');
                document.querySelectorAll('.Total-Products').forEach(e => e.innerText = 'إجمالي المنتجات');
                document.querySelectorAll('.Total-Sell').forEach(e => e.innerText = 'إجمالي المبيعات');
                document.querySelectorAll('.Clients').forEach(e => e.innerText = 'العملاء');
                document.querySelectorAll('.Order').forEach(e => e.innerText = 'الطلب الكاشير');
                document.querySelectorAll('.invoice').forEach(e => e.innerText = 'الفاتورة المعاينة');
                document.querySelectorAll('.ID-item').forEach(e => e.innerText = 'معرف المنتج');
                document.querySelectorAll('.Name-item').forEach(e => e.innerText = 'اسم المنتج');
                document.querySelectorAll('.Price').forEach(e => e.innerText = 'سعر البيع');
                document.querySelectorAll('.Quantity').forEach(e => e.innerText = 'الكمية');
                document.querySelectorAll('.Total').forEach(e => e.innerText = 'الإجمالي');
                document.querySelectorAll('.Item-Code').forEach(e => e.innerText = 'كود المنتج / الباركود');
                document.querySelectorAll('.Entry').forEach(e => e.innerText = 'إدخال المنتج');
                document.querySelectorAll('.clear').forEach(e => e.innerText = 'إفراغ السلة');
                document.querySelectorAll('.Number').forEach(e => e.innerText = 'الرقم');
                document.querySelectorAll('.Amount-paid').forEach(e => e.innerText = 'المبلغ المدفوع :');
                document.querySelectorAll('.The-rest').forEach(e => e.innerText = 'الباقي المرتجع :');
                document.querySelectorAll('.Finish').forEach(e => e.innerText = 'إنهاء وتدوين البيع');
                document.querySelectorAll('.Product').forEach(e => e.innerText = 'المنتج');
                document.querySelectorAll('.class').forEach(e => e.innerText = 'الصنف');
                document.querySelectorAll('.amount').forEach(e => e.innerText = 'الكمية');
                document.querySelectorAll('.Entry-price').forEach(e => e.innerText = 'سعر الشراء');
                document.querySelectorAll('.Stock').forEach(e => e.innerText = 'المخزون المتوفر');
                document.querySelectorAll('.Low-Stock').forEach(e => e.innerText = 'المخزون المنخفض (أقل من الحد الآمن)');
                document.querySelectorAll('.Creat-new').forEach(e => e.innerText = 'إضافة منتج جديد');
                document.querySelectorAll('.Search').forEach(e => e.innerText = 'بحث');
                document.querySelectorAll('.Products').forEach(e => e.innerText = 'المنتجات');
                document.querySelectorAll('.Print').forEach(e => e.innerText = 'طباعة التقرير الفوري');
                document.querySelectorAll('.Items-Count-Log').forEach(e => e.innerText = 'عدد المنتجات');
                document.querySelectorAll('.customers').forEach(e => e.innerText = 'سجل المبيعات والعملاء');
                document.querySelectorAll('.invoice-number').forEach(e => e.innerText = 'رقم الفاتورة');
                document.querySelectorAll('.Payment').forEach(e => e.innerText = 'العميل المشتري');
                document.querySelectorAll('.Date-time').forEach(e => e.innerText = 'التاريخ والوقت');
                document.querySelectorAll('.Truck-Monitoring').forEach(e => e.innerText = 'حركات توزيع ومراقبة الشاحنات');
                document.querySelectorAll('.ID-truck').forEach(e => e.innerText = 'رقم الشاحنة');
                document.querySelectorAll('.Return').forEach(e => e.innerText = 'الكمية المرتجعة');
                document.querySelectorAll('.Remaining-value').forEach(e => e.innerText = 'القيمة المحققة للموزع');
                document.querySelectorAll('.system').forEach(e => e.innerText = 'إعدادات النظام العامة');
                document.querySelectorAll('.Modal-Barcode-Label').forEach(e => e.innerText = 'باركود / كود المنتج (فريد)');
                document.querySelectorAll('.Modal-Barcode-Placeholder').forEach(e => e.placeholder = 'أدخل كود بارز...');
                document.querySelectorAll('.Modal-Name-Label').forEach(e => e.innerText = 'اسم المنتج');
                document.querySelectorAll('.Modal-Name-Placeholder').forEach(e => e.placeholder = 'مثال: حليب المراعي');
                document.querySelectorAll('.Modal-Category-Label').forEach(e => e.innerText = 'الفئة / الصنف');
                document.querySelectorAll('.Modal-Category-Placeholder').forEach(e => e.placeholder = 'مثال: مواد غذائية');
                document.querySelectorAll('.Modal-Qty-Label').forEach(e => e.innerText = 'الكمية الحالية المتوفرة');
                document.querySelectorAll('.Modal-Entry-Price-Label').forEach(e => e.innerText = 'سعر شراء المنتج (سعر الدخول)');
                document.querySelectorAll('.Modal-Sale-Price-Label').forEach(e => e.innerText = 'سعر بيع المنتج للمستهلك');
                document.querySelectorAll('.Modal-Min-Limit-Label').forEach(e => e.innerText = 'الحد الأدنى للتنبيه بنفاذ الكمية');
                document.querySelectorAll('.Truck-Num-Label').forEach(e => e.innerText = 'رقم تسجيل الشاحنة');
                document.querySelectorAll('.Truck-Num-Placeholder').forEach(e => e.placeholder = 'مثال: 12345-120-30');
                document.querySelectorAll('.Truck-Driver-Label').forEach(e => e.innerText = 'اسم السائق');
                document.querySelectorAll('.Truck-Driver-Placeholder').forEach(e => e.placeholder = 'مثال: محمد علي');
                document.querySelectorAll('.Truck-Return-Label').forEach(e => e.innerText = 'الكمية المرتجعة');
                document.querySelectorAll('.Truck-Product-Search-Placeholder').forEach(e => e.placeholder = 'اختر منتج...');
                document.querySelectorAll('.The-courrency-used').forEach(e => e.innerText = 'العملة المستخدمة');
                document.querySelectorAll('.Save-Add-Another-Btn').forEach(e => e.innerText = 'حفظ وإضافة آخر');
                document.querySelectorAll('.Language').forEach(e => e.innerText = 'لغة واجهة التطبيق');
                document.querySelectorAll('.Dark-mode').forEach(e => e.innerText = 'المظهر الداكن');
                document.querySelectorAll('.account').forEach(e => e.innerText = 'بيانات الحساب والمؤسسة');
                document.querySelectorAll('.username').forEach(e => e.innerText = 'اسم المستخدم المشرف');
                document.querySelectorAll('.Email').forEach(e => e.innerText = 'البريد الإلكتروني');
                document.querySelectorAll('.password').forEach(e => e.innerText = 'كلمة المرور');
                document.querySelectorAll('.welcome-title').forEach(e => e.innerText = 'مرحباً بك في نظام إدارة المخزون والمبيعات المطور');
                document.querySelectorAll('.welcome-desc').forEach(e => e.innerText = 'اضغط على أي زر من القائمة الجانبية لإدارة الكاشير، المنتجات، التقارير أو الشاحنات.');
                document.querySelectorAll('.financial-reports-title').forEach(e => e.innerText = 'التقارير المالية والرسوم التحليلية');
                document.querySelectorAll('.Stock-Value-Capital').forEach(e => e.innerText = 'إجمالي قيمة رأس المال بالمخزن');
                document.querySelectorAll('.Expected-Profit').forEach(e => e.innerText = 'الأرباح المتوقعة عند بيع المخزون');
                document.querySelectorAll('.Actual-Sales-Revenue').forEach(e => e.innerText = 'عائد المبيعات الفعلي المحقق');
                document.querySelectorAll('.Weekly-Sales-Chart').forEach(e => e.innerText = 'مخطط المبيعات الأسبوعي (باليوم)');
                document.querySelectorAll('.Driver-Name').forEach(e => e.innerText = 'اسم السائق المسؤول');
                document.querySelectorAll('.Add-Truck').forEach(e => e.innerText = 'إضافة حركة توزيع شاحنة');
                document.querySelectorAll('.Backup-Data').forEach(e => e.innerText = 'إدارة البيانات');
                document.querySelectorAll('.Toggle-Text').forEach(e => e.innerText = 'تفعيل المظهر الداكن');
                document.querySelectorAll('.Company-Name-Label').forEach(e => e.innerText = 'اسم المؤسسة');
                document.querySelectorAll('.Company-Logo-Label').forEach(e => e.innerText = 'تحميل شعار المؤسسة');
                document.querySelectorAll('.Profile-Logo-Label').forEach(e => e.innerText = 'تحميل صورة الملف الشخصي');
                document.querySelectorAll('.action-header').forEach(e => { e.innerText = 'الإجراء'; e.style.flex = '0.5'; });
                document.querySelectorAll('.Default-Print-Type').forEach(e => e.innerText = 'نوع الطباعة الافتراضي');
                document.querySelectorAll('.Opt-Sheet').forEach(e => e.innerText = 'ورق (A4)');
                document.querySelectorAll('.Opt-A5').forEach(e => e.innerText = 'ورق (A5)');
                document.querySelectorAll('.Opt-Strip').forEach(e => e.innerText = 'شريط (حراري)');
                document.querySelectorAll('.Customer-Name-Label').forEach(e => e.innerText = 'اسم العميل:');
                document.querySelectorAll('.Customer-Name-Placeholder').forEach(e => e.placeholder = 'أدخل اسم العميل...');
                document.querySelectorAll('.Paper-Type-Label').forEach(e => e.innerText = 'نوع الورق:');
                document.querySelectorAll('.Truck-Load-Calc').forEach(e => e.innerText = 'حاسبة محتويات الشاحنة:');
                document.querySelectorAll('.Truck-Barcode-Placeholder').forEach(e => e.placeholder = 'أدخل الباركود واضغط Enter...');
                document.querySelectorAll('.Select-Product-Opt').forEach(e => e.innerText = '-- اختر منتج --');
                document.querySelectorAll('.Add-Btn-Text').forEach(e => e.innerText = 'إضافة');
                document.querySelectorAll('.Total-Load-Label').forEach(e => e.innerText = 'إجمالي المنتوجات');
                document.querySelectorAll('.Total-Value-Label').forEach(e => e.innerText = 'القيمة الإجمالية');
                document.querySelectorAll('.Customer-Sign-Label').forEach(e => e.innerText = 'توقيع العميل: ............................');
                document.querySelectorAll('.Company-Stamp-Label').forEach(e => e.innerText = 'ختم المؤسسة: ............................');
                document.querySelectorAll('.Net-Value-Label').forEach(e => e.innerText = 'صافي القيمة المحققة');
                document.querySelectorAll('.Driver-Sign-Label').forEach(e => e.innerText = 'توقيع السائق: ............................');
                document.querySelectorAll('.Manager-Sign-Label').forEach(e => e.innerText = 'توقيع المسؤول: ............................');
                document.querySelectorAll('.Invoice-Details-Title').forEach(e => e.innerText = 'تفاصيل الفاتورة');
                document.querySelectorAll('.Truck-Report-Title').forEach(e => e.innerText = 'تقرير توزيع الشاحنة');
                document.querySelectorAll('.Edit-Invoice-Title').forEach(e => e.innerText = 'تعديل بيانات الفاتورة');
                document.querySelectorAll('.Date-Time-Label').forEach(e => e.innerText = 'التاريخ والوقت');
                document.querySelectorAll('.Save-Changes-Btn').forEach(e => e.innerText = 'حفظ التعديلات');
                document.querySelectorAll('.Save-Btn').forEach(e => e.innerText = 'حفظ');
                document.querySelectorAll('.Close-Btn').forEach(e => e.innerText = 'إغلاق');
                document.querySelectorAll('.Cancel-Btn').forEach(e => e.innerText = 'إلغاء');
                document.querySelectorAll('.Barcode-Placeholder').forEach(e => e.placeholder = 'أدخل كود الباركود أو اسم المنتج...');
                document.querySelectorAll('.Customer-Search-Placeholder').forEach(e => e.placeholder = 'ابحث برقم الفاتورة أو اسم المشتري...');
                document.querySelectorAll('.Reset-Btn-Text').forEach(e => e.innerText = '⚠️ إعادة تهيئة المصنع للملف');
                document.querySelectorAll('.Product-Search-Placeholder').forEach(e => e.placeholder = 'ابحث باسم المنتج أو الباركود...');
                document.querySelectorAll('.Truck-Search-Placeholder').forEach(e => e.placeholder = 'ابحث برقم الشاحنة أو السائق...');
                document.querySelectorAll('.Products-Report-Title').forEach(e => e.innerText = 'تقرير قائمة المنتجات');
                document.querySelectorAll('.Date-Label').forEach(e => e.innerText = 'التاريخ: ............................');
                document.querySelectorAll('.unit-label').forEach(e => e.innerText = 'منتوج');
                document.querySelectorAll('.Opt-DZD').forEach(e => e.innerText = 'دينار جزائري (DZD)');
                document.querySelectorAll('.Opt-USD').forEach(e => e.innerText = 'دولار أمريكي (USD)');
                document.querySelectorAll('.Opt-EUR').forEach(e => e.innerText = 'يورو (EUR)');

            } else if (lang === 'en') {
                document.documentElement.lang = 'en';

                document.querySelectorAll('.Stock-Price').forEach(e => e.innerText = 'Stock Capital');
                document.querySelectorAll('.Total-Products').forEach(e => e.innerText = 'Total Products');
                document.querySelectorAll('.Total-Sell').forEach(e => e.innerText = 'Total Sales');
                document.querySelectorAll('.Clients').forEach(e => e.innerText = 'Transactions');
                document.querySelectorAll('.Order').forEach(e => e.innerText = 'Cashier Order');
                document.querySelectorAll('.invoice').forEach(e => e.innerText = 'Invoice Preview');
                document.querySelectorAll('.ID-item').forEach(e => e.innerText = 'Product Code');
                document.querySelectorAll('.Name-item').forEach(e => e.innerText = 'Product Name');
                document.querySelectorAll('.Price').forEach(e => e.innerText = 'Sale Price');
                document.querySelectorAll('.Quantity').forEach(e => e.innerText = 'Qty');
                document.querySelectorAll('.Total').forEach(e => e.innerText = 'Total');
                document.querySelectorAll('.Item-Code').forEach(e => e.innerText = 'Item Barcode');
                document.querySelectorAll('.Entry').forEach(e => e.innerText = 'Insert Item');
                document.querySelectorAll('.clear').forEach(e => e.innerText = 'Clear Cart');
                document.querySelectorAll('.Number').forEach(e => e.innerText = 'No.');
                document.querySelectorAll('.Amount-paid').forEach(e => e.innerText = 'Amount Paid:');
                document.querySelectorAll('.The-rest').forEach(e => e.innerText = 'Change Return:');
                document.querySelectorAll('.Finish').forEach(e => e.innerText = 'Finalize & Print');
                document.querySelectorAll('.Product').forEach(e => e.innerText = 'Product');
                document.querySelectorAll('.class').forEach(e => e.innerText = 'Category');
                document.querySelectorAll('.amount').forEach(e => e.innerText = 'Qty Available');
                document.querySelectorAll('.Entry-price').forEach(e => e.innerText = 'Cost Price');
                document.querySelectorAll('.Stock').forEach(e => e.innerText = 'Available Stock');
                document.querySelectorAll('.Low-Stock').forEach(e => e.innerText = 'Low Stock Warnings');
                document.querySelectorAll('.Creat-new').forEach(e => e.innerText = 'Add New Product');
                document.querySelectorAll('.Search').forEach(e => e.innerText = 'Search');
                document.querySelectorAll('.Products').forEach(e => e.innerText = 'Products Inventory');
                document.querySelectorAll('.Print').forEach(e => e.innerText = 'Print Report');
                document.querySelectorAll('.Items-Count-Log').forEach(e => e.innerText = 'Products Count');
                document.querySelectorAll('.customers').forEach(e => e.innerText = 'Sales & Customers Log');
                document.querySelectorAll('.invoice-number').forEach(e => e.innerText = 'Invoice ID');
                document.querySelectorAll('.Payment').forEach(e => e.innerText = 'Customer Type');
                document.querySelectorAll('.Date-time').forEach(e => e.innerText = 'Date & Time');
                document.querySelectorAll('.Truck-Monitoring').forEach(e => e.innerText = 'Truck Monitoring & Shipments');
                document.querySelectorAll('.ID-truck').forEach(e => e.innerText = 'Truck Reg No.');
                document.querySelectorAll('.Return').forEach(e => e.innerText = 'Returned Qty');
                document.querySelectorAll('.Remaining-value').forEach(e => e.innerText = 'Delivered Value');
                document.querySelectorAll('.system').forEach(e => e.innerText = 'Global System Settings');
                document.querySelectorAll('.Modal-Barcode-Label').forEach(e => e.innerText = 'Barcode / Product Code (Unique)');
                document.querySelectorAll('.Modal-Barcode-Placeholder').forEach(e => e.placeholder = 'Enter barcode...');
                document.querySelectorAll('.Modal-Name-Label').forEach(e => e.innerText = 'Product Name');
                document.querySelectorAll('.Modal-Name-Placeholder').forEach(e => e.placeholder = 'e.g., Almarai Milk');
                document.querySelectorAll('.Modal-Category-Label').forEach(e => e.innerText = 'Category / Type');
                document.querySelectorAll('.Modal-Category-Placeholder').forEach(e => e.placeholder = 'e.g., Foodstuffs');
                document.querySelectorAll('.Modal-Qty-Label').forEach(e => e.innerText = 'Current Quantity Available');
                document.querySelectorAll('.Modal-Entry-Price-Label').forEach(e => e.innerText = 'Product Purchase Price (Cost)');
                document.querySelectorAll('.Modal-Sale-Price-Label').forEach(e => e.innerText = 'Product Selling Price');
                document.querySelectorAll('.Modal-Min-Limit-Label').forEach(e => e.innerText = 'Minimum Stock Alert Level');
                document.querySelectorAll('.Truck-Num-Label').forEach(e => e.innerText = 'Truck Registration No.');
                document.querySelectorAll('.Truck-Num-Placeholder').forEach(e => e.placeholder = 'e.g., 12345-120-30');
                document.querySelectorAll('.Truck-Driver-Label').forEach(e => e.innerText = 'Driver Name');
                document.querySelectorAll('.Truck-Driver-Placeholder').forEach(e => e.placeholder = 'e.g., John Doe');
                document.querySelectorAll('.Truck-Return-Label').forEach(e => e.innerText = 'Returned Quantity');
                document.querySelectorAll('.Truck-Product-Search-Placeholder').forEach(e => e.placeholder = 'Select product...');
                document.querySelectorAll('.The-courrency-used').forEach(e => e.innerText = 'Preferred Currency');
                document.querySelectorAll('.Save-Add-Another-Btn').forEach(e => e.innerText = 'Save & Add Another');
                document.querySelectorAll('.Language').forEach(e => e.innerText = 'System Language');
                document.querySelectorAll('.Dark-mode').forEach(e => e.innerText = 'Dark Mode Theme');
                document.querySelectorAll('.account').forEach(e => e.innerText = 'Corporate Account Profile');
                document.querySelectorAll('.username').forEach(e => e.innerText = 'Supervisor Username');
                document.querySelectorAll('.Email').forEach(e => e.innerText = 'Email');
                document.querySelectorAll('.password').forEach(e => e.innerText = 'Password');
                document.querySelectorAll('.welcome-title').forEach(e => e.innerText = 'Welcome to Advanced Inventory Management System');
                document.querySelectorAll('.welcome-desc').forEach(e => e.innerText = 'Click any button in the sidebar to manage cashier sales, products, financial reports, or trucks.');
                document.querySelectorAll('.financial-reports-title').forEach(e => e.innerText = 'Financial Reports & Analysis');
                document.querySelectorAll('.Stock-Value-Capital').forEach(e => e.innerText = 'Total Capital Cost');
                document.querySelectorAll('.Expected-Profit').forEach(e => e.innerText = 'Expected Net Profit');
                document.querySelectorAll('.Actual-Sales-Revenue').forEach(e => e.innerText = 'Actual Realized Revenue');
                document.querySelectorAll('.Weekly-Sales-Chart').forEach(e => e.innerText = 'Weekly Sales Chart');
                document.querySelectorAll('.Driver-Name').forEach(e => e.innerText = 'Driver Name');
                document.querySelectorAll('.Add-Truck').forEach(e => e.innerText = 'Record New Shipment');
                document.querySelectorAll('.Backup-Data').forEach(e => e.innerText = 'System Data');
                document.querySelectorAll('.Toggle-Text').forEach(e => e.innerText = 'Enable dark mode theme');
                document.querySelectorAll('.Company-Name-Label').forEach(e => e.innerText = 'Company Name');
                document.querySelectorAll('.Company-Logo-Label').forEach(e => e.innerText = 'Upload Company Logo');
                document.querySelectorAll('.Profile-Logo-Label').forEach(e => e.innerText = 'Upload Profile Photo');
                document.querySelectorAll('.action-header').forEach(e => { e.innerText = 'Action'; e.style.flex = '0.5'; });
                document.querySelectorAll('.Default-Print-Type').forEach(e => e.innerText = 'Default Print Type');
                document.querySelectorAll('.Opt-Sheet').forEach(e => e.innerText = 'Sheet (A4)');
                document.querySelectorAll('.Opt-A5').forEach(e => e.innerText = 'Sheet (A5)');
                document.querySelectorAll('.Opt-Strip').forEach(e => e.innerText = 'Strip (Thermal)');
                document.querySelectorAll('.Customer-Name-Label').forEach(e => e.innerText = 'Customer Name:');
                document.querySelectorAll('.Customer-Name-Placeholder').forEach(e => e.placeholder = 'Enter customer name...');
                document.querySelectorAll('.Paper-Type-Label').forEach(e => e.innerText = 'Paper Type:');
                document.querySelectorAll('.Truck-Load-Calc').forEach(e => e.innerText = 'Truck Load Calculator:');
                document.querySelectorAll('.Truck-Barcode-Placeholder').forEach(e => e.placeholder = 'Enter barcode & press Enter...');
                document.querySelectorAll('.Select-Product-Opt').forEach(e => e.innerText = '-- Select Product --');
                document.querySelectorAll('.Add-Btn-Text').forEach(e => e.innerText = 'Add');
                document.querySelectorAll('.Total-Load-Label').forEach(e => e.innerText = 'Total Products');
                document.querySelectorAll('.Total-Value-Label').forEach(e => e.innerText = 'Total Value');
                document.querySelectorAll('.Customer-Sign-Label').forEach(e => e.innerText = 'Customer Signature: ............................');
                document.querySelectorAll('.Company-Stamp-Label').forEach(e => e.innerText = 'Company Stamp: ............................');
                document.querySelectorAll('.Net-Value-Label').forEach(e => e.innerText = 'Net Realized Value');
                document.querySelectorAll('.Driver-Sign-Label').forEach(e => e.innerText = 'Driver Signature: ............................');
                document.querySelectorAll('.Manager-Sign-Label').forEach(e => e.innerText = 'Manager Signature: ............................');
                document.querySelectorAll('.Invoice-Details-Title').forEach(e => e.innerText = 'Invoice Details');
                document.querySelectorAll('.Truck-Report-Title').forEach(e => e.innerText = 'Truck Load Report');
                document.querySelectorAll('.Edit-Invoice-Title').forEach(e => e.innerText = 'Edit Invoice Data');
                document.querySelectorAll('.Date-Time-Label').forEach(e => e.innerText = 'Date & Time');
                document.querySelectorAll('.Save-Changes-Btn').forEach(e => e.innerText = 'Save Changes');
                document.querySelectorAll('.Save-Btn').forEach(e => e.innerText = 'Save');
                document.querySelectorAll('.Close-Btn').forEach(e => e.innerText = 'Close');
                document.querySelectorAll('.Cancel-Btn').forEach(e => e.innerText = 'Cancel');
                document.querySelectorAll('.Barcode-Placeholder').forEach(e => e.placeholder = 'Enter barcode or product name...');
                document.querySelectorAll('.Customer-Search-Placeholder').forEach(e => e.placeholder = 'Search by invoice number or buyer name...');
                document.querySelectorAll('.Reset-Btn-Text').forEach(e => e.innerText = '⚠️ Factory Reset Database');
                document.querySelectorAll('.Product-Search-Placeholder').forEach(e => e.placeholder = 'Search by product name or barcode...');
                document.querySelectorAll('.Truck-Search-Placeholder').forEach(e => e.placeholder = 'Search by truck number or driver...');
                document.querySelectorAll('.Products-Report-Title').forEach(e => e.innerText = 'Product List Report');
                document.querySelectorAll('.Date-Label').forEach(e => e.innerText = 'Date: ............................');
                document.querySelectorAll('.unit-label').forEach(e => e.innerText = 'Units');
                document.querySelectorAll('.Opt-DZD').forEach(e => e.innerText = 'Algerian Dinar (DZD)');
                document.querySelectorAll('.Opt-USD').forEach(e => e.innerText = 'US Dollar (USD)');
                document.querySelectorAll('.Opt-EUR').forEach(e => e.innerText = 'Euro (EUR)');

            } else if (lang === 'fr') {
                document.documentElement.lang = 'fr';

                document.querySelectorAll('.Stock-Price').forEach(e => e.innerText = 'Valeur du Stock');
                document.querySelectorAll('.Total-Products').forEach(e => e.innerText = 'Total Produits');
                document.querySelectorAll('.Total-Sell').forEach(e => e.innerText = 'Ventes Réalisées');
                document.querySelectorAll('.Clients').forEach(e => e.innerText = 'Transactions');
                document.querySelectorAll('.Order').forEach(e => e.innerText = 'Caisse Commande');
                document.querySelectorAll('.invoice').forEach(e => e.innerText = 'Aperçu Facture');
                document.querySelectorAll('.ID-item').forEach(e => e.innerText = 'Code Produit');
                document.querySelectorAll('.Name-item').forEach(e => e.innerText = 'Nom de l\'article');
                document.querySelectorAll('.Price').forEach(e => e.innerText = 'Prix Vente');
                document.querySelectorAll('.Quantity').forEach(e => e.innerText = 'Qté');
                document.querySelectorAll('.Total').forEach(e => e.innerText = 'Total');
                document.querySelectorAll('.Item-Code').forEach(e => e.innerText = 'Code à Barres');
                document.querySelectorAll('.Entry').forEach(e => e.innerText = 'Ajouter Article');
                document.querySelectorAll('.clear').forEach(e => e.innerText = 'Vider Panier');
                document.querySelectorAll('.Number').forEach(e => e.innerText = 'N°.');
                document.querySelectorAll('.Amount-paid').forEach(e => e.innerText = 'Montant Payé:');
                document.querySelectorAll('.The-rest').forEach(e => e.innerText = 'Rendu Monnaie:');
                document.querySelectorAll('.Finish').forEach(e => e.innerText = 'Enregistrer & Imprimer');
                document.querySelectorAll('.Product').forEach(e => e.innerText = 'Produit');
                document.querySelectorAll('.class').forEach(e => e.innerText = 'Catégorie');
                document.querySelectorAll('.amount').forEach(e => e.innerText = 'Quantité Disponible');
                document.querySelectorAll('.Entry-price').forEach(e => e.innerText = 'Prix d\'achat');
                document.querySelectorAll('.Stock').forEach(e => e.innerText = 'Stock Disponible');
                document.querySelectorAll('.Low-Stock').forEach(e => e.innerText = 'Alertes Stock Faible');
                document.querySelectorAll('.Creat-new').forEach(e => e.innerText = 'Nouveau Produit');
                document.querySelectorAll('.Search').forEach(e => e.innerText = 'Rechercher');
                document.querySelectorAll('.Products').forEach(e => e.innerText = 'Gestion du Catalogue');
                document.querySelectorAll('.Print').forEach(e => e.innerText = 'Imprimer Rapport');
                document.querySelectorAll('.Items-Count-Log').forEach(e => e.innerText = 'Nombre de Produits');
                document.querySelectorAll('.customers').forEach(e => e.innerText = 'Historique des Ventes');
                document.querySelectorAll('.invoice-number').forEach(e => e.innerText = 'Code Facture');
                document.querySelectorAll('.Payment').forEach(e => e.innerText = 'Type Client');
                document.querySelectorAll('.Date-time').forEach(e => e.innerText = 'Date & Heure');
                document.querySelectorAll('.Truck-Monitoring').forEach(e => e.innerText = 'Suivi des Camions de Distribution');
                document.querySelectorAll('.ID-truck').forEach(e => e.innerText = 'N° Matricule');
                document.querySelectorAll('.Return').forEach(e => e.innerText = 'Quantité Retournée');
                document.querySelectorAll('.Remaining-value').forEach(e => e.innerText = 'Valeur Livrée');
                document.querySelectorAll('.system').forEach(e => e.innerText = 'Paramètres Généraux');
                document.querySelectorAll('.Modal-Barcode-Label').forEach(e => e.innerText = 'Code-barres / Code produit (Unique)');
                document.querySelectorAll('.Modal-Barcode-Placeholder').forEach(e => e.placeholder = 'Entrez le code-barres...');
                document.querySelectorAll('.Modal-Name-Label').forEach(e => e.innerText = 'Nom du produit');
                document.querySelectorAll('.Modal-Name-Placeholder').forEach(e => e.placeholder = 'ex: Lait Almarai');
                document.querySelectorAll('.Modal-Category-Label').forEach(e => e.innerText = 'Catégorie / Type');
                document.querySelectorAll('.Modal-Category-Placeholder').forEach(e => e.placeholder = 'ex: Produits alimentaires');
                document.querySelectorAll('.Modal-Qty-Label').forEach(e => e.innerText = 'Quantité actuelle disponible');
                document.querySelectorAll('.Modal-Entry-Price-Label').forEach(e => e.innerText = 'Prix d\'achat du produit (Coût)');
                document.querySelectorAll('.Modal-Sale-Price-Label').forEach(e => e.innerText = 'Prix de vente au consommateur');
                document.querySelectorAll('.Modal-Min-Limit-Label').forEach(e => e.innerText = 'Seuil d\'alerte stock minimum');
                document.querySelectorAll('.Truck-Num-Label').forEach(e => e.innerText = 'N° d\'immatriculation du camion');
                document.querySelectorAll('.Truck-Num-Placeholder').forEach(e => e.placeholder = 'ex: 12345-120-30');
                document.querySelectorAll('.Truck-Driver-Label').forEach(e => e.innerText = 'Nom du chauffeur');
                document.querySelectorAll('.Truck-Driver-Placeholder').forEach(e => e.placeholder = 'ex: Jean Dupont');
                document.querySelectorAll('.Truck-Return-Label').forEach(e => e.innerText = 'Quantité retournée');
                document.querySelectorAll('.Truck-Product-Search-Placeholder').forEach(e => e.placeholder = 'Choisir un produit...');
                document.querySelectorAll('.The-courrency-used').forEach(e => e.innerText = 'Devise de Base');
                document.querySelectorAll('.Save-Add-Another-Btn').forEach(e => e.innerText = 'Enregistrer et ajouter un autre');
                document.querySelectorAll('.Language').forEach(e => e.innerText = 'Langue de l\'interface');
                document.querySelectorAll('.Dark-mode').forEach(e => e.innerText = 'Thème Sombre');
                document.querySelectorAll('.account').forEach(e => e.innerText = 'Profil de l\'Entreprise');
                document.querySelectorAll('.username').forEach(e => e.innerText = 'Nom d\'utilisateur');
                document.querySelectorAll('.Email').forEach(e => e.innerText = 'Email');
                document.querySelectorAll('.password').forEach(e => e.innerText = 'Mot de passe');
                document.querySelectorAll('.welcome-title').forEach(e => e.innerText = 'Bienvenue sur le Système de Gestion de Stock & Caisse');
                document.querySelectorAll('.welcome-desc').forEach(e => e.innerText = 'Cliquez sur n\'importe quel bouton de la barre latérale pour gérer la caisse, les produits, les rapports financiers ou les camions.');
                document.querySelectorAll('.financial-reports-title').forEach(e => e.innerText = 'Rapports Financiers & Statistiques');
                document.querySelectorAll('.Stock-Value-Capital').forEach(e => e.innerText = 'Coût Total d\'acquisition');
                document.querySelectorAll('.Expected-Profit').forEach(e => e.innerText = 'Bénéfice Net Attendu');
                document.querySelectorAll('.Actual-Sales-Revenue').forEach(e => e.innerText = 'Chiffre d\'Affaires Réalisé');
                document.querySelectorAll('.Weekly-Sales-Chart').forEach(e => e.innerText = 'Statistiques des ventes hebdomadaires');
                document.querySelectorAll('.Driver-Name').forEach(e => e.innerText = 'Nom du Chauffeur');
                document.querySelectorAll('.Add-Truck').forEach(e => e.innerText = 'Nouvel Envoi Camion');
                document.querySelectorAll('.Backup-Data').forEach(e => e.innerText = 'Données Système');
                document.querySelectorAll('.Toggle-Text').forEach(e => e.innerText = 'Activer le mode sombre');
                document.querySelectorAll('.Company-Name-Label').forEach(e => e.innerText = 'Nom de l\'entreprise');
                document.querySelectorAll('.Company-Logo-Label').forEach(e => e.innerText = 'Télécharger le logo');
                document.querySelectorAll('.Profile-Logo-Label').forEach(e => e.innerText = 'Télécharger la photo de profil');
                document.querySelectorAll('.action-header').forEach(e => { e.innerText = 'Action'; e.style.flex = '0.5'; });
                document.querySelectorAll('.Default-Print-Type').forEach(e => e.innerText = 'Type d\'impression par défaut');
                document.querySelectorAll('.Opt-Sheet').forEach(e => e.innerText = 'Papier (A4)');
                document.querySelectorAll('.Opt-A5').forEach(e => e.innerText = 'Papier (A5)');
                document.querySelectorAll('.Opt-Strip').forEach(e => e.innerText = 'Bande (Thermique)');
                document.querySelectorAll('.Customer-Name-Label').forEach(e => e.innerText = 'Nom du client:');
                document.querySelectorAll('.Customer-Name-Placeholder').forEach(e => e.placeholder = 'Entrez le nom du client...');
                document.querySelectorAll('.Paper-Type-Label').forEach(e => e.innerText = 'Type de papier:');
                document.querySelectorAll('.Truck-Load-Calc').forEach(e => e.innerText = 'Calculateur de charge camion:');
                document.querySelectorAll('.Truck-Barcode-Placeholder').forEach(e => e.placeholder = 'Entrez le code-barres...');
                document.querySelectorAll('.Select-Product-Opt').forEach(e => e.innerText = '-- Choisir un produit --');
                document.querySelectorAll('.Add-Btn-Text').forEach(e => e.innerText = 'Ajouter');
                document.querySelectorAll('.Total-Load-Label').forEach(e => e.innerText = 'Total Produits');
                document.querySelectorAll('.Total-Value-Label').forEach(e => e.innerText = 'Valeur totale');
                document.querySelectorAll('.Customer-Sign-Label').forEach(e => e.innerText = 'Signature du client: ............................');
                document.querySelectorAll('.Company-Stamp-Label').forEach(e => e.innerText = 'Sceau de l\'entreprise: ............................');
                document.querySelectorAll('.Net-Value-Label').forEach(e => e.innerText = 'Valeur nette réalisée');
                document.querySelectorAll('.Driver-Sign-Label').forEach(e => e.innerText = 'Signature du chauffeur: ............................');
                document.querySelectorAll('.Manager-Sign-Label').forEach(e => e.innerText = 'Signature du responsable: ............................');
                document.querySelectorAll('.Invoice-Details-Title').forEach(e => e.innerText = 'Détails de la facture');
                document.querySelectorAll('.Truck-Report-Title').forEach(e => e.innerText = 'Rapport du camion');
                document.querySelectorAll('.Edit-Invoice-Title').forEach(e => e.innerText = 'Modifier les données de la facture');
                document.querySelectorAll('.Date-Time-Label').forEach(e => e.innerText = 'Date et Heure');
                document.querySelectorAll('.Save-Changes-Btn').forEach(e => e.innerText = 'Enregistrer les modifications');
                document.querySelectorAll('.Save-Btn').forEach(e => e.innerText = 'Enregistrer');
                document.querySelectorAll('.Close-Btn').forEach(e => e.innerText = 'Fermer');
                document.querySelectorAll('.Cancel-Btn').forEach(e => e.innerText = 'Annuler');
                document.querySelectorAll('.Barcode-Placeholder').forEach(e => e.placeholder = 'Entrez le code-barres ou le nom du produit...');
                document.querySelectorAll('.Customer-Search-Placeholder').forEach(e => e.placeholder = 'Rechercher par numéro de facture ou nom de l\'acheteur...');
                document.querySelectorAll('.Reset-Btn-Text').forEach(e => e.innerText = '⚠️ Réinitialisation d\'usine du fichier');
                document.querySelectorAll('.Product-Search-Placeholder').forEach(e => e.placeholder = 'Rechercher par nom ou code-barres...');
                document.querySelectorAll('.Truck-Search-Placeholder').forEach(e => e.placeholder = 'Rechercher par numéro ou chauffeur...');
                document.querySelectorAll('.Products-Report-Title').forEach(e => e.innerText = 'Rapport de la liste des produits');
                document.querySelectorAll('.Date-Label').forEach(e => e.innerText = 'Date: ............................');
                document.querySelectorAll('.unit-label').forEach(e => e.innerText = 'Unités');
                document.querySelectorAll('.Opt-DZD').forEach(e => e.innerText = 'Dinar Algérien (DZD)');
                document.querySelectorAll('.Opt-USD').forEach(e => e.innerText = 'Dollar Américain (USD)');
                document.querySelectorAll('.Opt-EUR').forEach(e => e.innerText = 'Euro (EUR)');
            }
        }

        // وظيفة لتعبئة قائمة الاقتراحات للمنتجات
        function populateProductSuggestions(inputValue) {
            const datalist = document.getElementById('product-suggestions');
            if (!datalist) return;

            datalist.innerHTML = ''; // مسح الاقتراحات السابقة

            if (inputValue.length < 1) { // ابدأ الاقتراح بعد إدخال حرفين على الأقل
                return;
            }

            const lowerCaseInput = inputValue.toLowerCase();
            const filteredProducts = products.filter(p =>
                p.name.toLowerCase().includes(lowerCaseInput) && p.qty > 0 // اقتراح المنتجات المتوفرة فقط
            ).slice(0, 10); // حدد عدد الاقتراحات (يمكنك تعديل هذا الرقم)

            filteredProducts.forEach(p => {
                const option = document.createElement('option');
                option.value = p.name;
                datalist.appendChild(option);
            });
        }

        // --- تشغيل قاعدة البيانات تلقائياً عند تحميل الصفحة ---
        window.onload = function() {
            initAppDatabase();

            // ميزة التركيز الدائم: إعادة الفوكس تلقائياً لحقل الباركود عند فقدانه داخل شاشة الطلب
            document.getElementById('codebar').addEventListener('blur', function() {
                setTimeout(() => {
                    // التحقق مما إذا كان التركيز قد انتقل إلى حقل إدخال آخر أو زر (مثل السعر أو الكمية)
                    const activeEl = document.activeElement;
                    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'BUTTON' || activeEl.tagName === 'SELECT')) {
                        return; // اترك التركيز للمستخدم لكي يتمكن من الكتابة
                    }

                    if (document.getElementById('frame-calculator').classList.contains('active') && 
                        document.getElementById('orderframe').classList.contains('active')) {
                        this.focus();
                    }
                }, 150);
            });

            // إضافة مستمع لحدث الإدخال لتحديث الاقتراحات في حقل الباركود
            document.getElementById('codebar').addEventListener('input', function() {
                populateProductSuggestions(this.value);
            });
        }
