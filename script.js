document.addEventListener("DOMContentLoaded", () => {
    const contentArea = document.getElementById("content-area");
    
    // Home page content
    const loadHomePage = () => {
        loadContent(`
            <div class="home-content">
                <header class="home-header">
                    <img src="carcas.png" alt="CARCAS Logo" class="main-logo">
                    <h1 class="site-title">Carleton Comparative Archaeological Research Collection</h1>
                </header>
                <div class="home-description">
                    The <strong>Carleton Archaeological Research Collection of Animal Specimens</strong> (CARCAS) is an osteological comparative collection, dermestid beetle colony, and 3D digital repository of animal skeletons located at Carleton College and directed by professor Sarah Kennedy.
                    <br><br>
                    Established by Sarah Kennedy in 2021, CARCAS is dedicated to understanding the relationship between humans, animals, and the environment. In our lab, we focus on the curation, analysis, storage, and interpretation of archaeological animal remains. We use dermestid beetles to skeletonize animal carcasses of birds and mammals, and the cleaned skeletons become part of our osteological reference collection. This collection is then used by students and professors as reference material to help identify animal bones found in archaeological excavations around the world.
                </div>
                <img src="lab.jpeg" alt="CARCAS Laboratory" class="lab-image">
            </div>
        `);
    };

    const loadContent = (html) => {
        contentArea.style.opacity = '0';
        setTimeout(() => {
            contentArea.innerHTML = html;
            contentArea.style.opacity = '1';
            
            // If this is the specimens page, set up the search functionality
            const searchInput = document.getElementById('specimen-search');
            if (searchInput) {
                setupSearch();
            }
        }, 300);
    };

    

    const specimens = [
        {name: 'alligator', file: 'skull'},
        {name: 'alpaca', file: 'cranium'},
        {name: 'bear', file: 'skull'},
        {name: 'beaver', file: 'w21-skull'},
        {name: 'cat', file: 'cranium'},
        {name: 'caribou', file: 'cranium'},
        {name: 'coyote', file: 'cranium'},
        {name: 'deer', file: 'cranium'}
    ];

    const renderSpecimens = (filteredSpecimens) => {
        if (filteredSpecimens.length === 0) {
            return `
                <div class="no-results">
                    <i class="fas fa-search no-results-icon"></i>
                    <p>No matching specimens found</p>
                </div>
            `;
        }

        return filteredSpecimens.map(animal => `
            <div class="scan-item">
                <div class="preview-frame">
                    <iframe 
                        src="https://3dviewer.sites.carleton.edu/carcas/html-files/${animal.name}-${animal.file}.html?preview=true" 
                        loading="lazy"
                        class="preview-iframe"
                        title="${animal.name.charAt(0).toUpperCase() + animal.name.slice(1)} ${animal.file}"
                    ></iframe>
                </div>
                <div class="scan-info">
                    <h4>${animal.name.charAt(0).toUpperCase() + animal.name.slice(1)}</h4>
                    <button class="scan-button" data-model="${animal.name}-${animal.file}.html">View Model</button>
                </div>
            </div>
        `).join('');
    };

    const setupSearch = () => {
        const searchInput = document.getElementById('specimen-search');
        const specimensGrid = document.getElementById('specimens-grid');

        const performSearch = (searchTerm) => {
            const normalizedTerm = searchTerm.toLowerCase().trim();
            const filteredSpecimens = specimens.filter(specimen => 
                specimen.name.toLowerCase().includes(normalizedTerm)
            );
            specimensGrid.innerHTML = renderSpecimens(filteredSpecimens);
        };

        // Handle search input
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission
                performSearch(searchInput.value);
            }
        });

        // Handle input clearing
        searchInput.addEventListener('input', (e) => {
            if (!e.target.value.trim()) {
                performSearch('');
            }
        });
    };


    // Load Model Viewer
    const loadModelViewer = (model) => {
        const modelName = model.replace('.html', '').split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        loadContent(`
            <div class="scan-viewer-section">
                <h1 class="model-title">${modelName}</h1>
                <div class="model-viewer-container">
                    <button class="back-button" onclick="loadSpecimensGrid()">← Back to Collection</button>
                    <iframe src="https://3dviewer.sites.carleton.edu/carcas/html-files/${model}" 
                            style="border:0; width:100%; height:100%;" 
                            name="model-viewer" 
                            scrolling="no" 
                            frameborder="0" 
                            allowfullscreen>
                    </iframe>
                </div>
            </div>
        `);
    };

    // Load Specimens Grid
    // Add this to your loadSpecimensGrid function, replacing the existing version
    const loadSpecimensGrid = () => {
        loadContent(`
            <div class="scans-section">
                <h2>Digital Osteological Collection</h2>
                <p class="collection-description">Explore our open-access 3D models of comparative specimens:</p>
                <div class="search-container">
                    <div class="search-wrapper">
                        <i class="fas fa-search search-icon"></i>
                        <input type="text" id="specimen-search" placeholder="Search specimens..." class="search-input">
                    </div>
                </div>
                <div class="grid" id="specimens-grid">
                    ${renderSpecimens(specimens)}
                </div>
            </div>
        `);
    };

    // Home Link Handler
    document.getElementById("home-link").addEventListener("click", (e) => {
        e.preventDefault();
        loadHomePage();
    });

    // Lab Link Handler
    document.getElementById("lab-link").addEventListener("click", (e) => {
        e.preventDefault();
        loadContent(`
            <div class="lab-section">
                <h2>Laboratory Facilities</h2>
                <p class="lab-description">Our laboratory resources form the foundation of CARCAS's research capabilities</p>
                <div class="resources-container">
                    <div class="resource-list">
                        <div class="resource-item">
                            <div class="resource-icon">
                                <i class="fas fa-bug"></i>
                            </div>
                            <div class="resource-content">
                                <h3>Dermestid Beetle Colony</h3>
                                <p>Natural skeletal preparation facility</p>
                            </div>
                        </div>
                        <div class="resource-item">
                            <div class="resource-icon">
                                <i class="fas fa-bone"></i>
                            </div>
                            <div class="resource-content">
                                <h3>Osteological Collection</h3>
                                <p>Comprehensive reference materials</p>
                            </div>
                        </div>
                        <div class="resource-item">
                            <div class="resource-icon">
                                <i class="fas fa-microscope"></i>
                            </div>
                            <div class="resource-content">
                                <h3>Stereo Microscopes</h3>
                                <p>High-precision sorting and analysis equipment</p>
                            </div>
                        </div>
                        <div class="resource-item">
                            <div class="resource-icon">
                                <i class="fas fa-camera"></i>
                            </div>
                            <div class="resource-content">
                                <h3>Microscope Photography</h3>
                                <p>Specialized equipment and software for documentation</p>
                            </div>
                        </div>
                        <div class="resource-item">
                            <div class="resource-icon">
                                <i class="fas fa-balance-scale"></i>
                            </div>
                            <div class="resource-content">
                                <h3>Precision Balances</h3>
                                <p>Analytical measurement instruments</p>
                            </div>
                        </div>
                        <div class="resource-item">
                            <div class="resource-icon">
                                <i class="fas fa-box"></i>
                            </div>
                            <div class="resource-content">
                                <h3>Storage Facilities</h3>
                                <p>Controlled environment for specimen preservation</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
    });

    // Scans Link and Dropdown Handler
    const scansLink = document.getElementById("scans-link");
    const dropdown = scansLink.parentElement;
    
    scansLink.addEventListener("click", (e) => {
        e.preventDefault();
        dropdown.classList.toggle("active");
        loadSpecimensGrid();
    });

    // Handle dropdown item clicks
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const model = e.target.dataset.model + '.html';
            loadModelViewer(model);
        });
    });
    
    // Handle grid view model button clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('scan-button')) {
            e.preventDefault();
            const model = e.target.dataset.model;
            loadModelViewer(model);
        }
    });

    // Close dropdown only when clicking outside both the dropdown AND the content area
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && 
            !e.target.classList.contains('scan-button') && 
            !e.target.closest('.scan-viewer-section')) {
            dropdown.classList.remove('active');
        }
    });

    // Make loadSpecimensGrid available globally
    window.loadSpecimensGrid = loadSpecimensGrid;

    // Load home page initially
    loadHomePage();
});