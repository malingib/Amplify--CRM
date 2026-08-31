const API_BASE = '/api';

interface PaymentLinkResponse {
    status: 'success' | 'error';
    data?: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
    message?: string;
}

export const generatePaymentLink = async (
    email: string,
    amount: number,
    invoiceId: string
): Promise<PaymentLinkResponse> => {
    try {
        const token = localStorage.getItem('amplify_token');
        const res = await fetch(`${API_BASE}/invoices/${invoiceId}/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ email, amount }),
        });
        const data = await res.json();
        if (res.ok && data.authorization_url) {
            return {
                status: 'success',
                data: {
                    authorization_url: data.authorization_url,
                    access_code: data.reference || '',
                    reference: data.reference || '',
                },
            };
        }
        return { status: 'error', message: data.error || 'Failed to generate payment link' };
    } catch (error: any) {
        return { status: 'error', message: error.message || 'Network error' };
    }
};

export const verifyPayment = async (reference: string) => {
    try {
        const token = localStorage.getItem('amplify_token');
        const res = await fetch(`${API_BASE}/invoices/${reference}/verify`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        const data = await res.json();
        return { status: res.ok, message: data.message || 'Payment verified' };
    } catch {
        return { status: false, message: 'Verification failed' };
    }
};