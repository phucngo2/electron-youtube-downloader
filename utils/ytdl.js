const ytdl = require("ytdl-core");

module.exports = class YoutubeDownloader {
    static async listFormats(url) {
        try {
            const video = await ytdl.getInfo(url);

            return {
                videoUrl: video.videoDetails.video_url,
                formats: video.formats,
                thumbnail: video.videoDetails.thumbnails.at(-1).url,
                title: video.videoDetails.title,
                keywords: video.videoDetails.keywords,
                embed: video.videoDetails.embed.iframeUrl,
            };
        } catch (error) {
            console.log(error.message);

            return {
                error: error.message,
            };
        }
    }

    static async download(url, quality) {
        return ytdl(url, {
            quality: quality,
        });
    }
};
