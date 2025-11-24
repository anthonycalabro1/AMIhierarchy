// Search functionality with fuzzy matching, autocomplete, and natural language queries
let autocompleteResults = [];
let selectedAutocompleteIndex = -1;

function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput || !searchBtn) return;
    
    searchBtn.addEventListener('click', () => {
        performSearch();
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length >= 2) {
            showAutocomplete(query);
        } else {
            hideAutocomplete();
        }
    });
    
    searchInput.addEventListener('keydown', (e) => {
        const autocompleteDiv = document.getElementById('autocomplete-results');
        if (!autocompleteDiv || autocompleteDiv.style.display === 'none') return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedAutocompleteIndex = Math.min(selectedAutocompleteIndex + 1, autocompleteResults.length - 1);
            updateAutocompleteSelection();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedAutocompleteIndex = Math.max(selectedAutocompleteIndex - 1, -1);
            updateAutocompleteSelection();
        } else if (e.key === 'Enter' && selectedAutocompleteIndex >= 0 && autocompleteResults[selectedAutocompleteIndex]) {
            e.preventDefault();
            searchInput.value = autocompleteResults[selectedAutocompleteIndex].name;
            hideAutocomplete();
            performSearch();
        } else if (e.key === 'Escape') {
            hideAutocomplete();
        }
    });
    
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !document.getElementById('autocomplete-results')?.contains(e.target)) {
            hideAutocomplete();
        }
    });
}

function performSearch(queryOverride) {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const gapForm = document.getElementById('gap-form');
    
    if (!searchInput || !searchResults) return;
    
    const query = (queryOverride || searchInput.value).trim();
    
    if (!query) {
        searchResults.innerHTML = '<p>Please enter a search query.</p>';
        return;
    }
    
    if (!searchIndex) {
        searchResults.innerHTML = '<p>Search index not loaded.</p>';
        return;
    }
    
    hideAutocomplete();
    
    // Check for natural language query
    const nlQuery = parseNaturalLanguageQuery(query, query);
    let results = [];
    
    if (nlQuery.isNaturalLanguage) {
        results = performNaturalLanguageSearch(nlQuery);
    } else {
        results = performFuzzySearch(searchIndex, query);
    }
    
    displaySearchResults(results, query, nlQuery.isNaturalLanguage);
    
    // Show gap form if no results
    if (results.length === 0) {
        gapForm.style.display = 'block';
    } else {
        gapForm.style.display = 'none';
    }
}

function performFuzzySearch(searchIndex, query) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    const results = [];
    
    searchIndex.forEach(item => {
        let score = 0;
        const searchText = (item.searchText || item.name || '').toLowerCase();
        
        // Exact match
        if (searchText === queryLower) {
            score = 100;
        }
        // Starts with query
        else if (searchText.startsWith(queryLower)) {
            score = 80;
        }
        // Contains query
        else if (searchText.includes(queryLower)) {
            score = 60;
        }
        // Fuzzy matching for each word
        else {
            let wordMatches = 0;
            queryWords.forEach(word => {
                if (word.length > 2 && searchText.includes(word)) {
                    wordMatches++;
                } else {
                    // Levenshtein distance for fuzzy matching
                    const words = searchText.split(/\s+/);
                    words.forEach(searchWord => {
                        const distance = levenshteinDistance(word, searchWord);
                        const maxLen = Math.max(word.length, searchWord.length);
                        if (maxLen > 0 && distance / maxLen < 0.3) {
                            wordMatches += (1 - distance / maxLen);
                        }
                    });
                }
            });
            if (wordMatches > 0) {
                score = 40 * (wordMatches / queryWords.length);
            }
        }
        
        if (score > 0) {
            results.push({
                ...item,
                relevanceScore: score,
                matchedText: item.name
            });
        }
    });
    
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 50);
}

function performNaturalLanguageSearch(nlQuery) {
    const results = [];
    const keywords = nlQuery.keywords.map(k => k.toLowerCase());
    
    searchIndex.forEach(item => {
        let score = 0;
        const searchText = (item.searchText || item.name || '').toLowerCase();
        const objective = (item.objective || '').toLowerCase();
        const useCase = (item.useCaseMapping || '').toLowerCase();
        
        // Check keywords in different fields
        keywords.forEach(keyword => {
            if (searchText.includes(keyword)) score += 3;
            if (objective.includes(keyword)) score += 5; // Objectives are more important
            if (useCase.includes(keyword)) score += 2;
        });
        
        // Intent-based matching
        if (nlQuery.intent === 'find' || nlQuery.intent === 'show') {
            // Already handled by keyword matching
        }
        
        if (score > 0) {
            results.push({
                ...item,
                relevanceScore: score,
                matchedText: item.name,
                isNaturalLanguage: true
            });
        }
    });
    
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 50);
}

function parseNaturalLanguageQuery(query, originalQuery) {
    const queryLower = query.toLowerCase();
    
    // Check for natural language patterns
    const nlPatterns = [
        /(?:find|show|list|get|search for|what are|which).*?(?:process|processes)/i,
        /process(?:es)?.*?(?:for|that|which|handling|managing|dealing with)/i,
        /(?:how to|ways to|methods to)/i
    ];
    
    const isNaturalLanguage = nlPatterns.some(pattern => pattern.test(query));
    
    // Extract keywords
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'find', 'show', 'list', 'get', 'search', 'for', 'that', 'which', 'what', 'process', 'processes', 'handling', 'managing', 'dealing'];
    
    let keywords = queryLower
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.includes(word));
    
    // Detect intent
    let intent = 'search';
    if (queryLower.includes('find') || queryLower.includes('show') || queryLower.includes('list')) {
        intent = 'find';
    }
    
    return {
        isNaturalLanguage,
        keywords,
        intent,
        originalQuery
    };
}

function displaySearchResults(results, query, isNaturalLanguage) {
    const searchResults = document.getElementById('search-results');
    if (!searchResults) return;
    
    if (results.length === 0) {
        searchResults.innerHTML = '<p>No results found. Try different search terms or use the form below to propose a new process.</p>';
        return;
    }
    
    // Group by level
    const byLevel = { 1: [], 2: [], 3: [] };
    results.forEach(result => {
        if (byLevel[result.level]) {
            byLevel[result.level].push(result);
        }
    });
    
    let html = '';
    if (isNaturalLanguage) {
        html += '<div class="search-badge nl-badge">Natural Language Query</div>';
    }
    html += `<div class="search-results-summary">Found ${results.length} result${results.length !== 1 ? 's' : ''}</div>`;
    
    [1, 2, 3].forEach(level => {
        if (byLevel[level].length > 0) {
            html += `<div class="search-results-group">
                <h3>Level ${level} Processes (${byLevel[level].length})</h3>
                <div class="search-results-list">
            `;
            
            byLevel[level].forEach(result => {
                html += createSearchResultItem(result, query);
            });
            
            html += `</div></div>`;
        }
    });
    
    searchResults.innerHTML = html;
}

function createSearchResultItem(result, query) {
    const relevanceBadge = result.relevanceScore >= 80 ? '<span class="relevance-badge high">High Match</span>' : 
                          result.relevanceScore >= 50 ? '<span class="relevance-badge medium">Medium Match</span>' : 
                          '<span class="relevance-badge low">Low Match</span>';
    
    return `
        <div class="search-result-item" onclick="navigateToProcess(${result.level}, '${result.name.replace(/'/g, "\\'")}', '${(result.parent || '').replace(/'/g, "\\'")}')">
            <div class="search-result-header">
                <div class="search-result-name">${highlightText(result.name, query)}</div>
                ${relevanceBadge}
            </div>
            ${result.parent ? `<div class="search-result-parent">Parent: ${result.parent}</div>` : ''}
            ${result.objective ? `<div class="search-result-objective">${highlightText(result.objective.substring(0, 150), query)}${result.objective.length > 150 ? '...' : ''}</div>` : ''}
        </div>
    `;
}

function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function showAutocomplete(query) {
    if (!searchIndex) return;
    
    const queryLower = query.toLowerCase();
    const results = searchIndex
        .filter(item => {
            const searchText = (item.searchText || item.name || '').toLowerCase();
            return searchText.includes(queryLower);
        })
        .slice(0, 8);
    
    autocompleteResults = results;
    selectedAutocompleteIndex = -1;
    
    let autocompleteDiv = document.getElementById('autocomplete-results');
    if (!autocompleteDiv) {
        autocompleteDiv = document.createElement('div');
        autocompleteDiv.id = 'autocomplete-results';
        autocompleteDiv.className = 'autocomplete-results';
        const searchInput = document.getElementById('search-input');
        if (searchInput && searchInput.parentNode) {
            searchInput.parentNode.appendChild(autocompleteDiv);
        }
    }
    
    if (results.length === 0) {
        autocompleteDiv.style.display = 'none';
        return;
    }
    
    autocompleteDiv.innerHTML = results.map((item, index) => {
        return `<div class="autocomplete-item ${index === selectedAutocompleteIndex ? 'selected' : ''}" data-index="${index}">
            ${item.name} <span class="autocomplete-level">(Level ${item.level})</span>
        </div>`;
    }).join('');
    
    autocompleteDiv.style.display = 'block';
    
    // Add click handlers
    autocompleteDiv.querySelectorAll('.autocomplete-item').forEach((item, index) => {
        item.addEventListener('click', () => {
            const result = results[index];
            document.getElementById('search-input').value = result.name;
            hideAutocomplete();
            performSearch();
        });
    });
}

function hideAutocomplete() {
    const autocompleteDiv = document.getElementById('autocomplete-results');
    if (autocompleteDiv) {
        autocompleteDiv.style.display = 'none';
    }
}

function updateAutocompleteSelection() {
    const autocompleteDiv = document.getElementById('autocomplete-results');
    if (!autocompleteDiv) return;
    
    const items = autocompleteDiv.querySelectorAll('.autocomplete-item');
    items.forEach((item, index) => {
        item.classList.toggle('selected', index === selectedAutocompleteIndex);
    });
    
    if (selectedAutocompleteIndex >= 0 && items[selectedAutocompleteIndex]) {
        items[selectedAutocompleteIndex].scrollIntoView({ block: 'nearest' });
    }
}

function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];
    
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + 1
                );
            }
        }
    }
    
    return matrix[len1][len2];
}

// Make functions available globally
window.performSearch = performSearch;
window.navigateToProcess = typeof navigateToProcess !== 'undefined' ? navigateToProcess : function() {};
