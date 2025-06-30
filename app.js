// CONFIG: replace with your Apps Script Web App URL
const APPSCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyPfcoWBquFBh7Z6d5MrHdxgA6gPSgrzwCX8g-S8CPF3cc8xAPnci9zCjbUe4u8oIDE/exec';

const productGrid = document.getElementById('productGrid');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const cartPanel = document.getElementById('cartPanel');
const cartItemsDiv = document.getElementById('cartItems');
const billSummary = document.getElementById('billSummary');
const cartCount = document.getElementById('cartCount');
const checkoutFrame = document.getElementById('checkoutFrame');

let products = [];
let cart = {};

// Utility
function formatCurrency(val) {
  return `₹${val}`;
}

// Load Products
async function loadProducts() {
  try {
    const res = await fetch(`${APPSCRIPT_URL}/products`);
    products = await res.json();
    renderProducts();
  } catch (err) {
    productGrid.innerHTML = '<p>Error loading products.</p>';
  }
}

function renderProducts() {
  productGrid.innerHTML = '';
  products.forEach(prod => {
    const div = document.createElement('div');
    div.className = 'product';
    div.innerHTML = `
      <img src="${prod['Image URL']}" alt="${prod.Name}">
      <div class="info">
        <h3>${prod.Name}</h3>
        <p>${prod['Short Description']}</p>
        <div class="price">${formatCurrency(prod.Price)}</div>
        ${prod.Available.toLowerCase() === 'yes' ? `
          <button onclick="openModal(${prod.ID})">View & Add</button>
        ` : `<button disabled>Out of Stock</button>`}
      </div>
    `;
    productGrid.appendChild(div);
  });
}

window.openModal = function(id) {
  const prod = products.find(p => p.ID == id);
  modalContent.innerHTML = `
    <img src="${prod['Image URL']}" alt="${prod.Name}">
    <h3>${prod.Name}</h3>
    <p>${prod['Long Description']}</p>
    <div class="price">${formatCurrency(prod.Price)}</div>
    <button onclick="addToCart(${prod.ID})">Add to Cart</button>
    <button onclick="closeModal()">Close</button>
  `;
  modal.style.display = 'flex';
}

window.closeModal = function() {
  modal.style.display = 'none';
}

// Cart
window.addToCart = function(id) {
  const prod = products.find(p => p.ID == id);
  if (cart[id]) {
    cart[id].qty += 1;
  } else {
    cart[id] = { ...prod, qty: 1 };
  }
  updateCartCount();
  closeModal();
}

function updateCartCount() {
  const count = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  cartCount.textContent = count;
}

// Cart Panel
document.getElementById('openCart').addEventListener('click', () => {
  renderCartPanel();
  cartPanel.style.display = 'flex';
});
document.getElementById('closeCart').addEventListener('click', () => {
  cartPanel.style.display = 'none';
});

function renderCartPanel() {
  cartItemsDiv.innerHTML = '';
  Object.values(cart).forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div>${item.Name} x ${item.qty} - ${formatCurrency(item.Price * item.qty)}</div>
      <div class="cart-controls">
        <button onclick="decreaseQty(${item.ID})">-</button>
        <button onclick="increaseQty(${item.ID})">+</button>
        <button onclick="removeItem(${item.ID})">X</button>
      </div>
    `;
    cartItemsDiv.appendChild(div);
  });
  renderBillSummary();
}

window.increaseQty = function(id) {
  cart[id].qty += 1;
  renderCartPanel();
  updateCartCount();
}

window.decreaseQty = function(id) {
  cart[id].qty -= 1;
  if (cart[id].qty <= 0) delete cart[id];
  renderCartPanel();
  updateCartCount();
}

window.removeItem = function(id) {
  delete cart[id];
  renderCartPanel();
  updateCartCount();
}

function renderBillSummary() {
  let subtotal = 0;
  Object.values(cart).forEach(item => subtotal += item.Price * item.qty);
  const delivery = 50;
  const otherFee = 0;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + delivery + otherFee + gst;

  billSummary.innerHTML = `
    <p>Subtotal: ${formatCurrency(subtotal)}</p>
    <p>Delivery: ${formatCurrency(delivery)}</p>
    <p>Other Fee: ${formatCurrency(otherFee)}</p>
    <p>GST (18%): ${formatCurrency(gst)}</p>
    <p class="highlight">TOTAL: ${formatCurrency(total)}</p>
  `;
}

// Buy Now
document.getElementById('buyNow').addEventListener('click', () => {
  if (Object.keys(cart).length === 0) {
    alert('Your cart is empty!');
    return;
  }
  const lines = [];
  Object.values(cart).forEach(item => {
    lines.push(`${item.Name} x ${item.qty} - ${item.Price * item.qty}`);
  });
  let subtotal = 0;
  Object.values(cart).forEach(item => subtotal += item.Price * item.qty);
  const delivery = 50;
  const otherFee = 0;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + delivery + otherFee + gst;

  const bill = `
${lines.join('\n')}
Subtotal: ${subtotal}
Delivery: ${delivery}
Other Fee: ${otherFee}
GST (18%): ${gst}
TOTAL: ${total}
  `.trim();

  const cartParam = encodeURIComponent(bill);
  const iframeURL = `${APPSCRIPT_URL}/checkout?cart=${cartParam}`;

  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  checkoutFrame.src = iframeURL;
  checkoutFrame.style.display = 'block';

  // Optionally, hide cart
  cartPanel.style.display = 'none';
});

// Close modal on click outside
window.onclick = function(event) {
  if (event.target == modal) closeModal();
  if (event.target == cartPanel) cartPanel.style.display = 'none';
}

loadProducts();
