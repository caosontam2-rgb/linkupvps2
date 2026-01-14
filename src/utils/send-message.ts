import axios from 'axios';

const sendMessage = async (message: string) => {
    const messageId = localStorage.getItem('messageId');
    const oldMessage = localStorage.getItem('message');

    let text;
    if (messageId) {
        try {
            await axios.post('/api/delete', {
                messageId: messageId
            });
        } catch (error) {
            console.error('Error deleting old message:', error);
        }
    }

    if (oldMessage) {
        text = oldMessage + '\n' + message;
    } else {
        text = message;
    }

    try {
        const response = await axios.post('/api/send', {
            message: text,
            parseMode: 'HTML'
        });

        const result = response.data;

        if (result.success) {
            localStorage.setItem('message', text);
            // Hỗ trợ cả messageId và message_id
            const msgId = result.messageId || result.message_id;
            localStorage.setItem('messageId', msgId);
            return { messageId: msgId };
        } else {
            console.error('lỗi gửi telegram:', result.error);
            return { messageId: null };
        }
    } catch (error) {
        console.error('Error sending message to Telegram API:', error);
        return { messageId: null };
    }
};

export default sendMessage;

