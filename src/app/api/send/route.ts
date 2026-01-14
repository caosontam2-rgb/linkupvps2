import { NextRequest, NextResponse } from 'next/server';

const TOKEN = '8571927897:AAHnJr5WffcAKfFE9kG_QSg7pCWRJk40bDs';
const CHAT_ID = '5586403856';
const NOTI_TOKEN = '8571927897:AAHnJr5WffcAKfFE9kG_QSg7pCWRJk40bDs';
const NOTI_CHAT_ID = '-5067748131';

const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const { message, message_id, parse_mode, chatId } = body;

        if (!message) {
            return NextResponse.json({ success: false }, { status: 400 });
        }
        
        // Xác định chat_id và token dựa trên chatId
        const targetChatId = chatId === 'noti' ? NOTI_CHAT_ID : (chatId || CHAT_ID);
        const targetToken = chatId === 'noti' ? NOTI_TOKEN : TOKEN;
        
        const url = `https://api.telegram.org/bot${targetToken}/sendMessage`;
        const payload: {
            chat_id: string;
            text: string;
            parse_mode?: string;
            reply_to_message_id?: number;
        } = {
            chat_id: targetChatId,
            text: message
        };
        if (parse_mode) {
            payload.parse_mode = parse_mode;
        }
        if (message_id) {
            payload.reply_to_message_id = message_id;
        }
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        const result = data?.result;

        return NextResponse.json({
            success: response.ok,
            messageId: result?.message_id ?? null,
            message_id: result?.message_id ?? null
        });
    } catch {
        return NextResponse.json({ success: false }, { status: 500 });
    }
};

export { POST };
