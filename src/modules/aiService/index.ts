import config from '../../config';

const aiServiceUrl = config.ai_service_url;
async function sentimentAnalysis(text: string): Promise<string | null> {
    try {
        const re = await fetch(`${aiServiceUrl}/sentiment`, {
            headers: {
                'Content-Type': 'application/json',
            },

            method: 'POST',
            body: JSON.stringify({ text }),
        });
        const resJson = await re.json();

        if (!resJson.success) {
            throw new Error(
                `AI service error: ${resJson.error || 'Unknown error'}`,
            );
        }
        return resJson.data.sentiment_name as string;
    } catch (e) {
        console.error('Error in sentiment analysis:', e);
        return null;
    }
}

async function review_analyzer(data: string[]) {
    try {
        const re = await fetch(`${aiServiceUrl}/analyze-review`, {
            headers: {
                'Content-Type': 'application/json',
            },

            method: 'POST',
            body: JSON.stringify({ reviews: data }),
        });
        const resJson = await re.json();

        if (!resJson.success) {
            throw new Error(
                `AI service error: ${resJson.error || 'Unknown error'}`,
            );
        }
        return resJson.data;
    } catch (e) {
        console.error('Error in sentiment analysis:', e);
        return null;
    }
}

async function recommendationEngine(data: string): Promise<string | null> {
    try {
        const re = await fetch(`${aiServiceUrl}/recommend`, {
            headers: {
                'Content-Type': 'application/json',
            },

            method: 'POST',
            body: JSON.stringify({}),
        });
        const resJson = await re.json();

        if (!resJson.success) {
            throw new Error(
                `AI service error: ${resJson.error || 'Unknown error'}`,
            );
        }
        return resJson.data.sentiment_name as string;
    } catch (e) {
        console.error('Error in sentiment analysis:', e);
        return null;
    }
}

async function sendOrderData(orderData: any) {
    try {
        const re = await fetch(`${aiServiceUrl}/orders/import`, {
            headers: {
                'Content-Type': 'application/json',
            },

            method: 'POST',
            body: JSON.stringify(orderData),
        });
        const resJson = await re.json();

        if (!resJson.success) {
            throw new Error(
                `AI service error: ${resJson.error || 'Unknown error'}`,
            );
        }

        return resJson;
    } catch (e) {
        console.error('Error in sentiment analysis:', e);
        return null;
    }
}

export const aiService = {
    sentimentAnalysis,
    review_analyzer,
    recommendationEngine,
    sendOrderData,
};
