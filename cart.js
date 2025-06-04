let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];
let isLoading = false;
let storeName = "Alem Market";
let appliedPromocode = null;
let discount = 0;

// Промокоды (ключ: код, значение: скидка в процентах)
const promocodes = {
  "ALEM10": 10,
  "SAVE20": 20,
  "FREESHIP": 15
};

// Toast уведомления
function showToast(message, isError = false) {
  try {
    const toast = new bootstrap.Toast(document.getElementById('cart-toast'));
    const toastBody = document.querySelector('#cart-toast .toast-body');
    toastBody.textContent = message;
    document.querySelector('#cart-toast').classList.toggle('bg-danger', isError);
    document.querySelector('#cart-toast').classList.toggle('text-white', isError);
    toast.show();
  } catch (error) {
    console.error('Ошибка отображения toast:', error);
  }
}

// Обновление количества в корзине (глобально для всех страниц)
function updateCartCount() {
  try {
    const cartCountElements = document.querySelectorAll('.cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElements.forEach(element => {
      element.textContent = totalItems;
    });
  } catch (error) {
    console.error('Ошибка обновления счетчика корзины:', error);
  }
}

// Добавление товара в корзину
function addToCart(productId, quantity = 1) {
  try {
    const parsedId = parseInt(productId);
    if (isNaN(parsedId)) {
      throw new Error('Некорректный ID продукта');
    }
    const existingItem = cart.find(item => item.id === parsedId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ id: parsedId, quantity });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast('Товар добавлен в корзину');
  } catch (error) {
    console.error('Ошибка добавления товара в корзину:', error);
    showToast('Ошибка добавления товара', true);
  }
}

// Загрузка JSON
function loadProducts(callback) {
  if (isLoading) return;
  isLoading = true;
  const loadingElement = document.getElementById('loading');
  if (loadingElement) loadingElement.style.display = 'block';

  fetch('products.json')
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      products = data;
      console.log(`${storeName} загрузил ${products.length} товаров`);
      callback();
      isLoading = false;
      if (loadingElement) loadingElement.style.display = 'none';
    })
    .catch(error => {
      console.error('Ошибка загрузки JSON:', error);
      isLoading = false;
      if (loadingElement) loadingElement.style.display = 'none';
      showToast('Ошибка загрузки данных. Попробуйте позже.', true);
    });
}

// Отображение корзины
function displayCart() {
  const cartItems = document.getElementById('cart-items');
  if (!cartItems) {
    console.error('Элемент #cart-items не найден');
    return;
  }
  cartItems.innerHTML = '';
  let subtotal = 0;

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="text-center">Корзина пуста</p>';
    updateSummary(0, 0);
    updateCartCount();
    return;
  }

  for (let i = 0; i < cart.length; i++) {
    const item = cart[i];
    const product = products.find(p => p.id === item.id);
    if (!product) {
      console.warn(`Товар с ID ${item.id} не найден в products.json`);
      continue;
    }

    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;

    const cartItem = document.createElement('div');
    cartItem.className = 'product-card cart-item';
    cartItem.setAttribute('data-product-id', item.id);
    cartItem.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" class="cart-item-img" loading="lazy">
      </div>
      <div class="product-info">
        <h5 class="title">${product.name}</h5>
        <p class="price">₸${product.price.toFixed(0)}</p>
        <div class="d-flex align-items-center mb-3">
          <label for="quantity-${item.id}" class="me-2">Количество:</label>
          <input type="number" class="form-control quantity-input" id="quantity-${item.id}" value="${item.quantity}" min="1" data-id="${item.id}">
        </div>
        <button class="btn btn-outline-danger remove-item" data-id="${item.id}">
          <i class="fas fa-trash"></i> Удалить
        </button>
      </div>
    `;
    // Добавление кликабельности для перехода на Product-Page.html
    cartItem.addEventListener('click', (e) => {
      if (!e.target.closest('.quantity-input') && !e.target.closest('.remove-item')) {
        window.location.href = `Product-Page.html?id=${item.id}`;
      }
    });
    cartItems.appendChild(cartItem);
  }

  // Обновление суммы
  discount = appliedPromocode ? (subtotal * promocodes[appliedPromocode] / 100) : 0;
  updateSummary(subtotal, discount);

  // Слушатели событий
  document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('change', function (e) {
      e.stopPropagation();
      const id = parseInt(this.getAttribute('data-id'));
      let quantity = parseInt(this.value);
      if (quantity < 1) quantity = 1;
      updateCartItem(id, quantity);
    });
  });

  document.querySelectorAll('.remove-item').forEach(button => {
    button.addEventListener('click', function (e) {
      e.stopPropagation();
      const id = parseInt(this.getAttribute('data-id'));
      removeCartItem(id);
    });
  });

  // Рекомендуемый товар
  if (products.length > 0) {
    const randomIndex = Math.floor(Math.random() * products.length);
    console.log("Рекомендуемый товар: " + products[randomIndex].name);
  }

  updateCartCount();
}

// Обновление суммы
function updateSummary(subtotal, discount) {
  try {
    const total = subtotal - discount;
    const subtotalElement = document.getElementById('cart-subtotal');
    const discountElement = document.getElementById('cart-discount');
    const totalElement = document.getElementById('cart-total');

    if (subtotalElement) subtotalElement.textContent = subtotal.toFixed(2);
    if (discountElement) discountElement.textContent = discount.toFixed(2);
    if (totalElement) totalElement.textContent = total.toFixed(2);
  } catch (error) {
    console.error('Ошибка обновления суммы:', error);
  }
}

// Обновление количества
function updateCartItem(id, quantity) {
  const item = cart.find(item => item.id === id);
  if (item) {
    item.quantity = quantity;
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCart();
    showToast('Количество обновлено');
  } else {
    console.error(`Товар с ID ${id} не найден в корзине`);
  }
}

// Удаление товара
function removeCartItem(id) {
  cart = cart.filter(item => item.id !== id);
  localStorage.setItem('cart', JSON.stringify(cart));
  displayCart();
  showToast('Товар удален из корзины');
}

// Применение промокода
document.getElementById('apply-promocode')?.addEventListener('click', function () {
  const promocodeInput = document.getElementById('promocode');
  const errorElement = document.getElementById('promocode-error');
  if (!promocodeInput || !errorElement) {
    console.error('Элементы промокода не найдены');
    return;
  }

  const code = promocodeInput.value.trim().toUpperCase();

  if (!code) {
    errorElement.textContent = 'Введите промокод';
    errorElement.style.display = 'block';
    return;
  }

  if (promocodes[code]) {
    appliedPromocode = code;
    displayCart();
    errorElement.style.display = 'none';
    showToast(`Промокод ${code} применен! Скидка ${promocodes[code]}%`);
  } else {
    errorElement.textContent = 'Недействительный промокод';
    errorElement.style.display = 'block';
    showToast('Недействительный промокод', true);
  }
});

// Оформление заказа
document.getElementById('checkout-btn')?.addEventListener('click', function () {
  if (cart.length === 0) {
    showToast('Корзина пуста!', true);
    return;
  }

  const paymentMethod = document.querySelector('input[name="payment-method"]:checked');
  if (!paymentMethod) {
    showToast('Выберите способ оплаты', true);
    return;
  }

  const paymentText = {
    'credit-card': 'Кредитная карта',
    'paypal': 'PayPal',
    'cash': 'Наличные при доставке'
  }[paymentMethod.value];

  showToast(`Заказ оформлен! Оплата: ${paymentText}`);
  cart = [];
  appliedPromocode = null;
  discount = 0;
  localStorage.setItem('cart', JSON.stringify(cart));
  displayCart();
});

// Инициализация корзины при загрузке страницы
window.onload = function () {
  showToast("Добро пожаловать в корзину Alem Market!");
  console.log("Инициализация корзины:", cart);
  loadProducts(displayCart);
  updateCartCount();
};
