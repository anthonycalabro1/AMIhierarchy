// Global state
let hierarchyData = null;
let searchIndex = null;
let currentView = 'navigation';
let selectedProcess = null;

// Load data from JSON files
async function loadData() {
    const loadingIndicator = document.getElementById('loading-indicator');
    const mainContent = document.getElementById('main-content');
    
    try {
        loadingIndicator.style.display = 'block';
        mainContent.style.display = 'none';
        
        console.log('Loading hierarchy data...');
        const hierarchyResponse = await fetch('hierarchy-data.json');
        if (!hierarchyResponse.ok) {
            throw new Error(`Failed to load hierarchy-data.json: ${hierarchyResponse.status}`);
        }
        hierarchyData = await hierarchyResponse.json();
        console.log('Hierarchy data loaded:', hierarchyData.length, 'L1 processes');
        
        console.log('Loading search index...');
        const searchResponse = await fetch('search-index.json');
        if (!searchResponse.ok) {
            throw new Error(`Failed to load search-index.json: ${searchResponse.status}`);
        }
        searchIndex = await searchResponse.json();
        console.log('Search index loaded:', searchIndex.length, 'entries');
        
        // Initialize application
        updateStatistics();
        initializeQuickJump();
        initializeGapForm();
        initializeViewSwitching();
        
        // Initialize views
        if (typeof initializeNavigation === 'function') {
            initializeNavigation();
        }
        if (typeof initializeTreeView === 'function') {
            initializeTreeView();
        }
        if (typeof initializeSearch === 'function') {
            initializeSearch();
        }
        
        loadingIndicator.style.display = 'none';
        mainContent.style.display = 'flex';
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error loading data:', error);
        loadingIndicator.innerHTML = `
            <div style="color: #d32f2f; font-size: 1.2em; margin-bottom: 10px;">Error loading data</div>
            <div style="color: #666;">${error.message}</div>
            <div style="color: #666; margin-top: 10px;">Please ensure hierarchy-data.json and search-index.json are in the same directory.</div>
        `;
    }
}

// Update statistics
function updateStatistics() {
    if (!hierarchyData) return;
    
    const l1Count = hierarchyData.length;
    let l2Count = 0;
    let l3Count = 0;
    const itReleaseCounts = {};
    
    hierarchyData.forEach(l1 => {
        l2Count += l1.children ? l1.children.length : 0;
        if (l1.children) {
            l1.children.forEach(l2 => {
                if (l2.children) {
                    l3Count += l2.children.length;
                    l2.children.forEach(l3 => {
                        if (l3.itRelease) {
                            // Extract first IT Release number (e.g., "IT Release 1" from "IT Release 1 (retouched in IT Release 2)")
                            const match = l3.itRelease.match(/IT Release (\d+)/);
                            if (match) {
                                const releaseNum = match[1];
                                const releaseKey = `IT Release ${releaseNum}`;
                                itReleaseCounts[releaseKey] = (itReleaseCounts[releaseKey] || 0) + 1;
                            }
                        }
                    });
                }
            });
        }
    });
    
    document.getElementById('stat-l1').textContent = l1Count;
    document.getElementById('stat-l2').textContent = l2Count;
    document.getElementById('stat-l3').textContent = l3Count;
    
    updateITReleaseStats(itReleaseCounts);
}

// Update IT Release statistics
function updateITReleaseStats(itReleaseCounts) {
    const statsContainer = document.getElementById('it-release-stats');
    if (!statsContainer) return;
    
    const sortedReleases = Object.keys(itReleaseCounts).sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)[0]);
        const numB = parseInt(b.match(/\d+/)[0]);
        return numA - numB;
    });
    
    if (sortedReleases.length === 0) {
        statsContainer.innerHTML = '<div style="color: #666; font-size: 0.9em;">No IT Release data available</div>';
        return;
    }
    
    let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
    sortedReleases.forEach(release => {
        const count = itReleaseCounts[release];
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
                <span style="font-size: 0.9em; color: #333;">${release}:</span>
                <span style="font-weight: bold; color: #667eea;">${count}</span>
            </div>
        `;
    });
    html += '</div>';
    statsContainer.innerHTML = html;
}

// Show process details
function showProcessDetails(process) {
    selectedProcess = process;
    const detailPanel = document.getElementById('detail-panel');
    const gapForm = document.getElementById('gap-form');
    
    gapForm.style.display = 'none';
    detailPanel.style.display = 'block';
    
    let html = `<div class="detail-header">
        <h2>${process.name}</h2>
        <div class="detail-level">Level ${process.level} Process</div>
    </div>`;
    
    if (process.parent) {
        html += `<div class="detail-section">
            <h3>Parent Process</h3>
            <p>${process.parent}</p>
        </div>`;
    }
    
    if (process.parentL1) {
        html += `<div class="detail-section">
            <h3>Level 1 Process</h3>
            <p>${process.parentL1}</p>
        </div>`;
    }
    
    if (process.level === 3) {
        if (process.objective) {
            html += `<div class="detail-section">
                <h3>Objective</h3>
                <p>${process.objective}</p>
            </div>`;
        }
        
        if (process.useCaseMapping) {
            html += `<div class="detail-section">
                <h3>Use Case Mapping</h3>
                <p>${process.useCaseMapping}</p>
            </div>`;
        }
        
        if (process.itRelease) {
            html += `<div class="detail-section">
                <h3>IT Release</h3>
                <p>${process.itRelease}</p>
            </div>`;
        }
    }
    
    // Show similar processes
    const similarProcesses = findSimilarProcesses(process);
    if (similarProcesses.length > 0) {
        html += `<div class="detail-section">
            <h3>Similar Processes</h3>
            <div class="similar-processes">
        `;
        similarProcesses.forEach(similar => {
            html += `
                <div class="similar-process-item" onclick="selectSimilarProcess('${similar.level}', '${similar.name.replace(/'/g, "\\'")}', '${similar.parent ? similar.parent.replace(/'/g, "\\'") : ""}')">
                    <div class="similar-process-name">${similar.name}</div>
                    <div class="similar-process-level">Level ${similar.level}</div>
                </div>
            `;
        });
        html += `</div></div>`;
    }
    
    detailPanel.innerHTML = html;
}

// Find similar processes
function findSimilarProcesses(process) {
    if (!hierarchyData || !searchIndex) return [];
    
    const similar = [];
    const processKeywords = extractKeywords(process);
    
    searchIndex.forEach(item => {
        if (item.id === process.id || item.level !== process.level) return;
        
        let score = 0;
        const itemKeywords = extractKeywords(item);
        
        // Check shared keywords
        const sharedKeywords = processKeywords.filter(k => itemKeywords.includes(k));
        score += sharedKeywords.length * 2;
        
        // Same parent process
        if (process.parent && item.parent === process.parent) {
            score += 5;
        }
        
        // Same IT Release (for L3)
        if (process.level === 3 && process.itRelease && item.itRelease) {
            const processRelease = process.itRelease.match(/IT Release (\d+)/);
            const itemRelease = item.itRelease.match(/IT Release (\d+)/);
            if (processRelease && itemRelease && processRelease[1] === itemRelease[1]) {
                score += 3;
            }
        }
        
        // Similar use case mapping (for L3)
        if (process.level === 3 && process.useCaseMapping && item.useCaseMapping) {
            if (process.useCaseMapping === item.useCaseMapping) {
                score += 2;
            }
        }
        
        if (score > 0) {
            similar.push({ ...item, similarityScore: score });
        }
    });
    
    return similar.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 5);
}

// Extract keywords from process
function extractKeywords(process) {
    const text = `${process.name} ${process.objective || ''} ${process.useCaseMapping || ''}`.toLowerCase();
    return text.split(/\s+/).filter(word => word.length > 3);
}

// Select similar process
function selectSimilarProcess(level, name, parent) {
    navigateToProcess(level, name, parent);
}

// Navigate to process
function navigateToProcess(level, name, parent) {
    if (!hierarchyData) return;
    
    // Switch to navigation view
    switchView('navigation');
    
    // Find and navigate to the process
    if (level == 1) {
        const l1 = hierarchyData.find(p => p.name === name);
        if (l1 && typeof showL1Processes === 'function') {
            showL1Processes();
            setTimeout(() => {
                const element = document.querySelector(`[data-process-name="${name}"]`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.style.backgroundColor = '#e3f2fd';
                    setTimeout(() => {
                        element.style.backgroundColor = '';
                    }, 2000);
                }
            }, 100);
        }
    } else if (level == 2) {
        const l1 = hierarchyData.find(p => p.name === parent);
        if (l1 && typeof showL2Processes === 'function') {
            showL2Processes(l1);
            setTimeout(() => {
                const element = document.querySelector(`[data-process-name="${name}"]`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.style.backgroundColor = '#e3f2fd';
                    setTimeout(() => {
                        element.style.backgroundColor = '';
                    }, 2000);
                }
            }, 100);
        }
    } else if (level == 3) {
        const l1 = hierarchyData.find(p => p.name === parent || (p.children && p.children.some(l2 => l2.name === parent)));
        if (l1) {
            const l2 = l1.children.find(p => p.name === parent || (p.children && p.children.some(l3 => l3.name === name)));
            if (l2 && typeof showL3Processes === 'function') {
                showL3Processes(l2);
                setTimeout(() => {
                    const element = document.querySelector(`[data-process-name="${name}"]`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.style.backgroundColor = '#e3f2fd';
                        setTimeout(() => {
                            element.style.backgroundColor = '';
                        }, 2000);
                    }
                }, 100);
            }
        }
    }
    
    // Show process details
    const process = getProcessByLevelAndName(level, name, parent);
    if (process) {
        showProcessDetails(process);
    }
}

// Get process by level and name
function getProcessByLevelAndName(level, name, parent) {
    if (!hierarchyData) return null;
    
    if (level == 1) {
        return hierarchyData.find(p => p.name === name);
    } else if (level == 2) {
        for (const l1 of hierarchyData) {
            if (l1.children) {
                const l2 = l1.children.find(p => p.name === name && p.parent === parent);
                if (l2) return l2;
            }
        }
    } else if (level == 3) {
        for (const l1 of hierarchyData) {
            if (l1.children) {
                for (const l2 of l1.children) {
                    if (l2.children) {
                        const l3 = l2.children.find(p => p.name === name);
                        if (l3) return l3;
                    }
                }
            }
        }
    }
    return null;
}

// Initialize quick jump
function initializeQuickJump() {
    const quickJumpInput = document.getElementById('quick-jump');
    const quickJumpResults = document.getElementById('quick-jump-results');
    
    if (!quickJumpInput || !quickJumpResults) return;
    
    let selectedIndex = -1;
    let filteredResults = [];
    
    quickJumpInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        quickJumpResults.innerHTML = '';
        quickJumpResults.style.display = 'none';
        selectedIndex = -1;
        
        if (query.length < 2) return;
        
        if (!searchIndex) return;
        
        filteredResults = searchIndex.filter(item => 
            item.name.toLowerCase().includes(query) ||
            (item.searchText && item.searchText.toLowerCase().includes(query))
        ).slice(0, 10);
        
        if (filteredResults.length > 0) {
            filteredResults.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'quick-jump-item';
                div.textContent = `${item.name} (Level ${item.level})`;
                div.addEventListener('click', () => {
                    navigateToProcess(item.level, item.name, item.parent || '');
                    quickJumpInput.value = '';
                    quickJumpResults.style.display = 'none';
                });
                quickJumpResults.appendChild(div);
            });
            quickJumpResults.style.display = 'block';
        }
    });
    
    quickJumpInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, filteredResults.length - 1);
            updateQuickJumpSelection();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            updateQuickJumpSelection();
        } else if (e.key === 'Enter' && selectedIndex >= 0 && filteredResults[selectedIndex]) {
            e.preventDefault();
            const item = filteredResults[selectedIndex];
            navigateToProcess(item.level, item.name, item.parent || '');
            quickJumpInput.value = '';
            quickJumpResults.style.display = 'none';
        } else if (e.key === 'Escape') {
            quickJumpResults.style.display = 'none';
        }
    });
    
    function updateQuickJumpSelection() {
        const items = quickJumpResults.querySelectorAll('.quick-jump-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === selectedIndex);
        });
    }
    
    document.addEventListener('click', (e) => {
        if (!quickJumpInput.contains(e.target) && !quickJumpResults.contains(e.target)) {
            quickJumpResults.style.display = 'none';
        }
    });
}

// Initialize gap form
function initializeGapForm() {
    const form = document.getElementById('proposal-form');
    const cancelBtn = document.getElementById('cancel-proposal');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = {
                scenario: document.getElementById('scenario-desc').value,
                level: document.getElementById('suggested-level').value,
                parent: document.getElementById('suggested-parent').value
            };
            console.log('Process proposal:', formData);
            alert('Thank you for your proposal! This information will be reviewed.');
            form.reset();
            document.getElementById('gap-form').style.display = 'none';
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('gap-form').style.display = 'none';
        });
    }
}

// Initialize view switching
function initializeViewSwitching() {
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            switchView(view);
        });
    });
}

// Switch view
function switchView(view) {
    currentView = view;
    
    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });
    
    // Update panel visibility
    document.querySelectorAll('.view-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const targetPanel = document.getElementById(`${view}-view`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing application...');
    loadData();
});
