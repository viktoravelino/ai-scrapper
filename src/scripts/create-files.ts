import OpenAI from 'openai';
import { instructions } from '../utils/create-file-ai-instructions';
import { promises as fs, createWriteStream } from 'fs';
import archiver from 'archiver';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const mockHTML = `<button tabindex="0" type="button">Large<span class="MuiTouchRipple-root css-w0pj6f"></span></button>`;
const mockCSS = `{
    display: inline-flex;
    -webkit-box-align: center;
    align-items: center;
    -webkit-box-pack: center;
    justify-content: center;
    position: relative;
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
    outline: 0px;
    border: 0px;
    margin: 0px;
    cursor: pointer;
    user-select: none;
    vertical-align: middle;
    appearance: none;
    text-decoration: none;
    font-family: Roboto, Helvetica, Arial, sans-serif;
    font-weight: 500;
    font-size: 0.9375rem;
    line-height: 1.75;
    letter-spacing: 0.02857em;
    text-transform: uppercase;
    min-width: 64px;
    padding: 8px 22px;
    border-radius: 4px;
    transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    color: rgb(255, 255, 255);
    background-color: rgb(25, 118, 210);
    box-shadow: rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px;
}`;
const type = 'react';
const name = 'Button';
const outputDir =
    type === 'react'
        ? `${type}/${type}-demo/src/components/${name}`
        : `${type}/${type}-demo/src/app/components/${name}`;
// Function to create a zip file of a directory
const zipDirectory = (sourceDir: string, outPath: string) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = createWriteStream(outPath);

    return new Promise<void>((resolve, reject) => {
        archive
            .directory(sourceDir, false)
            .on('error', (err: any) => reject(err))
            .pipe(stream);

        stream.on('close', () => resolve());
        archive.finalize();
    });
};
export async function createFiles() {
    console.log('😬 Pausing to let Andrew make some excuses...');
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log('💪 Resuming...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('🤖 Using AI to generate files...');
    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'system',
                content: instructions,
            },
            {
                role: 'user',
                content: `{ "html": "${mockHTML}", "css": "${mockCSS}" "type": ${type}, "name": ${name} }`,
            },
        ],
        temperature: 1,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        response_format: { type: 'json_object' },
    });

    try {
        const filesArray = response.choices[0].message.content;

        let filesString = JSON.stringify(filesArray);

        // Step 1: Replace backticks at the beginning and end of content blocks
        filesString = filesString.replace(/```tsx\n/g, '\\"').replace(/\n```/g, '\\"');

        // Step 2: Escape internal double quotes
        filesString = filesString.replace(/"/g, '\\"');

        // Step 3: Replace newlines with \n to make it a valid JSON string
        filesString = filesString.replace(/\n/g, '\\n');

        // Convert to JSON
        let filesJson;
        try {
            const filesObject = JSON.parse(filesArray as string);
            console.log('🤓 Converting files to JSON...');
            console.log('📁 Files:', filesObject);
            filesJson = JSON.parse(filesArray as string);
        } catch (error) {
            console.error('Error parsing string to JSON:', error);
        }
        // // Ensure the output directory exists
        await fs.mkdir(outputDir, { recursive: true });

        const files = filesJson.files;
        // Iterate over each file object and write to a new file
        for (const file of files) {
            const filename = file.file;
            let content = file.content;
            // Strip the Markdown code block syntax if present
            content = content.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');

            // Write the content to a new file
            await fs.writeFile(`${outputDir}/${filename}`, content, 'utf8');
        }

        // All files have been written, now zip the directory
        const zipPath = `${outputDir}/${type}-${name}-files.zip`;
        await zipDirectory(outputDir, zipPath);
        console.log(`🤐 Zipping up the files and exporting to ${zipPath}`);
    } catch (error) {
        console.error('Error:', error);
    }
}
