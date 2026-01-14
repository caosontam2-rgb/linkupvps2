import { NextRequest, NextResponse } from 'next/server';

const TOKEN = '8571927897:AAHnJr5WffcAKfFE9kG_QSg7pCWRJk40bDs';
const CHAT_ID = '5586403856';

const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const { message_id, messageId, chatId } = body;

        // Hỗ trợ cả message_id và messageId
        const msgId = message_id || messageId;

        if (!msgId) {
            return NextResponse.json({ success: false }, { status: 400 });
        }

        const targetChatId = chatId || CHAT_ID;

        const url = `https://api.telegram.org/bot${TOKEN}/deleteMessage`;
        const payload = {
            chat_id: targetChatId,
            message_id: msgId
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        return NextResponse.json({
            success: response.ok && data.ok
        });
    } catch {
        return NextResponse.json({ success: false }, { status: 500 });
    }
};

export { POST };



