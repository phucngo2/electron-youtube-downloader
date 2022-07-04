const { humanFileSize, backslashEscape } = require("./helpers");

module.exports = {
    btnDownloadStr: (itag) => `
        <button class="ui icon right labeled button fs-14 green" style="margin-right: 0.75rem;" onclick="btnDownloadClick('${itag}')">
            Download
            <i aria-hidden="true" class="right download icon"></i>
        </button>`,

    btnPreviewStr: (url) => `
        <a class="ui icon right labeled button fs-14" href="${url}" target="_blank" rel="noreferrer">
            Preview
            <i aria-hidden="true" class="right play icon"></i>
        </a>`,

    btnCopyKeywordsStr: `
        <div class="floating-copy-container">
            <i
                aria-hidden="true"
                class="copy circular icon color-grey bg-white"
                style="cursor: pointer;"
                data-content="Copied to clipboard!"
                id="btnCopyKeywords"
                onclick="copyKeywordstoClipboard()"
            ></i>
        </div>`,

    keywordItemStr: (keyword) =>
        `<div class="keyword-item border">${keyword}</div>`,

    downloadProgressStr: (downloaded, total, percent) => `
        <div id="downloadText">
            Downloading... ${humanFileSize(downloaded)}/${humanFileSize(
        total
    )} (${percent}%)
        </div>
        <div class="ui indicating progress mt-4" data-percent="0" id="downloadProgressBar">
            <div class="bar">
                <div class="progress"></div>
            </div>
        </div>`,

    downloadDoneStr: (currentSaveDir, savePath) => `
        <br>
        <div class="ui buttons pb-3">
            <button class="ui primary button" onclick="openPath('${backslashEscape(
                currentSaveDir
            )}')">Open file location</button>
            <div class="or"></div>
            <button class="ui positive button" onclick="openPath('${backslashEscape(
                savePath
            )}')">Open file</button>
            <div class="or"></div>
            <button class="ui button" onclick="closeDialog()">Close dialog</button>
        </div>`,
};
