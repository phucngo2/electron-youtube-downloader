const {
    BrowserWindow,
    app,
    ipcMain,
    dialog,
    shell,
    clipboard,
} = require("electron");
const remoteMain = require("@electron/remote/main");
const path = require("path");

const YoutubeDownloader = require("./utils/ytdl");
const FfmpegHandler = require("./utils/ffmpeg");

const { removeIllegalCharactersFromFilename } = require("./utils/helpers");
remoteMain.initialize();

//#region App Setup

let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        height: 720,
        width: 960,
        webPreferences: {
            // preload: path.join(app.getAppPath(), "renderer.js"),
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
        },
        autoHideMenuBar: true, // Hide the menu bar
        icon: path.join(__dirname, "/src/static/icon.png"),
        title: "Youtube Stalker",
    });

    // Remove menu (File, Edit,...)
    // mainWindow.removeMenu();

    remoteMain.enable(mainWindow.webContents);

    // Default savepath: Downloads directory
    global["savePath"] = path.join(process.env.USERPROFILE, "/Downloads");

    // Load HTML file
    mainWindow.loadFile("src/index.html");
};

app.whenReady().then(createWindow);

//#endregion

//#region Event Handlers

/** Reload the app */
ipcMain.on("reload", () => {
    mainWindow.webContents.reloadIgnoringCache();
});

/** Set global variable */
ipcMain.on("setGlobalVariable", (_, key, value) => {
    global[key] = value;
});

/** Open dialog to get directory path to save files */
ipcMain.on("openDirDialog", function () {
    dialog
        .showOpenDialog({
            title: "Open File",
            properties: ["openDirectory"], // Choose directory instead of file
        })
        .then((result) => {
            global["savePath"] = result.filePaths[0];
            mainWindow.webContents.send("openDirDialogResult");
        });
});

/** Get video info by using ytdl */
ipcMain.on("getVideoInfo", async function (_, url) {
    let videoInfo = await YoutubeDownloader.listFormats(url);

    // Cannot find video
    if (videoInfo.error) {
        return mainWindow.webContents.send(
            "getVideoInfoError",
            videoInfo.error
        );
    }

    // Set video info to global to use later
    // For download
    global["currentUrl"] = url;
    global["currentTitle"] = removeIllegalCharactersFromFilename(
        videoInfo.title
    );

    // For copy keywords to clipboard
    if (videoInfo.keywords && videoInfo.keywords.length > 0) {
        global["currentKeywords"] = videoInfo.keywords.join(",");
    } else {
        global["currentKeywords"] = "";
    }

    // Success
    mainWindow.webContents.send("getVideoInfoSuccess", videoInfo);
});

/** Download audio and convert to mp3 */
ipcMain.on("downloadAudio", async function (_, itag) {
    // Get audio stream
    let audioStream = await YoutubeDownloader.download(
        global["currentUrl"],
        itag
    );

    // Send current loading state to renderer
    audioStream.on("progress", (_, downloaded, total) => {
        mainWindow.webContents.send("downloadProgress", {
            downloaded,
            total,
        });
    });

    // Convert to mp3
    let savePath = `${global["savePath"]}\\${global["currentTitle"]}.mp3`;
    const { ffmpegProcess } = FfmpegHandler.convertAudio(audioStream, savePath);

    // ffmpegProcess.stdio[3].on("data", (chunk) => {
    //     console.log(chunk.toString());

    //     // Parse the param=value list returned by ffmpeg
    //     const lines = chunk.toString().trim().split("\n");
    //     const args = {};
    //     for (const l of lines) {
    //         const [key, value] = l.split("=");
    //         args[key.trim()] = value.trim();
    //     }

    //     // console.log(args);
    // });

    // On close ffmpeg process
    ffmpegProcess.on("close", (code) => {
        // Status 0 = success
        if (code === 0) {
            mainWindow.webContents.send("downloadSuccess", savePath);
        } else {
            mainWindow.webContents.send("downloadError", savePath);
        }
    });
});

/** Download audio and convert to mp4 */
ipcMain.on("downloadVideo", async function (_, itag) {
    // Get video stream
    let videoStream = await YoutubeDownloader.download(
        global["currentUrl"],
        itag
    );

    // Get audio stream
    let audioStream = await YoutubeDownloader.download(
        global["currentUrl"],
        "highestaudio"
    );

    // Send current loading state to renderer
    videoStream.on("progress", (_, downloaded, total) => {
        mainWindow.webContents.send("downloadProgress", {
            downloaded,
            total,
        });
    });

    // Encode to mp4
    let savePath = `${global["savePath"]}\\${global["currentTitle"]}.mp4`;
    const { ffmpegProcess } = FfmpegHandler.convertVideo(
        videoStream,
        audioStream,
        savePath
    );

    // On close ffmpeg process
    ffmpegProcess.on("close", (code) => {
        // Status 0 = success
        if (code === 0) {
            mainWindow.webContents.send("downloadSuccess", savePath);
        } else {
            mainWindow.webContents.send("downloadError", savePath);
        }
    });
});

/** Copy video's keywords to clipboard */
ipcMain.on("copyKeywordsToClipboard", () => {
    clipboard.writeText(global["currentKeywords"]);
});

/** Open video after download */
ipcMain.on("openPath", (_, path) => {
    shell.openPath(path);
});

ipcMain.on("corn", () => {
    shell.openExternal("https://www.youtube.com/c/Ng%C3%B4B%E1%BA%AFp");
});

ipcMain.on("close", () => {
    app.exit(0);
});

//#endregion
