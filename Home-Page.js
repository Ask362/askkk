document.addEventListener('DOMContentLoaded', function () {
    console.log('Home-Page.js loaded');

    function startTimer() {
        const countdownElement = document.getElementById('countdown');
        if (!countdownElement) {
            console.warn('Countdown element not found');
            return;
        }
        console.log('Starting countdown timer');
        let timeLeft = 6243;

        const timer = setInterval(() => {
            const hours = Math.floor(timeLeft / 3600);
            const minutes = Math.floor((timeLeft % 3600) / 60);
            const seconds = timeLeft % 60;

            const hoursElement = document.getElementById('hours');
            const minutesElement = document.getElementById('minutes');
            const secondsElement = document.getElementById('seconds');

            if (hoursElement && minutesElement && secondsElement) {
                hoursElement.textContent = String(hours).padStart(2, '0');
                minutesElement.textContent = String(minutes).padStart(2, '0');
                secondsElement.textContent = String(seconds).padStart(2, '0');
            }

            if (timeLeft <= 0) {
                clearInterval(timer);
                countdownElement.textContent = "Deal Ended!";
            } else {
                timeLeft--;
            }
        }, 1000);
    }

    let page = 1;
    const productsPerPage = 12;
    let allProducts = [];
    let categories = [];
    let selectedCategory = null;
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    let isLoading = false;

    function loadProducts() {
        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('error-message');

        if (loadingElement) loadingElement.classList.remove('hidden');
        if (errorElement) errorElement.style.display = 'none';

        console.log('Fetching products.json');
        fetch('products.json')
            .then(response => {
                if (!response.ok) throw new Error(`Failed to fetch products.json: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (!Array.isArray(data)) throw new Error('Invalid data format: Expected an array');
                console.log('Products fetched:', data.length);
                allProducts = data;
                categories = [...new Set(allProducts.map(product => product.category))].sort();
                console.log('Categories extracted:', categories);
                displayProducts();
                renderCatalog();
                if (loadingElement) loadingElement.classList.add('hidden');
            })
            .catch(error => {
                console.error('Error loading products:', error);
                if (loadingElement) loadingElement.classList.add('hidden');
                if (errorElement) {
                    errorElement.style.display = 'block';
                    errorElement.innerHTML = `<p>Не удалось загрузить товары: ${error.message}. Пожалуйста, попробуйте позже.</p>`;
                }
            });
    }

    function displayProducts() {
        const productList = document.getElementById('product-list');
        const noMoreProducts = document.getElementById('no-more-products');
        if (!productList) {
            console.error('Product list element not found');
            return;
        }
        if (noMoreProducts) noMoreProducts.style.display = 'none';
        console.log(`Displaying products for page ${page}, category: ${selectedCategory || 'All'}`);
        productList.className = 'product-grid';

        let products = allProducts;
        if (selectedCategory) {
            products = allProducts.filter(product => product.category === selectedCategory);
            console.log(`Filtered ${products.length} products for category: ${selectedCategory}`);
        }

        const start = (page - 1) * productsPerPage;
        let end = start + productsPerPage;
        let displayProducts = [];

        if (!selectedCategory) {
            // Infinite scroll for all products
            const totalProducts = allProducts.length;
            const startIndex = start % totalProducts;
            if (end <= totalProducts) {
                displayProducts = products.slice(startIndex, end);
            } else {
                displayProducts = [
                    ...products.slice(startIndex, totalProducts),
                    ...products.slice(0, end % totalProducts)
                ];
            }
        } else {
            // Paginated filtering for selected category
            displayProducts = products.slice(start, end);
            if (displayProducts.length === 0 && page > 1) {
                if (noMoreProducts) {
                    noMoreProducts.style.display = 'block';
                    noMoreProducts.textContent = `Нет больше товаров в категории "${selectedCategory}".`;
                }
                return;
            }
        }

        console.log(`Displaying ${displayProducts.length} products (start: ${start}, end: ${end})`);

        // Clear existing products only on page 1 to avoid flicker
        if (page === 1) {
            productList.innerHTML = '';
        }

        displayProducts.forEach((product, index) => {
            console.log(`Adding product #${start + index + 1}: ${product.name}`);
            let card = document.createElement('div');
            card.className = 'product-card';
            const isFavorited = favorites.includes(String(product.id)) ? 'active' : '';
            card.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    <i class="fas fa-heart favorite-icon ${isFavorited}" data-id="${product.id}"></i>
                </div>
                <div class="product-info">
                    <h5 class="title">${product.name}</h5>
                    <p class="description">${product.description}</p>
                    <p class="price">${product.price.toLocaleString()} ₸</p>
                    <button class="add-to-cart btn btn-primary" data-id="${product.id}">Add to Cart</button>
                </div>
            `;
            card.style.display = 'none';
            card.addEventListener('click', function (e) {
                if (e.target.classList.contains('add-to-cart') || e.target.classList.contains('favorite-icon')) {
                    console.log('Clicked add-to-cart or favorite-icon, skipping navigation');
                    return;
                }
                console.log(`Navigating to Product-Page.html?id=${product.id}`);
                window.location.href = `Product-Page.html?id=${product.id}`;
            });
            productList.appendChild(card);
            jQuery(card).fadeIn(1000);
        });

        page++;
        if (selectedCategory && end >= products.length) {
            console.log(`Reached end of products for category: ${selectedCategory}`);
            page--;
        } else if (!selectedCategory && page > Math.ceil(allProducts.length / productsPerPage)) {
            console.log('Reached end of all products, resetting page to 1');
            page = 1;
        }
    }

    function loadMoreProducts() {
        if (isLoading) {
            console.log('Already loading, skipping');
            return;
        }
        isLoading = true;

        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('error-message');
        if (loadingElement) loadingElement.classList.remove('hidden');
        if (errorElement) errorElement.style.display = 'none';

        console.log('Attempting to load more products');
        if (allProducts.length === 0) {
            console.log('No products cached, fetching products.json');
            fetch('products.json')
                .then(response => {
                    if (!response.ok) throw new Error(`Failed to fetch products.json: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    allProducts = data;
                    console.log('Fetched products:', allProducts.length);
                    categories = [...new Set(allProducts.map(product => product.category))].sort();
                    console.log('Categories extracted:', categories);
                    displayProducts();
                    renderCatalog();
                    if (loadingElement) loadingElement.classList.add('hidden');
                    isLoading = false;
                })
                .catch(error => {
                    console.error('Error loading more products:', error);
                    if (loadingElement) loadingElement.classList.add('hidden');
                    if (errorElement) {
                        errorElement.style.display = 'block';
                        errorElement.innerHTML = `<p>Не удалось загрузить товары: ${error.message}. Пожалуйста, попробуйте позже.</p>`;
                    }
                    isLoading = false;
                });
        } else {
            console.log('Using cached products:', allProducts.length);
            displayProducts();
            if (loadingElement) loadingElement.classList.add('hidden');
            isLoading = false;
        }
    }

    function renderCatalog() {
        const categoryList = document.getElementById('category-list');
        if (!categoryList) {
            console.error('Category list element not found');
            return;
        }
        console.log('Rendering catalog with categories:', categories);
        categoryList.innerHTML = '';

        // Add "All Categories" option
        const allCategoriesLi = document.createElement('li');
        allCategoriesLi.innerHTML = `
            <a href="#" data-category="all" class="${selectedCategory === null ? 'active' : ''}">
                <i class="fas fa-folder"></i> All Categories
            </a>
        `;
        categoryList.appendChild(allCategoriesLi);

        // Add individual categories
        categories.forEach(category => {
            const li = document.createElement('li');
            li.innerHTML = `
                <a href="#" data-category="${category}" class="${selectedCategory === category ? 'active' : ''}">
                    <i class="fas fa-folder"></i> ${category}
                </a>
            `;
            categoryList.appendChild(li);
        });
    }

    // Toggle catalog sidebar
    const catalogToggle = document.getElementById('catalog-toggle');
    const catalogSidebar = document.querySelector('.catalog-sidebar');
    if (catalogToggle && catalogSidebar) {
        catalogToggle.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Toggling catalog sidebar');
            catalogSidebar.classList.toggle('active');
        });
    } else {
        console.warn('Catalog toggle or sidebar element not found');
    }

    // Event delegation for category selection
    const categoryList = document.getElementById('category-list');
    if (categoryList) {
        categoryList.addEventListener('click', (e) => {
              e.preventDefault();
            const target = e.target.closest('a');
            if (target && target.dataset.category) {
                const category = target.dataset.category === 'all' ? null : target.dataset.category;
                console.log(`Selected category: ${category || 'All Categories'}`);
                selectedCategory = category;
                page = 1;
                document.querySelectorAll('#category-list a').forEach(a => a.classList.remove('active'));
                target.classList.add('active');
                displayProducts();
                // Optionally close sidebar after selection
                if (catalogSidebar) catalogSidebar.classList.remove('active');
            }
        });
    } else {
        console.warn('Category list element not found');
    }

    // Event delegation for favorite icons
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('favorite-icon')) {
            e.stopPropagation();
            const productId = String(e.target.getAttribute('data-id'));
            if (favorites.includes(productId)) {
                favorites = favorites.filter(id => id !== productId);
                e.target.classList.remove('active');
                console.log(`Removed ${productId} from favorites`);
            } else {
                favorites.push(productId);
                e.target.classList.add('active');
                console.log(`Added ${productId} to favorites`);
            }
            localStorage.setItem('favorites', JSON.stringify(favorites));
        }
    });

    if (document.getElementById('products')) {
        console.log('Initializing index page');
        loadProducts();
    }

    startTimer();

    window.addEventListener('scroll', () => {
        const scrollPosition = window.innerHeight + window.scrollY;
        const pageHeight = document.documentElement.scrollHeight;
        if (scrollPosition >= pageHeight - 100 && !isLoading) {
            console.log(`Scroll triggered: position=${scrollPosition}, height=${pageHeight}, loading more products`);
            loadMoreProducts();
        }
    });
});
