const fs = require("fs");

/** Filter video formats because ytdl return too much formats */
module.exports.filterFormats = (formats) => {
    const dataConvert = formats.filter(
        (format) =>
            format.qualityLabel &&
            (format.qualityLabel.startsWith("480") ||
                format.qualityLabel.startsWith("720") ||
                format.qualityLabel.startsWith("1080") ||
                format.qualityLabel.startsWith("1440") ||
                format.qualityLabel.startsWith("2160"))
    );

    dataConvert.unshift({
        quality: "highestvideo",
        container: "mp4",
        contentLength: "Very large!",
        itag: "highestvideo",
        mimeType: "video/mp4",
        qualityLabel: "Highest Quality",
        hasAudio: false,
        hasVideo: true,
        fps: 0,
        bitrate: 0,
        audioQuality: "",
        url: "",
    });

    dataConvert.push({
        quality: "highestaudio",
        container: "mp3",
        contentLength: "Very large!",
        itag: "highestaudio",
        mimeType: "audio/mpeg",
        qualityLabel: "Audio",
        hasAudio: true,
        hasVideo: false,
        fps: 0,
        bitrate: 0,
        audioQuality: "highestaudio",
        url: "",
    });

    return dataConvert;
};

/**
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 */
module.exports.humanFileSize = (bytes, si = false, dp = 1) => {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + " B";
    }

    const units = si
        ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
        : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
    let u = -1;
    const r = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (
        Math.round(Math.abs(bytes) * r) / r >= thresh &&
        u < units.length - 1
    );

    return bytes.toFixed(dp) + " " + units[u];
};

/** Remove exist file */
module.exports.unlinkFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

/** Check whether file exist or not */
module.exports.checkFileExist = (filePath) => {
    return fs.existsSync(filePath);
};

/** Remove illegal characters from file name to save file */
module.exports.removeIllegalCharactersFromFilename = (filename) => {
    return filename.replace(/[/\\?%*:|"<>]/g, "-");
};

/** Convert backslash \ to double backslash \\ (str escape) */
module.exports.backslashEscape = (str) => {
    return str.split(String.fromCharCode(92)).join(String.fromCharCode(92, 92));
};
