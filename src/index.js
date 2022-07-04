const { ipcRenderer } = require("electron");
const remote = require("@electron/remote");
const Swal = require("sweetalert2");
const { filterFormats, humanFileSize } = require("../utils/helpers");
const {
    btnDownloadStr,
    btnPreviewStr,
    downloadDoneStr,
    downloadProgressStr,
    btnCopyKeywordsStr,
    keywordItemStr,
} = require("../utils/constants");

//#region Front-end logic

jQuery(function () {
    /** Set default save path to input box when initialize app */
    $("#inputSavePath").val(remote.getGlobal("savePath"));

    /** Click on app title => reload the app */
    $("#appTitle").on("click", () => {
        ipcRenderer.send("reload");
    });

    /** Submit search form to get video formats */
    $("#searchForm").on("submit", function (e) {
        e.preventDefault();

        let searchValue = $("#inputYoutubeUrl").val();

        // Empty value
        if (!searchValue?.trim()) {
            return Swal.fire({
                title: "Error!",
                text: "Please type in something...",
                icon: "error",
                confirmButtonText: "Ok...",
            });
        }

        showLoading();

        // Send search value to main process
        ipcRenderer.send("getVideoInfo", searchValue);
    });

    /** Click change save path => call main to open dialog */
    $("#btnSavePath").on("click", function (e) {
        e.preventDefault();

        ipcRenderer.send("openDirDialog");
    });

    /** Pause app */
    $("#btnPause").on("click", function () {
        ipcRenderer.send("corn");
    });

    /** Close app */
    $("#btnStop").on("click", function () {
        ipcRenderer.send("close");
    });
});

/** Click download button from formats table */
function btnDownloadClick(itag) {
    let title = remote.getGlobal("currentTitle");

    Swal.fire({
        title: `${title}`,
        width: 540,
        padding: "2.4rem",
        color: "#716add",
        backdrop: `
            rgba(0,0,0,.4)
            url("./static/nyan-cat.gif")
            left top
            no-repeat
        `,
        allowOutsideClick: false, // prevent user click outside to close
        showCancelButton: false, // hide cancel button
        showConfirmButton: false, // hide confirm button
        html: "<div id='downloadProgress'>Please wait while we prepare the video...</div>",
    });

    if (itag === "highestaudio") {
        ipcRenderer.send("downloadAudio", itag);
    } else {
        ipcRenderer.send("downloadVideo", itag);
    }
}

/** Open file after download */
function openPath(path) {
    ipcRenderer.send("openPath", path);
}

/** Close Swal dialog */
function closeDialog() {
    Swal.close();
}

/** Copy video's keywords to clipboard */
function copyKeywordstoClipboard() {
    ipcRenderer.send("copyKeywordsToClipboard");
}

//#endregion

//#region Ipc Event Handlers

/** After user choose dir => set dir and display to UI */
ipcRenderer.on("openDirDialogResult", function (_) {
    let savePath = remote.getGlobal("savePath");

    if (savePath) {
        $("#inputSavePath").val(savePath);
    }
});

/** Get video info success => display video info and download formats */
ipcRenderer.on(
    "getVideoInfoSuccess",
    function (_, { formats, title, embed, keywords }) {
        // Could not found any format
        if (formats.length === 0) {
            Swal.fire({
                title: "Error!",
                text: "Sorry, no format found...! :((",
                icon: "error",
                confirmButtonText: "Ok...",
            });

            return;
        }

        // Display title
        $("#videoTitle").html(`🌠 ${title}`);

        // Display video preview
        $("#videoPreview").attr("src", embed);

        // Display keywords
        $("#videoKeywords").html(btnCopyKeywordsStr);

        if (keywords?.length > 0) {
            for (let keyword of keywords) {
                $("#videoKeywords").append(keywordItemStr(keyword));
            }
        } else {
            $("#videoKeywords").html(
                `<div class="p-2">No keywords found...</div>`
            );
        }

        // Set event listener for copy button
        $("#btnCopyKeywords").popup({
            on: "click",
        });

        // Display formats
        $("#tbodyFormats").html("");

        // There are too much format => filter them
        formats = filterFormats(formats);

        for (let format of formats) {
            let trElement = $("<tr>");

            let tdQuality = $("<td>");
            tdQuality.text(
                format.hasAudio && !format.hasVideo
                    ? "Audio"
                    : format.qualityLabel
            );

            let tdContainer = $("<td>");
            tdContainer.text(format.container);

            let tdOriginalSize = $("<td>");
            tdOriginalSize.text(
                isNaN(format.contentLength)
                    ? "-"
                    : humanFileSize(Number.parseInt(format.contentLength))
            );

            let tdActions = $("<td>");
            tdActions.html(
                format.url
                    ? btnDownloadStr(format.itag) + btnPreviewStr(format.url)
                    : btnDownloadStr(format.itag)
            );

            trElement.append(tdQuality, tdOriginalSize, tdContainer, tdActions);

            $("#tbodyFormats").append(trElement);
        }

        showContent();
    }
);

/** Cannot get video info => show error */
ipcRenderer.on("getVideoInfoError", function (_, errorMessage) {
    $("#appLoading").addClass("d-none");

    return Swal.fire({
        title: "Error!",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "Ok...",
    });
});

var isDownloading = false;

/** Display downloading stuck at 99% =)) */
ipcRenderer.on("downloadProgress", function (_, { downloaded, total }) {
    let percent = Math.floor((downloaded / total) * 100);

    if (!isDownloading) {
        $("#downloadProgress").html(
            downloadProgressStr(downloaded, total, percent)
        );

        isDownloading = true;
        return;
    }

    // Text: 20 Mb / 80 Mb
    $("#downloadText").text(
        `Downloading... ${humanFileSize(downloaded)}/${humanFileSize(
            total
        )} (${percent}%)`
    );

    // Progress bar
    $("#downloadProgressBar").progress({
        percent,
    });
});

/** Download 100% done */
ipcRenderer.on("downloadSuccess", function (_, savePath) {
    let currentSaveDir = remote.getGlobal("savePath");

    // Display buttons to open file location and open file
    $("#downloadProgress").append(downloadDoneStr(currentSaveDir, savePath));

    isDownloading = false;
});

ipcRenderer.on("downloadFailed", function (_) {
    $("#downloadProgress").text(`Oops! Some error happens :'<`);
    $("#downloadProgress").addClass("text-danger");

    isDownloading = false;
});

//#endregion

//#region Loading handle

// Display app loading
function showLoading() {
    $("#appContent").addClass("d-none");
    $("#appLoading").removeClass("d-none");
}

// Display app content
function showContent() {
    $("#appContent").removeClass("d-none");
    $("#appLoading").addClass("d-none");
}

//#endregion
