const fs = require("fs-extra")
const ytdl = require("ytdl-core")
const readline = require("readline");
const ffmpeg = require('ffmpeg-static');
const cp = require('child_process');
const path = require('path');
const { Console } = require("console");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const tracker = {
    start: Date.now(),
    audio: {
        downloaded: 0,
        total: Infinity
    },
    video: {
        downloaded: 0,
        total: Infinity
    },
    merged: {
        frame: 0,
        speed: '0x',
        fps: 0
    },
};

async function hello() {
    fs.existsSync("Downloads") || fs.mkdirSync("Downloads");
    console.log('\033[34m =============================');
    console.log('\033[32m Simple YTDL By Androidy#0001');
    console.log('\033[32m Version: 1.0.2');
    console.log('\033[31m =============================');
    console.log('\033[0m')
}

async function main() {
    rl.question("URL: ", function(URL) {
        console.log('\033[33mProcessing ' + URL + ' With FFMPEG and YTDL this may take awhile')

        const audio = ytdl(URL, {
                quality: 'highest'
            })
            .on('progress', (_, downloaded, total) => {
                tracker.audio = {
                    downloaded,
                    total
                };
            });
        const video = ytdl(URL, {
                quality: 'highestvideo'
            })
            .on('progress', (_, downloaded, total) => {
                tracker.video = {
                    downloaded,
                    total
                };
            });

        // Prepare the progress bar
        let progressbarHandle = null;
        const progressbarInterval = 1000;
        const showProgress = () => {
            readline.cursorTo(process.stdout, 0);
            const toMB = i => (i / 1024 / 1024).toFixed(2);

            process.stdout.write(`Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed `);
            process.stdout.write(`(${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB).${' '.repeat(10)}\n`);

            process.stdout.write(`Video  | ${(tracker.video.downloaded / tracker.video.total * 100).toFixed(2)}% processed `);
            process.stdout.write(`(${toMB(tracker.video.downloaded)}MB of ${toMB(tracker.video.total)}MB).${' '.repeat(10)}\n`);

            process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
            process.stdout.write(`(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${' '.repeat(10)}\n`);

            process.stdout.write(`running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(2)} Minutes.`);
            readline.moveCursor(process.stdout, 0, -3);
        };

        let random = (Math.random() + 1).toString(36).substring(7);

        const ffmpegProcess = cp.spawn(ffmpeg, [
            // Remove ffmpeg's console spamming
            '-loglevel', '8', '-hide_banner',
            // Redirect/Enable progress messages
            '-progress', 'pipe:3',
            // Set inputs
            '-i', 'pipe:4',
            '-i', 'pipe:5',
            // Map audio & video from streams
            '-map', '0:a',
            '-map', '1:v',
            // Keep encoding
            '-c:v', 'copy',
            // Define output file
            random + '.mp4', random + ".mp3"
        ], {
            windowsHide: true,
            stdio: [
                /* Standard: stdin, stdout, stderr */
                'inherit', 'inherit', 'inherit',
                /* Custom: pipe:3, pipe:4, pipe:5 */
                'pipe', 'pipe', 'pipe',
            ],
        });
        ffmpegProcess.on('close', () => {
            console.clear();
            console.log('\033[34m =============================');
            console.log('\033[32m Done!');
            console.log('\033[32m Video: ' + random + '.mp4');
            console.log('\033[32m Audio: ' + random + '.mp3');
            console.log('\033[31m =============================');
            console.log('\033[0m')

            var file1 = path.basename(random + '.mp4');
            var file2 = path.basename(random + '.mp3');

            var dest1 = path.resolve('Downloads', file1);
            var dest2 = path.resolve('Downloads', file2);

            fs.rename(file1, dest1, (err)=>{
                if(err) throw err;
            })

            fs.rename(file2, dest2, (err)=>{
                if(err) throw err;
            })

            process.stdout.write('\n\n\n\n');
            clearInterval(progressbarHandle);
        });

        // Link streams
        // FFmpeg creates the transformer streams and we just have to insert / read data
        ffmpegProcess.stdio[3].on('data', chunk => {
            // Start the progress bar
            if (!progressbarHandle) progressbarHandle = setInterval(showProgress, progressbarInterval);
            // Parse the param=value list returned by ffmpeg
            const lines = chunk.toString().trim().split('\n');
            const args = {};
            for (const l of lines) {
                const [key, value] = l.split('=');
                args[key.trim()] = value.trim();
            }
            tracker.merged = args;
        });
        audio.pipe(ffmpegProcess.stdio[4]);
        video.pipe(ffmpegProcess.stdio[5]);

        rl.close();
    });
}   

hello();
main();