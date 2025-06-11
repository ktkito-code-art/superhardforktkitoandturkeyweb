document.addEventListener('DOMContentLoaded', () => {
    const filesContainer = document.getElementById('filesContainer');
    const editorContainer = document.getElementById('editorContainer');
    const currentPath = document.getElementById('currentPath');
    const currentFileName = document.getElementById('currentFileName');
    const jsonEditor = document.getElementById('jsonEditor');
    const saveBtn = document.getElementById('saveBtn');
    const closeEditorBtn = document.getElementById('closeEditorBtn');

    let currentDirectory = '';
    let currentFile = null;

    // Function to show error message
    function showError(message) {
        console.error('Error:', message);
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Function to show success message
    function showSuccess(message) {
        console.log('Success:', message);
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Function to format JSON with proper indentation
    function formatJSON(json) {
        try {
            return JSON.stringify(JSON.parse(json), null, 2);
        } catch (e) {
            return json;
        }
    }

    // Function to load files and folders
    async function loadFiles(path) {
        try {
            console.log('Loading files from path:', path);
            const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'حدث خطأ أثناء تحميل الملفات');
            }
            
            console.log('Files loaded:', data);
            
            // Update breadcrumb
            updateBreadcrumb(path);
            
            // Clear current files
            filesContainer.innerHTML = '';
            
            // Add back button if not in root
            if (path !== '') {
                const backItem = createFileItem({
                    name: '..',
                    type: 'directory'
                });
                filesContainer.appendChild(backItem);
            }
            
            // Sort items: directories first, then files
            const sortedItems = [...data].sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'directory' ? -1 : 1;
            });
            
            // Create file items
            sortedItems.forEach(item => {
                const fileItem = createFileItem(item);
                filesContainer.appendChild(fileItem);
            });
        } catch (error) {
            console.error('Error loading files:', error);
            showError(error.message || 'حدث خطأ أثناء تحميل الملفات');
        }
    }

    // Function to create a file item element
    function createFileItem(item) {
        const div = document.createElement('div');
        div.className = 'file-item';
        
        const icon = document.createElement('i');
        icon.className = `file-icon fas ${getFileIcon(item)}`;
        
        const name = document.createElement('div');
        name.className = 'file-name';
        name.textContent = item.name;
        
        div.appendChild(icon);
        div.appendChild(name);
        
        div.addEventListener('click', () => handleItemClick(item));
        
        return div;
    }

    // Function to get appropriate icon for file type
    function getFileIcon(item) {
        if (item.type === 'directory') return 'fa-folder';
        if (item.name === '..') return 'fa-arrow-up';
        
        const ext = item.name.split('.').pop().toLowerCase();
        switch (ext) {
            case 'json': return 'fa-file-code';
            case 'js': return 'fa-js';
            default: return 'fa-file';
        }
    }

    // Function to handle file/folder click
    async function handleItemClick(item) {
        try {
            if (item.type === 'directory') {
                if (item.name === '..') {
                    // Go up one level
                    const parts = currentDirectory.split('/').filter(Boolean);
                    parts.pop();
                    const newPath = parts.join('/');
                    currentDirectory = newPath;
                    await loadFiles(newPath);
                } else {
                    // Enter directory
                    const newPath = currentDirectory ? `${currentDirectory}/${item.name}` : item.name;
                    currentDirectory = newPath;
                    await loadFiles(newPath);
                }
            } else if (item.name.endsWith('.json') || item.name.endsWith('.js')) {
                // Open file in editor
                const filePath = currentDirectory ? `${currentDirectory}/${item.name}` : item.name;
                await openFile(filePath);
            }
        } catch (error) {
            console.error('Error handling click:', error);
            showError('حدث خطأ أثناء فتح العنصر');
        }
    }

    // Function to update breadcrumb
    function updateBreadcrumb(path) {
        // Clear current breadcrumb
        currentPath.innerHTML = '<i class="fas fa-folder-open"></i>';
        
        // Create root link
        const rootLink = document.createElement('span');
        rootLink.textContent = 'الرئيسية';
        rootLink.className = 'breadcrumb-item';
        rootLink.onclick = () => loadFiles('');
        currentPath.appendChild(rootLink);

        // Add path parts
        const parts = path.split('/').filter(Boolean);
        if (parts.length > 0) {
            let currentPathStr = '';
            parts.forEach((part, index) => {
                // Add separator
                const separator = document.createElement('span');
                separator.textContent = ' / ';
                separator.className = 'breadcrumb-separator';
                currentPath.appendChild(separator);

                // Add path part
                currentPathStr += (index === 0 ? '' : '/') + part;
                const link = document.createElement('span');
                link.textContent = part;
                link.className = 'breadcrumb-item';
                const pathToUse = currentPathStr;
                link.onclick = () => loadFiles(pathToUse);
                currentPath.appendChild(link);
            });
        }
    }

    // Function to open file in editor
    async function openFile(filePath) {
        try {
            console.log('Opening file:', filePath);
            const response = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'حدث خطأ أثناء فتح الملف');
            }
            
            currentFile = filePath;
            currentFileName.textContent = filePath.split('/').pop();
            
            // Format JSON for display
            const content = filePath.endsWith('.json') ? data : data.content;
            jsonEditor.value = typeof content === 'object' ? 
                JSON.stringify(content, null, 2) : content;
            
            // Show editor
            editorContainer.style.display = 'block';
            
        } catch (error) {
            console.error('Error opening file:', error);
            showError(error.message || 'حدث خطأ أثناء فتح الملف');
        }
    }

    // Save file
    saveBtn.addEventListener('click', async () => {
        if (!currentFile) {
            showError('لم يتم تحديد ملف للحفظ');
            return;
        }
        
        try {
            console.log('Saving file:', currentFile);
            let content = jsonEditor.value;
            
            // Parse JSON if it's a JSON file
            if (currentFile.endsWith('.json')) {
                try {
                    content = JSON.parse(content);
                } catch (e) {
                    throw new Error('خطأ في صيغة JSON');
                }
            }
            
            const response = await fetch(`/api/file?path=${encodeURIComponent(currentFile)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(content)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'حدث خطأ أثناء حفظ الملف');
            }
            
            showSuccess('تم حفظ الملف بنجاح');
            
            // Reload files to show any changes
            await loadFiles(currentDirectory);
        } catch (error) {
            console.error('Error saving file:', error);
            showError(error.message || 'حدث خطأ أثناء حفظ الملف');
        }
    });

    // Close editor
    closeEditorBtn.addEventListener('click', () => {
        editorContainer.style.display = 'none';
        currentFile = null;
        jsonEditor.value = '';
    });

    // Initial load
    loadFiles('');
}); 