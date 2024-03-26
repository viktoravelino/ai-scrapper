require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
// Replace with your Figma personal access token
const personalAccessToken = process.env.FIGMA_API_KEY;

const figmaUrl =
    'https://www.figma.com/file/dLuw3Q8VPR8dNv9F1Tz0IN/ATK-1.1?type=design&node-id=322-1619';
const fileId = 'dLuw3Q8VPR8dNv9F1Tz0IN';
const nodeIds = '322:1619';
const options = {
    method: 'get',
    url: `https://api.figma.com/v1/files/${fileId}/nodes?ids=${nodeIds}`,
    headers: {
        'X-Figma-Token': personalAccessToken,
    },
};
const fetchFigmaFileData = async () => {
    try {
        await axios(options)
            .then((response: { data: any }) => {
                // Output the response to a local file
                fs.writeFile(
                    'src/figma/figmaData.json',
                    JSON.stringify(response.data, null, 2),
                    'utf-8',
                    (err: any) => {
                        if (err) {
                            console.error('An error occurred:', err);
                            return;
                        }
                        console.log('Figma data saved to figmaData.json');
                    }
                );
            })
            .catch((error: any) => console.error('Error fetching Figma file:', error));
        // You can now parse this data to extract layout and styles
    } catch (error) {
        console.error('Error fetching Figma file data:', error);
    }
};

fetchFigmaFileData();
