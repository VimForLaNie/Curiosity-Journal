import type { RequestHandler } from '@sveltejs/kit';
import { createCanvas, loadImage } from 'canvas';
import OpenAI from "openai";
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables from .env file
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const POST: RequestHandler = async ({ request }) => {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const transcript = formData.get('transcript') as string;

    const TextResponse = await openai.responses.create({
        model: "gpt-4o",
        input: [
            {
                "role": "user",
                "content": "output as a single string. no longer than 20 words\n" + transcript
            },
        ],
        text: {
            "format": {
                "type": "text"
            }
        },
        tools: [
            {
                "type": "function",
                "name": "summarize_conversation",
                "description": "Input is a conversation transcript and outputs a short phrases that capture key moments",
                "parameters": {
                    "type": "object",
                    "required": [
                        "transcript",
                        "max_phrases"
                    ],
                    "properties": {
                        "transcript": {
                            "type": "string",
                            "description": "The full text of the conversation transcript"
                        },
                        "max_phrases": {
                            "type": "number",
                            "description": "Maximum number of phrases to return as summary"
                        }
                    },
                    "additionalProperties": false
                },
                "strict": true
            }
        ],
        temperature: 1,
        max_output_tokens: 2048,
        top_p: 1,
        // stream: true,
        store: true
    });

    const ImgResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: transcript + "\ngenerate a background image for this story."
    });

    const summaryText = TextResponse.output_text;
    const backgroundUrl = ImgResponse.data[0].url;
    if(backgroundUrl === undefined){
        throw new Error("background image cannot be retrieved!");
    }
    // A4 size in pixels at 300 DPI
    const width = 2480;
    const height = 3508;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Load and set the background image
    const response = await axios.get(backgroundUrl, { responseType: 'arraybuffer' });
    const backgroundBuffer = Buffer.from(response.data, 'binary');
    const backgroundImg = await loadImage(backgroundBuffer);
    ctx.drawImage(backgroundImg, 0, 0, width, height);

    const positions: { x: number, y: number, width: number, height: number }[] = [];

    for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const img = await loadImage(buffer);
        let x: number, y: number;
        let overlap;
        let attempts = 0;
        const maxAttempts = 100;
        const scaledWidth = img.width * (0.9 + Math.random() * 0.15);
        const scaledHeight = img.height * (0.9 + Math.random() * 0.15);
        do {
            x = Math.random() * (canvas.width - scaledWidth);
            y = Math.random() * (canvas.height - scaledHeight);
            overlap = positions.some(pos =>
                x < pos.x + pos.width &&
                x + scaledWidth > pos.x &&
                y < pos.y + pos.height &&
                y + scaledHeight > pos.y
            );
        } while (overlap && attempts++ < maxAttempts);

        positions.push({ x, y, width: scaledWidth, height: scaledHeight });

        // Apply random rotation limited to 15 degrees
        const angle = (Math.random() * 30 - 15) * (Math.PI / 180);
        ctx.save();
        ctx.translate(x + scaledWidth / 2, y + scaledHeight / 2);
        ctx.rotate(angle);

        ctx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
        ctx.restore();
    }

    // Add the AI response text to the bottom of the collage
    ctx.font = '72px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';

    // Draw white rectangle as background for text
    const textWidth = ctx.measureText(summaryText).width;
    const textHeight = 72; // Approximate height of the text
    ctx.fillRect((width - textWidth) / 2 - 10, height - 150 - textHeight / 2, textWidth + 20, textHeight + 20);

    ctx.fillStyle = 'black'; // Set text color
    ctx.fillText(summaryText, width / 2, height - 100);

    const buffer = canvas.toBuffer('image/png');

    return new Response(buffer, {
        status: 200,
        headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': 'attachment; filename="collage.png"'
        }
    });
};
