// Variables para manejar el estado del formulario
let stripe;
let elements;
let paymentForm = document.getElementById('payment-form');
let paymentMessage = document.getElementById('payment-message');
let submitButton = document.getElementById('submit-button');

// Inicializar el checkout
async function initialize() {
  try {
    // Obtener la clave publicable
    // Podría hacerse teniendo un .env en el frontend y leyendo de allí 
    // (por eso es publicable)
    const { publishableKey } = await fetch('/config').then(res => res.json());
    
    if (!publishableKey) {
      console.error('No Stripe publishable key available!');
      showMessage('Error de configuración. Contacte con soporte.');
      return;
    }
    
    // Inicializar Stripe
    stripe = Stripe(publishableKey);

    // Crear PaymentIntent en el servidor
    const { clientSecret } = await fetch('/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000, currency: 'eur' })
    }).then(res => res.json());

    if (!clientSecret) {
      showMessage('No se pudo iniciar el proceso de pago.');
      return;
    }

    // Crear elementos de formulario de Stripe
    elements = stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#635bff',
        }
      }
    });

    // Crear y montar el elemento de pago
    const paymentElement = elements.create('payment');
    paymentElement.mount('#payment-element');

    // Escuchar el evento submit del formulario
    paymentForm.addEventListener('submit', handleSubmit);
  } catch (error) {
    console.error('Error initializing checkout:', error);
    showMessage('Error al cargar el formulario de pago. Inténtelo de nuevo más tarde.');
  }
}

// Manejar el envío del formulario
async function handleSubmit(e) {
  e.preventDefault();
  
  // Deshabilitar el botón mientras se procesa
  submitButton.disabled = true;
  submitButton.textContent = 'Procesando...';
  
  try {
    // Confirmar el pago
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-confirmation`,
      },
      redirect: 'if_required'
    });

    if (error) {
      // Mostrar el error
      showMessage(error.message);
    } else {
      // El pago se ha completado correctamente sin redirección
      showMessage('¡Pago completado con éxito!', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  } catch (error) {
    console.error('Payment error:', error);
    showMessage('Ocurrió un error durante el proceso de pago.');
  }

  submitButton.disabled = false;
  submitButton.textContent = 'Pagar ahora';
}

// Mostrar un mensaje al usuario
function showMessage(messageText, type = 'error') {
  paymentMessage.classList.remove('hidden');
  paymentMessage.textContent = messageText;
  paymentMessage.style.color = type === 'error' ? 'red' : 'green';
  paymentMessage.style.display = 'block';
  
  setTimeout(() => {
    paymentMessage.style.display = 'none';
  }, 10000);
}

// Iniciar el proceso cuando se cargue la página
document.addEventListener('DOMContentLoaded', initialize);
