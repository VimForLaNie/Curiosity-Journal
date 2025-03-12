import type { RequestHandler } from '@sveltejs/kit';
import { createCanvas, loadImage } from 'canvas';
import { writeFileSync } from 'fs';
import { join } from 'path';

export const POST: RequestHandler = async ({ request }) => {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    // A4 size in pixels at 300 DPI
    const width = 2480;
    const height = 3508;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const positions: { x: number, y: number, width: number, height: number }[] = [];

    for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const img = await loadImage(buffer);
        let x:number,y:number;
        let overlap;
        let attempts = 0;
        const maxAttempts = 100;
        do {
            x = Math.random() * (canvas.width - img.width);
            y = Math.random() * (canvas.height - img.height);
            overlap = positions.some(pos => 
                x < pos.x + pos.width &&
                x + img.width > pos.x &&
                y < pos.y + pos.height &&
                y + img.height > pos.y
            );
        } while (overlap && attempts++ < maxAttempts);

        positions.push({ x, y, width: img.width, height: img.height });
        ctx.drawImage(img, x, y);
    }

    const buffer = canvas.toBuffer('image/png');
    const tempFilePath = join('/tmp', 'collage.png');
    writeFileSync(tempFilePath, buffer);

    return new Response(buffer, {
        status: 200,
        headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': 'attachment; filename="collage.png"'
        }
    });
};
