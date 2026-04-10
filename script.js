document.addEventListener('DOMContentLoaded', function() {
    // ===== State Management =====
    let cart = [];
    let paymentHistory = [];
    
    // ===== DOM Elements =====
    const form = document.getElementById('kasir-form');
    const itemNameInput = document.getElementById('item-name');
    const itemPriceInput = document.getElementById('item-price');
    const itemQtyInput = document.getElementById('item-qty');
    const itemSubtotalInput = document.getElementById('item-subtotal');
    const itemDiscountInput = document.getElementById('item-discount');
    const itemTotalInput = document.getElementById('item-total');
    const cartBody = document.getElementById('cart-body');
    const emptyCart = document.getElementById('empty-cart');
    const totalItemsEl = document.getElementById('total-items');
    const totalPriceEl = document.getElementById('total-price');
    const itemCountEl = document.getElementById('item-count');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const historyBody = document.getElementById('history-body');
    const emptyHistory = document.getElementById('empty-history');
    
    // ===== Date and Time Functions =====
    function updateDateTime() {
        const now = new Date();
        
        // Format tanggal Indonesia
        const optionsDate = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const formattedDate = now.toLocaleDateString('id-ID', optionsDate);
        
        // Format waktu
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const formattedTime = `${hours}:${minutes}:${seconds}`;
        
        document.getElementById('current-date').textContent = formattedDate;
        document.getElementById('current-time').textContent = formattedTime;
        
        return { formattedDate, formattedTime };
    }
    
    // Update waktu setiap detik
    const dateTime = updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // ===== Format Currency =====
    function formatCurrency(amount) {
        return 'Rp ' + amount.toLocaleString('id-ID');
    }
    
    // ===== Calculate Total with Discount =====
    function calculateTotalWithDiscount() {
        const price = parseFloat(itemPriceInput.value) || 0;
        const qty = parseInt(itemQtyInput.value) || 0;
const discount = parseInt(itemDiscountInput.value) || 0;
        
        const subtotal = price * qty;
        const discountAmount = subtotal * (discount / 100);
        const ppnAmount = subtotal * 0.12; // PPN 12% from beauty site
        const total = subtotal - discountAmount + ppnAmount;
        
        itemSubtotalInput.value = formatCurrency(subtotal);
        itemTotalInput.value = formatCurrency(total);
    }
    
    // ===== Event Listeners for Calculation =====
    itemPriceInput.addEventListener('input', calculateTotalWithDiscount);
    itemQtyInput.addEventListener('input', calculateTotalWithDiscount);
    itemDiscountInput.addEventListener('input', calculateTotalWithDiscount);
    
    // ===== Quantity Controls =====
    document.getElementById('qty-minus').addEventListener('click', function() {
        let currentQty = parseInt(itemQtyInput.value) || 1;
        if (currentQty > 1) {
            itemQtyInput.value = currentQty - 1;
            calculateTotalWithDiscount();
        }
    });
    
    document.getElementById('qty-plus').addEventListener('click', function() {
        let currentQty = parseInt(itemQtyInput.value) || 1;
        itemQtyInput.value = currentQty + 1;
        calculateTotalWithDiscount();
    });
    
    // ===== Quick Add Buttons =====
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const name = this.getAttribute('data-name');
            const price = parseInt(this.getAttribute('data-price'));
            
            itemNameInput.value = name;
            itemPriceInput.value = price;
            itemQtyInput.value = 1;
            itemDiscountInput.value = 0;
            calculateTotalWithDiscount();
            
            showNotification(`Item "${name}" dipilih!`, 'info');
        });
    });
    
    // ===== Add Item to Cart =====
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = itemNameInput.value.trim();
        const price = parseFloat(itemPriceInput.value);
        const qty = parseInt(itemQtyInput.value);
        const discount = parseInt(itemDiscountInput.value) || 0;
        
        if (!name || !price || !qty) {
            showNotification('Mohon isi semua field dengan benar!', 'error');
            return;
        }
        
        const subtotal = price * qty;
        const discountAmount = subtotal * (discount / 100);
        const total = (subtotal - discountAmount) * 1.12; // incl PPN 12%
        
        // Check if item already exists in cart
        const existingItemIndex = cart.findIndex(item => item.name === name && item.price === price);
        
        if (existingItemIndex > -1) {
            // Update quantity if item exists
            cart[existingItemIndex].qty += qty;
            cart[existingItemIndex].subtotal = (cart[existingItemIndex].price * cart[existingItemIndex].qty * (1 - cart[existingItemIndex].discount / 100)) * 1.12;
        } else {
            // Add new item
            cart.push({
                name: name,
                price: price,
                qty: qty,
                discount: discount,
                subtotal: total
            });
        }
        
        renderCart();
        resetForm();
        showNotification('Item berhasil ditambahkan ke keranjang!', 'success');
    });
    
    // ===== Render Cart =====
    function renderCart() {
        cartBody.innerHTML = '';
        
        if (cart.length === 0) {
            emptyCart.style.display = 'block';
            itemCountEl.textContent = '0 item';
            totalItemsEl.textContent = '0';
            totalPriceEl.textContent = 'Rp 0';
            return;
        }
        
        emptyCart.style.display = 'none';
        
        let totalItems = 0;
        let totalPrice = 0;
        
        cart.forEach((item, index) => {
            totalItems += item.qty;
            totalPrice += item.subtotal;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${item.name}</strong>${item.discount > 0 ? `<br><small style="color: #06d6a0;">Diskon ${item.discount}%</small>` : ''}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${item.qty}</td>
                <td><strong>${formatCurrency(item.subtotal)}</strong></td>
                <td>
                    <button class="btn-delete" onclick="deleteItem(${index})">Hapus</button>
                </td>
            `;
            cartBody.appendChild(row);
        });
        
        itemCountEl.textContent = `${cart.length} item`;
        totalItemsEl.textContent = totalItems;
        totalPriceEl.textContent = formatCurrency(totalPrice);
    }
    
    // ===== Delete Item =====
    window.deleteItem = function(index) {
        const deletedItem = cart[index].name;
        cart.splice(index, 1);
        renderCart();
        showNotification(`Item "${deletedItem}" dihapus dari keranjang!`, 'info');
    };
    
    // ===== Reset Form =====
    function resetForm() {
        form.reset();
        itemQtyInput.value = 1;
        itemDiscountInput.value = 0;
        itemSubtotalInput.value = '';
        itemTotalInput.value = '';
    }
    
    // ===== Reset Cart =====
    document.getElementById('btn-reset').addEventListener('click', function() {
        if (cart.length === 0) {
            showNotification('Keranjang sudah kosong!', 'info');
            return;
        }
        
        if (confirm('Apakah Anda yakin ingin mengosongkan keranjang?')) {
            cart = [];
            renderCart();
            showNotification('Keranjang berhasil dikosongkan!', 'success');
        }
    });
    
    // ===== Checkout =====
    document.getElementById('btn-checkout').addEventListener('click', function() {
        if (cart.length === 0) {
            showNotification('Keranjang masih kosong!', 'error');
            return;
        }
        
        let totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        let totalPrice = cart.reduce((sum, item) => sum + item.subtotal, 0);
        
        const dt = updateDateTime();
        
        const message = `🧾 STRUK PEMBAYARAN\n\n` +
            `Tanggal: ${dt.formattedDate}\n` +
            `Jam: ${dt.formattedTime}\n\n` +
            `────────────────────────────────\n\n` +
            cart.map((item, i) => 
                `${i + 1}. ${item.name}${item.discount > 0 ? ` (Diskon ${item.discount}%)` : ''}\n` +
                `   ${formatCurrency(item.price)} x ${item.qty} = ${formatCurrency(item.subtotal)}`
            ).join('\n\n') +
            `\n\n────────────────────────────────\n` +
            `Total Items: ${totalItems}\n` +
            `TOTAL BAYAR: ${formatCurrency(totalPrice)}\n\n` +
            `Terima kasih telah berbelanja! `;
        
        // Add to history
        const historyItem = {
            id: Date.now(),
            date: dt.formattedDate,
            time: dt.formattedTime,
            items: cart.map(item => ({...item})),
            totalItems: totalItems,
            totalPrice: totalPrice
        };
        paymentHistory.unshift(historyItem);
        
        // Save to localStorage
        saveHistory();
        
        // Render history
        renderHistory();
        
        // Copy to clipboard
        navigator.clipboard.writeText(message).then(() => {
            showNotification('Transaksi berhasil! Struk disalin ke clipboard.', 'success');
        }).catch(() => {
            alert(message);
        });
        
        // Reset cart after checkout
        cart = [];
        renderCart();
    });
    
    // ===== Render History =====
    function renderHistory() {
        historyBody.innerHTML = '';
        
        if (paymentHistory.length === 0) {
            emptyHistory.style.display = 'block';
            return;
        }
        
        emptyHistory.style.display = 'none';
        
        paymentHistory.forEach((history, index) => {
            const itemsList = history.items.map(item => `${item.name} (x${item.qty})`).join(', ');
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${history.date}<br><small>${history.time}</small></td>
                <td>${itemsList}</td>
                <td><strong>${formatCurrency(history.totalPrice)}</strong></td>
                <td>
                    <button class="btn-delete" onclick="deleteHistory(${index})">Hapus</button>
                </td>
            `;
            historyBody.appendChild(row);
        });
    }
    
    // ===== Delete History Item =====
    window.deleteHistory = function(index) {
        paymentHistory.splice(index, 1);
        saveHistory();
        renderHistory();
        showNotification('Riwayat dihapus!', 'info');
    };
    
    // ===== Save History to localStorage =====
    function saveHistory() {
        localStorage.setItem('paymentHistory', JSON.stringify(paymentHistory));
    }
    
    // ===== Load History from localStorage =====
    function loadHistory() {
        const saved = localStorage.getItem('paymentHistory');
        if (saved) {
            paymentHistory = JSON.parse(saved);
            renderHistory();
        }
    }
    
    // ===== Reset History =====
    document.getElementById('btn-reset-history').addEventListener('click', function() {
        if (paymentHistory.length === 0) {
            showNotification('Riwayat sudah kosong!', 'info');
            return;
        }
        
        if (confirm('Apakah Anda yakin ingin menghapus semua riwayat?')) {
            paymentHistory = [];
            saveHistory();
            renderHistory();
            showNotification('Riwayat berhasil dihapus!', 'success');
        }
    });
    
    // ===== Show Notification =====
    function showNotification(message, type = 'info') {
        notificationMessage.textContent = message;
        notification.className = 'notification ' + type;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Load history on page load
    loadHistory();
});
