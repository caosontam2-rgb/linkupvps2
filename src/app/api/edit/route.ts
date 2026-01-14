import { NextRequest, NextResponse } from 'next/server';

const TOKEN = '8131880913:AAEUqz5jf6JLnTnue1fuR5TbNKQbImJRJfQ';
const CHAT_ID = '-5081203290';

const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const { message, message_id } = body;

        if (!message || !message_id) {
            return NextResponse.json({ success: false }, { status: 400 });
        }

        const url = `https://api.telegram.org/bot${TOKEN}/editMessageText`;
        const payload = {
            chat_id: CHAT_ID,
            message_id: message_id,
            text: message,
            parse_mode: 'HTML'
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




