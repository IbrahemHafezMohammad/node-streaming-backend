const express = require("express");
const fs = require('fs');

const app = express();

const videoFileMap = {
    'cdn': 'videos/cdn.mp4',
    'generated-pass': 'videos/generated-pass.mp4',
    'get-post': 'videos/get-post.mp4',
}

app.get('/videos/:filename', (req, res) => {
    const fileName = req.params.filename;
    const filePath = videoFileMap[fileName];
    if (!filePath) {
        return res.status(404).send('File not found');
    }

    fs.stat(filePath, (err, stat) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server Error');
        }

        const fileSize = stat.size;
        const range = req.headers.range;
        
        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1]
                ? parseInt(parts[1], 10)
                : Math.min(start + 10**6 - 1, fileSize - 1);  // Adjusted end calculation

            const chunkSize = end - start + 1;
            const file = fs.createReadStream(filePath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4'
            };

            res.writeHead(206, head);
            file.pipe(res);

            file.on('error', function(err) {
                console.error('Stream error:', err);
                res.status(500).send('Stream Error');
            });
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4'
            };
            res.writeHead(200, head);
            fs.createReadStream(filePath).pipe(res);
        }
    });
});

app.listen(5000, () => {
    console.log('server is listening on port 5000')
})