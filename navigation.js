// Navigation view functionality
let navigationHistory = [];

function initializeNavigation() {
    if (!hierarchyData) return;
    showL1Processes();
}

function showL1Processes() {
    navigationHistory = [];
    updateBreadcrumb();
    
    const content = document.getElementById('navigation-content');
    if (!content || !hierarchyData) return;
    
    content.innerHTML = '<div class="process-list">';
    
    hierarchyData.forEach(l1 => {
        const div = document.createElement('div');
        div.className = 'process-item l1-process';
        div.setAttribute('data-process-name', l1.name);
        div.innerHTML = `
            <div class="process-name">${l1.name}</div>
            <div class="process-meta">Level 1 Process</div>
        `;
        div.addEventListener('click', () => {
            showL2Processes(l1);
            showProcessDetails(l1);
        });
        content.appendChild(div);
    });
    
    content.innerHTML += '</div>';
}

function showL2Processes(l1Process) {
    navigationHistory = [l1Process];
    updateBreadcrumb();
    
    const content = document.getElementById('navigation-content');
    if (!content || !l1Process.children) return;
    
    content.innerHTML = '<div class="process-list">';
    
    l1Process.children.forEach(l2 => {
        const div = document.createElement('div');
        div.className = 'process-item l2-process';
        div.setAttribute('data-process-name', l2.name);
        div.innerHTML = `
            <div class="process-name">${l2.name}</div>
            <div class="process-meta">Level 2 Process</div>
        `;
        div.addEventListener('click', () => {
            showL3Processes(l2);
            showProcessDetails(l2);
        });
        content.appendChild(div);
    });
    
    content.innerHTML += '</div>';
}

function showL3Processes(l2Process) {
    const l1Process = navigationHistory[0];
    navigationHistory = [l1Process, l2Process];
    updateBreadcrumb();
    
    const content = document.getElementById('navigation-content');
    if (!content || !l2Process.children) return;
    
    content.innerHTML = '<div class="process-list">';
    
    l2Process.children.forEach(l3 => {
        const div = document.createElement('div');
        div.className = 'process-item l3-process';
        div.setAttribute('data-process-name', l3.name);
        div.innerHTML = `
            <div class="process-name">${l3.name}</div>
            <div class="process-meta">Level 3 Process</div>
            ${l3.objective ? `<div class="process-objective">${l3.objective}</div>` : ''}
        `;
        div.addEventListener('click', () => {
            showProcessDetails(l3);
        });
        content.appendChild(div);
    });
    
    content.innerHTML += '</div>';
}

function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    if (!breadcrumb) return;
    
    breadcrumb.innerHTML = '';
    
    if (navigationHistory.length === 0) {
        breadcrumb.innerHTML = '<span class="breadcrumb-item">All Processes</span>';
        return;
    }
    
    // Add "All Processes" as first item
    const allItem = document.createElement('span');
    allItem.className = 'breadcrumb-item';
    allItem.textContent = 'All Processes';
    allItem.style.cursor = 'pointer';
    allItem.style.color = '#667eea';
    allItem.addEventListener('click', () => {
        showL1Processes();
    });
    breadcrumb.appendChild(allItem);
    
    // Add history items
    navigationHistory.forEach((process, index) => {
        const separator = document.createElement('span');
        separator.className = 'breadcrumb-separator';
        separator.textContent = ' > ';
        breadcrumb.appendChild(separator);
        
        const item = document.createElement('span');
        item.className = 'breadcrumb-item';
        item.textContent = process.name;
        
        if (index < navigationHistory.length - 1) {
            item.style.cursor = 'pointer';
            item.style.color = '#667eea';
            item.addEventListener('click', () => {
                if (index === 0) {
                    showL2Processes(process);
                } else {
                    showL3Processes(process);
                }
            });
        }
        
        breadcrumb.appendChild(item);
    });
}

// Make functions available globally for navigation
window.showL1Processes = showL1Processes;
window.showL2Processes = showL2Processes;
window.showL3Processes = showL3Processes;
