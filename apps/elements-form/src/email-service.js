import nodemailer from 'nodemailer';

/**
 * Envía un email de notificación cuando un pago es exitoso
 * @param {Object} paymentDetails - Detalles del pago de Stripe
 * @returns {Promise<Object>} - Resultado del envío
 */
export async function sendPaymentSuccessEmail(paymentDetails) {
  try {
    // Crear cuenta de prueba con Ethereal
    const testAccount = await nodemailer.createTestAccount();
    
    // Configurar el transporter
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      },
      logger: true
    });

    // Crear mensaje
    const message = {
      from: '"Sistema de Pagos" <pagos@ejemplo.com>',
      to: 'cliente@ejemplo.com',
      subject: `Pago Confirmado - Orden #${paymentDetails.id}`,
      text: `
        Tu pago ha sido procesado con éxito!
        
        ID de Pago: ${paymentDetails.id}
        Monto: ${formatAmount(paymentDetails.amount, paymentDetails.currency)}
        Fecha: ${new Date().toLocaleString()}
        
        Gracias por tu compra.
      `,
      html: `
        <h1>Pago Exitoso!</h1>
        <p>Tu pago ha sido procesado correctamente.</p>
        
        <ul>
          <li><strong>ID de Pago:</strong> ${paymentDetails.id}</li>
          <li><strong>Monto:</strong> ${formatAmount(paymentDetails.amount, paymentDetails.currency)}</li>
          <li><strong>Fecha:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        
        <p>Gracias por tu compra.</p>
      `
    };

    // Enviar email
    const info = await transporter.sendMail(message);
    
    console.log('Email de confirmación enviado');
    console.log('URL de vista previa: %s', nodemailer.getTestMessageUrl(info));
    
    return info;
  } catch (error) {
    console.error('Error al enviar el email:', error);
    throw error;
  }
}

/**
 * Formatea el monto con la moneda correcta
 */
function formatAmount(amount, currency) {
  const value = amount / 100;
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: currency || 'USD' 
  }).format(value);
}
