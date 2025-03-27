import nodemailer from 'nodemailer';

/**
 * Envía un email de notificación cuando una sesión de checkout es completada
 * @param {Object} session - Objeto de sesión de Stripe del evento checkout.session.completed
 * @returns {Promise<Object>} - Resultado del envío
 */
export async function sendPaymentSuccessEmail(session) {
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

    // Extraer datos relevantes de la sesión
    const paymentData = {
      id: session.id,
      amount: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email || 'cliente@ejemplo.com',
      paymentStatus: session.payment_status,
      customerName: session.customer_details?.name || 'Cliente'
    };

    // Crear mensaje
    const message = {
      from: '"Sistema de Pagos" <pagos@ejemplo.com>',
      to: paymentData.customerEmail,
      subject: `Pago Confirmado - Orden #${paymentData.id}`,
      text: `
        Hola ${paymentData.customerName},
        
        Tu pago ha sido procesado con éxito!
        
        ID de Sesión: ${paymentData.id}
        Monto: ${formatAmount(paymentData.amount, paymentData.currency)}
        Estado: ${paymentData.paymentStatus}
        Fecha: ${new Date().toLocaleString()}
        
        Gracias por tu compra.
      `,
      html: `
        <h1>Pago Exitoso!</h1>
        <p>Hola ${paymentData.customerName}, tu pago ha sido procesado correctamente.</p>
        
        <ul>
          <li><strong>ID de Sesión:</strong> ${paymentData.id}</li>
          <li><strong>Monto:</strong> ${formatAmount(paymentData.amount, paymentData.currency)}</li>
          <li><strong>Estado:</strong> ${paymentData.paymentStatus}</li>
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
