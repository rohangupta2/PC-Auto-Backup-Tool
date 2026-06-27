const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ALGORITHM = 'aes-256-cbc';

// Terminal se input lene ke liye interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Aaj ki date default nikalne ke liye
function getTodayDate() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

function unlockEvidence(encryptedFilePath, outputZipPath, datePassword) {
    try {
        console.log(`\n🔓 File unlock kar raha hoon using date key: [${datePassword}]`);
        
        // Date ko password ki tarah use karke key banayenge
        const KEY = crypto.scryptSync(datePassword, 'salt', 32);

        const fileBuffer = fs.readFileSync(encryptedFilePath);
        const iv = fileBuffer.subarray(0, 16);
        const encryptedData = fileBuffer.subarray(16);

        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        let decrypted = decipher.update(encryptedData);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        fs.writeFileSync(outputZipPath, decrypted);
        console.log(`✅ SUCCESS! Asli zip file ban gayi: ${outputZipPath}\n`);
        
    } catch (err) {
        console.error("\n❌ ERROR: Decryption fail! Shayad aapne galat date daali hai ya file corrupt hai.\n");
    }
}

function findLatestEncFile() {
    const currentDir = process.cwd();
    const files = fs.readdirSync(currentDir);
    const encFiles = files.filter(file => file.endsWith('.enc'));
    
    if (encFiles.length === 0) return null;

    let latestFile = encFiles[0];
    let latestTime = fs.statSync(path.join(currentDir, latestFile)).mtimeMs;

    for (let i = 1; i < encFiles.length; i++) {
        let time = fs.statSync(path.join(currentDir, encFiles[i])).mtimeMs;
        if (time > latestTime) {
            latestTime = time;
            latestFile = encFiles[i];
        }
    }
    return latestFile;
}

// --- Main Execution ---
const targetFile = findLatestEncFile();

if (!targetFile) {
    console.log("\n❌ Koi .enc file nahi mili is folder mein!\n");
    process.exit(0);
}

console.log(`\n🔎 Latest encrypted file mili: ${targetFile}`);

// User se pucho ki kis din ka backup hai
rl.question(`Enter Incident Date (DD-MM-YYYY) [Press Enter for today: ${getTodayDate()}]: `, (answer) => {
    // Agar user ne kuch type nahi kiya, toh aaj ki date utha lo
    const datePassword = answer.trim() || getTodayDate();
    
    let cleanName = targetFile.replace('.enc', '').replace('.zip', '');
    const finalOutputFile = 'Unlocked_' + cleanName + '.zip';
    
    unlockEvidence(targetFile, finalOutputFile, datePassword);
    rl.close();
});