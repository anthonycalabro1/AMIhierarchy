// Tree visualization using D3.js
let treeData = null;
let treeSvg = null;
let treeG = null;
let treeRoot = null;
let tree = null;
let treeLink = null;
let treeNode = null;
let treeDiagonal = null;
let treeWidth = 0;
let treeHeight = 0;

function initializeTreeView() {
    if (!hierarchyData) {
        console.log('Tree view: hierarchyData not loaded yet');
        return;
    }
    
    console.log('Initializing tree view...');
    
    const container = document.getElementById('tree-container');
    if (!container) {
        console.error('Tree container not found');
        return;
    }
    
    // Clear existing tree
    container.innerHTML = '';
    
    // Set up dimensions
    treeWidth = container.clientWidth || 800;
    treeHeight = container.clientHeight || 600;
    
    // Convert hierarchy to tree format
    treeData = convertToTreeFormat(hierarchyData);
    
    // Set up D3 tree layout
    tree = d3.tree()
        .size([treeHeight - 100, treeWidth - 200])
        .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
    
    treeRoot = d3.hierarchy(treeData);
    treeRoot.x0 = treeHeight / 2;
    treeRoot.y0 = 0;
    
    // Create SVG
    treeSvg = d3.select('#tree-container')
        .append('svg')
        .attr('width', treeWidth)
        .attr('height', treeHeight)
        .append('g')
        .attr('transform', 'translate(100,50)');
    
    // Define diagonal for links
    treeDiagonal = d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x);
    
    // Initialize filters
    initializeTreeFilters();
    
    // Initialize expand/collapse buttons
    initializeTreeControls();
    
    // Update tree
    updateTree(treeRoot);
    
    console.log('Tree view initialized');
}

function convertToTreeFormat(hierarchyData) {
    if (!hierarchyData || hierarchyData.length === 0) return null;
    
    // Create root node
    const root = {
        name: 'Process Hierarchy',
        children: []
    };
    
    hierarchyData.forEach(l1 => {
        const l1Node = {
            name: l1.name,
            level: 1,
            data: l1,
            children: []
        };
        
        if (l1.children) {
            l1.children.forEach(l2 => {
                const l2Node = {
                    name: l2.name,
                    level: 2,
                    parent: l1.name,
                    data: l2,
                    children: []
                };
                
                if (l2.children) {
                    l2.children.forEach(l3 => {
                        l2Node.children.push({
                            name: l3.name,
                            level: 3,
                            parent: l2.name,
                            parentL1: l1.name,
                            objective: l3.objective,
                            useCaseMapping: l3.useCaseMapping,
                            itRelease: l3.itRelease,
                            data: l3
                        });
                    });
                }
                
                l1Node.children.push(l2Node);
            });
        }
        
        root.children.push(l1Node);
    });
    
    return root;
}

function updateTree(source) {
    if (!treeSvg || !tree) return;
    
    const treeData = tree(treeRoot);
    const nodes = treeData.descendants();
    const links = treeData.descendants().slice(1);
    
    // Normalize for fixed-depth
    nodes.forEach(d => {
        d.y = d.depth * 250;
    });
    
    // Update nodes
    const node = treeSvg.selectAll('g.node')
        .data(nodes, d => d.id || (d.id = d.data.name));
    
    const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${source.y0},${source.x0})`)
        .on('click', click);
    
    nodeEnter.append('circle')
        .attr('r', 8)
        .attr('class', d => {
            if (d.data.level === 1) return 'node-l1';
            if (d.data.level === 2) return 'node-l2';
            if (d.data.level === 3) return 'node-l3';
            return 'node-root';
        });
    
    nodeEnter.append('text')
        .attr('dy', '.35em')
        .attr('x', d => d.children || d._children ? -13 : 13)
        .attr('text-anchor', d => d.children || d._children ? 'end' : 'start')
        .text(d => d.data.name)
        .style('font-size', '12px')
        .style('fill', '#333');
    
    const nodeUpdate = nodeEnter.merge(node);
    
    nodeUpdate.transition()
        .duration(750)
        .attr('transform', d => `translate(${d.y},${d.x})`);
    
    nodeUpdate.select('circle')
        .attr('r', 8)
        .style('cursor', 'pointer');
    
    // Update links
    const link = treeSvg.selectAll('path.link')
        .data(links, d => d.id);
    
    const linkEnter = link.enter().insert('path', 'g')
        .attr('class', 'link')
        .attr('d', d => {
            const o = { x: source.x0, y: source.y0 };
            return treeDiagonal({ source: o, target: o });
        });
    
    linkEnter.merge(link).transition()
        .duration(750)
        .attr('d', treeDiagonal);
    
    link.exit().transition()
        .duration(750)
        .attr('d', d => {
            const o = { x: source.x, y: source.y };
            return treeDiagonal({ source: o, target: o });
        })
        .remove();
    
    node.exit().transition()
        .duration(750)
        .attr('transform', d => `translate(${source.y},${source.x})`)
        .remove();
    
    nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

function click(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    
    // Show process details
    if (d.data.data && d.data.level) {
        showProcessDetails(d.data.data);
    }
    
    updateTree(d);
}

function collapse(d) {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
    }
}

function expandAllNodes(node) {
    if (!node) node = treeRoot;
    if (node.children) {
        node.children.forEach(expandAllNodes);
    } else if (node._children) {
        node.children = node._children;
        node._children = null;
        node.children.forEach(expandAllNodes);
    }
    updateTree(node);
}

function collapseAllNodes(node) {
    if (!node) node = treeRoot;
    if (node.children) {
        node.children.forEach(collapseAllNodes);
        node._children = node.children;
        node.children = null;
    }
    updateTree(node);
}

function initializeTreeFilters() {
    const itReleaseFilter = document.getElementById('tree-filter-itrelease');
    const useCaseFilter = document.getElementById('tree-filter-usecase');
    
    if (!itReleaseFilter || !useCaseFilter) {
        console.error('Tree filter elements not found');
        return;
    }
    
    // Clear existing options (except "All")
    while (itReleaseFilter.children.length > 1) {
        itReleaseFilter.removeChild(itReleaseFilter.lastChild);
    }
    
    // Populate IT Release filter with only IT Release 1, 2, 3
    const releases = ['IT Release 1', 'IT Release 2', 'IT Release 3'];
    releases.forEach(release => {
        const option = document.createElement('option');
        option.value = release;
        option.textContent = release;
        itReleaseFilter.appendChild(option);
    });
    
    // Get unique use cases
    const useCases = new Set();
    if (hierarchyData) {
        hierarchyData.forEach(l1 => {
            if (l1.children) {
                l1.children.forEach(l2 => {
                    if (l2.children) {
                        l2.children.forEach(l3 => {
                            if (l3.useCaseMapping) {
                                useCases.add(l3.useCaseMapping);
                            }
                        });
                    }
                });
            }
        });
        Array.from(useCases).sort().forEach(useCase => {
            const option = document.createElement('option');
            option.value = useCase;
            option.textContent = useCase;
            useCaseFilter.appendChild(option);
        });
    }
    
    // Add event listeners
    itReleaseFilter.addEventListener('change', () => {
        applyTreeFilters();
    });
    
    useCaseFilter.addEventListener('change', () => {
        applyTreeFilters();
    });
}

function applyTreeFilters() {
    const itReleaseFilter = document.getElementById('tree-filter-itrelease');
    const useCaseFilter = document.getElementById('tree-filter-usecase');
    
    const selectedRelease = itReleaseFilter ? itReleaseFilter.value : '';
    const selectedUseCase = useCaseFilter ? useCaseFilter.value : '';
    
    if (!selectedRelease && !selectedUseCase) {
        // No filters, show all
        refreshTreeView();
        return;
    }
    
    // Filter hierarchy data
    const filteredHierarchy = hierarchyData.map(l1 => {
        const filteredL1 = { ...l1, children: [] };
        
        if (l1.children) {
            l1.children.forEach(l2 => {
                const filteredL2 = { ...l2, children: [] };
                
                if (l2.children) {
                    l2.children.forEach(l3 => {
                        let matches = true;
                        
                        if (selectedRelease) {
                            // Check if process references the selected release
                            const releaseMatch = l3.itRelease && l3.itRelease.includes(selectedRelease);
                            if (!releaseMatch) matches = false;
                        }
                        
                        if (selectedUseCase && matches) {
                            if (l3.useCaseMapping !== selectedUseCase) {
                                matches = false;
                            }
                        }
                        
                        if (matches) {
                            filteredL2.children.push(l3);
                        }
                    });
                }
                
                if (filteredL2.children.length > 0) {
                    filteredL1.children.push(filteredL2);
                }
            });
        }
        
        return filteredL1.children.length > 0 ? filteredL1 : null;
    }).filter(l1 => l1 !== null);
    
    // Rebuild tree with filtered data
    treeData = convertToTreeFormat(filteredHierarchy);
    if (treeData) {
        treeRoot = d3.hierarchy(treeData);
        treeRoot.x0 = treeHeight / 2;
        treeRoot.y0 = 0;
        updateTree(treeRoot);
    }
}

function refreshTreeView() {
    initializeTreeView();
}

function initializeTreeControls() {
    const expandBtn = document.getElementById('tree-expand-all');
    const collapseBtn = document.getElementById('tree-collapse-all');
    
    if (expandBtn) {
        expandBtn.addEventListener('click', () => {
            expandAllNodes();
        });
    }
    
    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            collapseAllNodes();
        });
    }
}

// Make functions available globally
window.expandAllNodes = expandAllNodes;
window.collapseAllNodes = collapseAllNodes;
