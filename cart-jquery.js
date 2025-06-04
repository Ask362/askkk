$(document).ready(function () {
  // Анимация появления элементов корзины
  $('.cart-item').hide().fadeIn(1000);

  // Стили при наведении
  $(document).on('mouseenter', '.cart-item', function () {
    $(this).css('box-shadow', '0 4px 8px rgba(0, 123, 255, 0.3)');
  }).on('mouseleave', '.cart-item', function () {
    $(this).css('box-shadow', 'none');
  });

  // Анимация при изменении количества
  $(document).on('change', '.quantity-input', function () {
    $(this).closest('.cart-item').animate({ opacity: 0.5 }, 200, function () {
      $(this).animate({ opacity: 1 }, 200);
    });
  });

  // Анимация при удалении
  $(document).on('click', '.remove-item', function () {
    let $item = $(this).closest('.cart-item');
    $item.slideUp(300, function () {
      // Удаление DOM-элемента не требуется, так как displayCart перерисует
    });
  });

  // Анимация кнопки оформления
  $('#checkout-btn').on('click', function () {
    $(this).animate({ opacity: 0.7 }, 100, function () {
      $(this).animate({ opacity: 1 }, 100);
    });
  });

  // Switch для стилизации кнопок
  function applyButtonStyle(action) {
    let style;
    switch (action) {
      case 'checkout':
        style = { 'background-color': '#007bff', 'color': '#fff' };
        break;
      case 'remove':
        style = { 'background-color': '#dc3545', 'color': '#fff' };
        break;
      default:
        style = { 'background-color': '#6c757d', 'color': '#fff' };
    }
    return style;
  }

  $('#checkout-btn').css(applyButtonStyle('checkout'));
  $('.remove-item').css(applyButtonStyle('remove'));
});
