const fs = require("fs")
const ytdl = require("ytdl-core")
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });


async function hello()
{
    console.log('\033[34m =============================');
    console.log('\033[32m Simple YTDL By Androidy#0001');
    console.log('\033[32m Version: 1.0.0');
    console.log('\033[31m =============================');
    console.log('\033[0m')
}

async function main()
{
    rl.question("URL: ", function (URL) {
         console.log('\033[33m Downloading: ' + URL)
         ytdl(URL)
        .pipe(fs.createWriteStream('video.mp4'));
        rl.close();
      });
}

hello();
main();

