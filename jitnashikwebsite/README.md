# JIT Website - Header & Footer Module System

## Overview
This website now uses a modular approach where the header (navigation) and footer are maintained in separate files and dynamically loaded into all pages using JavaScript. This ensures consistency across all pages and makes updates easy.

## File Structure

```
jitwebsitenew/
├── index.html              # Home page
├── academics2.html         # Academics page
├── admission.html          # Admission information page
├── admissionform.html      # Admission form page
├── campuslife.html         # Campus life page
├── header.html             # Shared header/navbar component
├── footer.html             # Shared footer component
├── shared.js               # JavaScript for dynamic loading
└── README.md               # This file
```

## How It Works

### 1. **Separate Modules**
- **header.html** - Contains the navigation bar that appears on all pages
- **footer.html** - Contains the footer that appears on all pages

### 2. **Dynamic Loading (shared.js)**
The `shared.js` file uses the Fetch API to load header and footer components:

```javascript
document.addEventListener('DOMContentLoaded', function() {
    loadComponent('header', 'header.html');
    loadComponent('footer', 'footer.html');
});

function loadComponent(id, filePath) {
    fetch(filePath)
        .then(response => response.text())
        .then(html => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = html;
            }
        })
        .catch(error => console.error(`Error loading ${filePath}:`, error));
}
```

### 3. **Page Structure**
Each HTML page now has:

```html
<body>
    <!-- Header Placeholder -->
    <div id="header"></div>
    
    <!-- Page-specific content -->
    <main>
        <!-- Your content here -->
    </main>
    
    <!-- Footer Placeholder -->
    <div id="footer"></div>
    
    <!-- Load the shared components -->
    <script src="shared.js"></script>
</body>
```

## Benefits

✅ **Single Source of Truth** - Update header/footer once, affects all pages
✅ **Easy Maintenance** - No need to edit header/footer code in multiple files
✅ **Consistency** - Ensures all pages have identical navigation and footer
✅ **Scalability** - Easy to add new pages - just include the placeholders and script
✅ **Clean Code** - Separates concerns and makes each file more readable

## Usage Instructions

### To Update the Header
Edit `header.html` - any changes will automatically appear on all pages on next load.

### To Update the Footer
Edit `footer.html` - any changes will automatically appear on all pages on next load.

### To Add a New Page
1. Create your new HTML page
2. Add the header and footer placeholders:
   ```html
   <div id="header"></div>
   <!-- Your page content -->
   <div id="footer"></div>
   <script src="shared.js"></script>
   ```
3. The header and footer will automatically load!

## Navigation Links
The header includes links to all main pages:
- Home (index.html)
- Academics (academics2.html)
- Admissions (admissionform.html)
- Campus Life (campuslife.html)
- About Us (admission.html)

Update the href attributes in `header.html` if you need to change page routes.

## Browser Compatibility
The system uses:
- Modern ES6 JavaScript (supported in all modern browsers)
- Fetch API (requires ES6+ or a polyfill for older browsers)
- CSS classes for styling (Bootstrap-like approach with custom colors)

## Troubleshooting

**Header/Footer not loading?**
1. Ensure `shared.js` is in the same directory as your HTML files
2. Check browser console for fetch errors (F12 -> Console tab)
3. Verify CORS settings if running locally - some browsers block fetch for local files

**Links not working correctly?**
- Check that the href paths in `header.html` are correct relative to each page's location

## Future Enhancements
- Add error state styling if components fail to load
- Implement caching to improve load performance
- Add animation/transition effects for component loading
