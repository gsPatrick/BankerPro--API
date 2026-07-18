import AppError from '../../utils/app-error.js';
import { getSettingValue } from '../../utils/settings-resolver.js';

const mockPixPayments = new Map();

export const createCheckoutPreference = async (userId, userEmail, planType, price) => {
  const token = await getSettingValue('MP_ACCESS_TOKEN');
  if (!token || token === 'your_mercado_pago_access_token_here') {
    console.warn('⚠️ MP_ACCESS_TOKEN não configurado. Gerando checkout simulado.');
    return {
      init_point: `https://www.mercadopago.com.br/checkout/simulado?userId=${userId}&plan=${planType}&price=${price}`,
      id: 'pref_simulada_123456789'
    };
  }

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            title: `Assinatura Closer.IA - Plano ${planType.toUpperCase()}`,
            quantity: 1,
            unit_price: price,
            currency_id: 'BRL'
          }
        ],
        external_reference: JSON.stringify({ userId, planType }),
        back_urls: {
          success: 'https://bankerpro.com/subscription/success',
          pending: 'https://bankerpro.com/subscription/pending',
          failure: 'https://bankerpro.com/subscription/failure'
        },
        auto_return: 'approved'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AppError(
        `Erro no Mercado Pago: ${errorData.message || response.statusText}`,
        response.status,
        'PAYMENT_PROVIDER_ERROR'
      );
    }

    const data = await response.json();
    return {
      init_point: data.init_point,
      id: data.id
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Falha de comunicação com o Mercado Pago: ${error.message}`, 500, 'PAYMENT_COMMUNICATION_FAILED');
  }
};

export const getPaymentDetails = async (paymentId) => {
  const token = await getSettingValue('MP_ACCESS_TOKEN');
  if (!token || token === 'your_mercado_pago_access_token_here') {
    const mockPayment = mockPixPayments.get(String(paymentId));
    if (mockPayment) {
      const elapsed = Date.now() - mockPayment.createdAt;
      return {
        status: elapsed >= 8000 ? 'approved' : 'pending',
        external_reference: JSON.stringify({
          userId: mockPayment.userId,
          planType: mockPayment.planType
        }),
        id: paymentId
      };
    }

    return {
      status: 'approved',
      external_reference: JSON.stringify({ userId: 'mock-user-id', planType: 'pro' }),
      id: paymentId
    };
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new AppError('Falha ao obter detalhes do pagamento no Mercado Pago.', response.status, 'PAYMENT_FETCH_FAILED');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Falha de comunicação com o Mercado Pago: ${error.message}`, 500, 'PAYMENT_COMMUNICATION_FAILED');
  }
};

export const createPreapproval = async (userId, userEmail, planType, price, cardToken) => {
  const token = await getSettingValue('MP_ACCESS_TOKEN');
  if (!token || token === 'your_mercado_pago_access_token_here') {
    return {
      id: 'preapproval_mock_' + Date.now(),
      status: 'authorized'
    };
  }

  try {
    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: `Assinatura Closer.IA - Plano ${planType.toUpperCase()}`,
        external_reference: JSON.stringify({ userId, planType }),
        back_url: 'https://bankerpro-bankerpro--front.wohb2u.easypanel.host/subscription/success',
        payer_email: userEmail,
        card_token_id: cardToken,
        status: 'authorized',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: price,
          currency_id: 'BRL'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AppError(`Erro ao assinar com cartão: ${errorData.message || response.statusText}`, response.status, 'PAYMENT_PROVIDER_ERROR');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Falha de comunicação com o Mercado Pago: ${error.message}`, 500, 'PAYMENT_COMMUNICATION_FAILED');
  }
};

export const createPixPayment = async (userId, userEmail, planType, price, docNumber, docType = 'CPF') => {
  const token = await getSettingValue('MP_ACCESS_TOKEN');
  if (!token || token === 'your_mercado_pago_access_token_here') {
    const id = 'pix_mock_' + Date.now();
    mockPixPayments.set(id, { userId, planType, createdAt: Date.now() });
    return {
      id,
      status: 'pending',
      external_reference: JSON.stringify({ userId, planType }),
      point_of_interaction: {
        transaction_data: {
          qr_code: '00020126580014br.gov.bcb.pix0136mock-key-1234-5678-9012-3456789012345204000053039865802BR5913BankerPro Mock6009SAO PAULO62070503***6304ABCD',
          qr_code_base64: null,
          qr_code_copy: '00020126580014br.gov.bcb.pix0136mock-key-1234-5678-9012-3456789012345204000053039865802BR5913BankerPro Mock6009SAO PAULO62070503***6304ABCD'
        }
      }
    };
  }

  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${userId}-${planType}-${Date.now()}`
      },
      body: JSON.stringify({
        transaction_amount: price,
        description: `Assinatura Closer.IA - Plano ${planType.toUpperCase()}`,
        payment_method_id: 'pix',
        payer: {
          email: userEmail,
          identification: {
            type: docType,
            number: docNumber.replace(/\D/g, '')
          }
        },
        external_reference: JSON.stringify({ userId, planType })
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AppError(`Erro ao gerar PIX: ${errorData.message || response.statusText}`, response.status, 'PAYMENT_PROVIDER_ERROR');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Falha de comunicação com o Mercado Pago: ${error.message}`, 500, 'PAYMENT_COMMUNICATION_FAILED');
  }
};
