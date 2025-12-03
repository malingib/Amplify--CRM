
// Mock Paystack Service
// In a real application, this would interact with https://api.paystack.co

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
    invoiceNumber: string
): Promise<PaymentLinkResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        // Mock success response
        const reference = `REF-${Math.floor(Math.random() * 1000000000)}`;
        // Amount is in KES, Paystack expects subunits (cents), so * 100. 
        // For simulation, we just use the number.
        
        return {
            status: 'success',
            data: {
                authorization_url: `https://checkout.paystack.com/${reference}`,
                access_code: `ACCESS-${reference}`,
                reference: reference
            }
        };
    } catch (error) {
        return {
            status: 'error',
            message: 'Failed to generate payment link'
        };
    }
};

export const verifyPayment = async (reference: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Simulate verification check
    return {
        status: true,
        message: 'Payment verified successfully'
    };
};
