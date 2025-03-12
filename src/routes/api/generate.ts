import type { RequestHandler } from '@sveltejs/kit';
import { createCanvas, loadImage } from 'canvas';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export const POST: RequestHandler = async ({ request }) => {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    // A4 size in pixels at 300 DPI
    const width = 2480;
    const height = 3508;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fill the canvas with a white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    const positions: { x: number, y: number, width: number, height: number }[] = [];

    for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const img = await loadImage(buffer);
        let x:number,y:number;
        let overlap;
        let attempts = 0;
        const maxAttempts = 1000;

        // Apply random scaling between 0.8 and 1.2
        const scale = 0.8 + Math.random() * 0.4;
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        do {
            x = Math.random() * (canvas.width - scaledWidth);
            y = Math.random() * (canvas.height - scaledHeight);
            overlap = positions.some(pos => 
                x < pos.x + pos.width &&
                x + scaledWidth > pos.x &&
                y < pos.y + pos.height &&
                y + scaledHeight > pos.y
            );
            attempts++;
            if (attempts > maxAttempts) {
                throw new Error('Max attempts reached while placing images');
            }
        } while (overlap);

        positions.push({ x, y, width: scaledWidth, height: scaledHeight });
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

        // Add a frame around the image
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 5;
        ctx.strokeRect(x, y, scaledWidth, scaledHeight);

        // Add a caption below the image
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.fillText('Caption', x, y + scaledHeight + 25);
    }

    const buffer = canvas.toBuffer('image/png');
    const tempFilePath = join('/tmp', 'collage.png');
    
    try {
        await writeFile(tempFilePath, buffer);
        console.log(`File written to ${tempFilePath}`);
    } catch (error) {
        console.error(`Error writing file: ${error}`);
    }

    return new Response(buffer, {
        status: 200,
        headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': 'attachment; filename="collage.png"'
        }
    });
};
