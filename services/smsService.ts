
const API_URL = 'https://sms.mobiwave.co.ke/api/v3/sms/send';
// Note: In production, this should be in an environment variable. 
// Using a placeholder based on the prompt's context or a safe default.
const API_TOKEN = process.env.SMS_API_TOKEN || '49|LNFe8WJ7CPtvl2mzowAB4ll4enbFR0XGgnQh2qWY'; 

export interface SmsResponse {
    status: 'success' | 'error';
    message?: string;
    data?: any;
}

/**
 * Sends a single or bulk SMS.
 * @param recipient Single number or comma-separated string of numbers.
 * @param message The SMS body.
 * @param scheduleTime Optional RFC3339 or similar date string.
 */
export const scheduleSmsReminder = async (
    recipient: string,
    message: string,
    scheduleTime?: string
): Promise<SmsResponse> => {
    try {
        const payload: any = {
            recipient: recipient,
            sender_id: 'AmplifyCRM', // Alphanumeric sender ID (Max 11 chars)
            type: 'plain',
            message: message,
        };

        if (scheduleTime) {
            // Mobiwave expects Y-m-d H:i
            const dateObj = new Date(scheduleTime);
            
            // Format to YYYY-MM-DD HH:mm
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            
            payload.schedule_time = `${year}-${month}-${day} ${hours}:${minutes}`;
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
            return { status: 'success', data: data.data };
        } else {
            return { status: 'error', message: data.message || 'Failed to send SMS' };
        }
    } catch (error) {
        console.error("SMS Service Error:", error);
        return { status: 'error', message: 'Network error or service unavailable' };
    }
};

/**
 * Helper to send SMS to multiple recipients.
 * @param recipients Array of phone number strings.
 * @param message The SMS body.
 * @param scheduleTime Optional schedule time.
 */
export const sendBulkSms = async (
    recipients: string[], 
    message: string,
    scheduleTime?: string
): Promise<SmsResponse> => {
    // Filter out empty numbers and clean them up if necessary
    const validRecipients = recipients.filter(r => r && r.length > 5); 
    
    if (validRecipients.length === 0) {
        return { status: 'error', message: 'No valid recipients selected' };
    }

    // Mobiwave API accepts comma-separated recipients for bulk sending
    const recipientString = validRecipients.join(',');
    
    return scheduleSmsReminder(recipientString, message, scheduleTime);
};
