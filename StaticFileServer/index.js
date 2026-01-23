const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

module.exports = async function (context, req) {
    // Get the requested path, default to index.html
    let requestedPath = req.params.path || 'index.html';

    // Remove leading slash if present
    if (requestedPath.startsWith('/')) {
        requestedPath = requestedPath.substring(1);
    }

    // If path is empty or ends with /, serve index.html
    if (!requestedPath || requestedPath.endsWith('/')) {
        requestedPath = path.join(requestedPath, 'index.html');
    }

    // Construct full file path
    const filePath = path.join(__dirname, '../dist', requestedPath);

    try {
        // Check if file exists
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            // Read file
            const content = fs.readFileSync(filePath);

            // Get content type
            const contentType = mime.lookup(filePath) || 'application/octet-stream';

            // Return file
            context.res = {
                status: 200,
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000'
                },
                body: content,
                isRaw: true
            };
        } else {
            // File not found, serve index.html for SPA routing
            const indexPath = path.join(__dirname, '../dist/index.html');
            if (fs.existsSync(indexPath)) {
                const content = fs.readFileSync(indexPath, 'utf8');
                context.res = {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/html'
                    },
                    body: content
                };
            } else {
                context.res = {
                    status: 404,
                    body: 'Not Found'
                };
            }
        }
    } catch (error) {
        context.log.error('Error serving file:', error);
        context.res = {
            status: 500,
            body: 'Internal Server Error'
        };
    }
};
