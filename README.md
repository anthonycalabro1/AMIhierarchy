# Process Hierarchy Visualization Tool

A web-based interactive visualization tool for exploring and validating a 3-level process hierarchy (8 L1 → 42 L2 → 116 L3 processes).

## Features

- **Multiple View Modes**:
  - Navigation view: Click-through drill-down interface (L1 → L2 → L3)
  - Tree view: Interactive hierarchical tree diagram
  - Search view: Free-text search across all process data

- **Process Details**: View comprehensive information about any process, including:
  - Process name and level
  - Hierarchy relationships (parent processes)
  - L3-specific properties: Objective, Use Case Mapping, IT Release

- **Gap Identification**: When search returns no results, users can propose new processes to identify gaps in the hierarchy

- **Statistics Dashboard**: Overview of process counts at each level

## Setup

### Prerequisites

- Python 3.x with pandas and openpyxl installed:
  ```bash
  pip install pandas openpyxl
  ```

### Data Conversion

1. Ensure `Hierarchy.xlsx` is in the project directory and **not open in Excel**
2. Run the conversion script:
   ```bash
   python convert_excel_to_json.py
   ```
3. This will generate:
   - `hierarchy-data.json`: Hierarchical process structure
   - `search-index.json`: Searchable index of all processes

### Running the Application

1. Open `index.html` in a web browser
2. Or serve via a local web server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Then navigate to http://localhost:8000
   ```

## File Structure

```
Hierarchy/
├── Hierarchy.xlsx          # Source data (Excel file)
├── convert_excel_to_json.py # Data conversion script
├── index.html              # Main application page
├── styles.css              # Styling
├── app.js                  # Main application logic
├── navigation.js           # Navigation view functionality
├── tree-visualization.js   # Tree view (D3.js)
├── search.js               # Search functionality
├── hierarchy-data.json     # Generated hierarchy data
├── search-index.json       # Generated search index
└── README.md               # This file
```

## Usage

### Navigation View
- Start by viewing all Level 1 processes
- Click on a process to drill down to its children
- Use breadcrumbs to navigate back up the hierarchy

### Tree View
- Visual representation of the entire hierarchy
- Click on nodes to view process details
- Color coding: Blue (L1), Green (L2), Orange (L3)

### Search View
- Enter search terms to find processes
- Searches across:
  - Process names (all levels)
  - L3 process objectives
  - Use Case Mapping
- Results are grouped by hierarchy level
- If no results found, a form appears to propose a new process

### Process Details
- Click any process to view its details in the right panel
- L3 processes show: Objective, Use Case Mapping, IT Release
- All processes show their position in the hierarchy

## Deployment

This is a static web application that can be deployed to:
- GitHub Pages
- Netlify
- Any static web hosting service

Simply upload all files (except `Hierarchy.xlsx` and `convert_excel_to_json.py` if you prefer to keep the source private) to your hosting service.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Uses D3.js v7 for tree visualization (loaded from CDN)

## Notes

- The Excel file must be closed when running the conversion script
- L3 Process Objective, Use Case Mapping, and IT Release are properties **only** of L3 processes
- The search index includes all text fields for comprehensive searching
- Process proposals from the gap identification form are not automatically saved (would require backend integration)


