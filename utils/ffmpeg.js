const child_process = require("child_process");
const ffmpeg = require("ffmpeg-static");
const { unlinkFile } = require("./helpers");

module.exports = class FfmpegHandler {
    static convertAudio(audioStream, savePath) {
        unlinkFile(savePath);

        // Start the ffmpeg child process
        const ffmpegProcess = child_process.spawn(
            ffmpeg,
            [
                // Remove ffmpeg's console spamming
                "-loglevel",
                "8",
                "-hide_banner",
                // Redirect/Enable progress messages
                "-progress",
                "pipe:3",
                // Set inputs
                "-i",
                "pipe:4",
                // Keep encoding
                "-c:v",
                "copy",
                // Define output file
                savePath,
            ],
            {
                windowsHide: true,
                stdio: [
                    /* Standard: stdin, stdout, stderr */
                    "inherit",
                    "inherit",
                    "inherit",
                    /* Custom: pipe:3, pipe:4 */
                    "pipe",
                    "pipe",
                ],
            }
        );

        audioStream.pipe(ffmpegProcess.stdio[4]);

        return {
            ffmpegProcess,
            savePath,
        };
    }

    static convertVideo(videoStream, audioStream, savePath) {
        unlinkFile(savePath);

        // Start the ffmpeg child process
        const ffmpegProcess = child_process.spawn(
            ffmpeg,
            [
                // Remove ffmpeg's console spamming
                "-loglevel",
                "8",
                "-hide_banner",
                // Redirect/Enable progress messages
                "-progress",
                "pipe:3",
                // Set inputs
                "-i",
                "pipe:4",
                "-i",
                "pipe:5",
                // Map audio & video from streams
                "-map",
                "0:a",
                "-map",
                "1:v",
                // Keep encoding
                "-c:v",
                "copy",
                // Define output file
                savePath,
            ],
            {
                windowsHide: true,
                stdio: [
                    /* Standard: stdin, stdout, stderr */
                    "inherit",
                    "inherit",
                    "inherit",
                    /* Custom: pipe:3, pipe:4, pipe:5 */
                    "pipe",
                    "pipe",
                    "pipe",
                ],
            }
        );

        audioStream.pipe(ffmpegProcess.stdio[4]);
        videoStream.pipe(ffmpegProcess.stdio[5]);

        return {
            ffmpegProcess,
            savePath,
        };
    }
};
