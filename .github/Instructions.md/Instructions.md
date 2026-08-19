# Instructions

## Windows File Backup & Copying Rule (robocopy)
When creating project backups or copying files and folder structures on Windows, ALWAYS use `robocopy` with optimized flags instead of PowerShell `Copy-Item` or Node `fs.cpSync`.

### Standard Sweet-Spot Command:
```cmd
robocopy "<source_dir>" "<dest_dir>" /E /MT:16 /R:1 /W:1 /XD node_modules .git build .gradle .idea .vite dist bin obj /NP /NFL /NDL