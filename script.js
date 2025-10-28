document.addEventListener("DOMContentLoaded", async () => {
    const contentArea = document.getElementById("content-area");
    
    // Global variables for specimen data
    let allSpecimens = [];
    let animalGroups = {};
    let boneGroups = {};
    
    // Fetch and process specimen data from API
    const fetchSpecimenData = async () => {
        try {
            const response = await fetch('https://sheetdb.io/api/v1/4ftt7wuign90z');
            const data = await response.json();
            
            // Filter only specimens that are live on website and have valid data
            allSpecimens = data.filter(specimen => 
                specimen.Status === "live on website" && 
                specimen["Common Name"] && 
                specimen["Link to 3D Viewer"]
            );
            
            // Group by animals
            animalGroups = {};
            allSpecimens.forEach(specimen => {
                const animalName = specimen["Common Name"];
                if (!animalGroups[animalName]) {
                    animalGroups[animalName] = [];
                }
                animalGroups[animalName].push(specimen);
            });
            
            // Group by bones
            boneGroups = {};
            allSpecimens.forEach(specimen => {
                const boneName = specimen["Bone name"] || "Other";
                if (!boneGroups[boneName]) {
                    boneGroups[boneName] = [];
                }
                boneGroups[boneName].push(specimen);
            });
            
            console.log('Loaded specimens:', allSpecimens.length);
            console.log('Animal groups:', Object.keys(animalGroups));
            console.log('Bone groups:', Object.keys(boneGroups));
            
        } catch (error) {
            console.error('Error fetching specimen data:', error);
        }
    };
    

    // Populate sidebar dropdowns
    const populateAnimalDropdown = () => {
        const animalDropdown = document.getElementById('animal-dropdown');
        animalDropdown.innerHTML = '';
        
        Object.keys(animalGroups).sort().forEach(animalName => {
            const bones = animalGroups[animalName];
            
            // Create animal item with sub-dropdown
            const animalItem = document.createElement('li');
            animalItem.className = 'dropdown-submenu';
            animalItem.innerHTML = `
                <a href="#" class="dropdown-item animal-item" data-animal="${animalName}">
                    ${animalName}
                    <i class="fas fa-chevron-right submenu-icon"></i>
                </a>
                <ul class="submenu">
                    ${bones.map(bone => `
                        <li><a href="#" class="submenu-item" data-model="${bone['Link to 3D Viewer']}">${bone['Bone name'] || 'Bone'}</a></li>
                    `).join('')}
                </ul>
            `;
            animalDropdown.appendChild(animalItem);
        });
    };
    
    const populateBoneDropdown = () => {
        const boneDropdown = document.getElementById('bone-dropdown');
        boneDropdown.innerHTML = '';
        
        Object.keys(boneGroups).sort().forEach(boneName => {
            if (boneName === "Other" || boneName === "") return; // Skip empty bone names
            
            const specimens = boneGroups[boneName];
            
            // Create bone item with sub-dropdown
            const boneItem = document.createElement('li');
            boneItem.className = 'dropdown-submenu';
            boneItem.innerHTML = `
                <a href="#" class="dropdown-item bone-item" data-bone="${boneName}">
                    ${boneName}
                    <i class="fas fa-chevron-right submenu-icon"></i>
                </a>
                <ul class="submenu">
                    ${specimens.map(specimen => `
                        <li><a href="#" class="submenu-item" data-model="${specimen['Link to 3D Viewer']}">${specimen['Common Name']}</a></li>
                    `).join('')}
                </ul>
            `;
            boneDropdown.appendChild(boneItem);
        });
    };

    // Initialize data and populate dropdowns
    await fetchSpecimenData();
    populateAnimalDropdown();
    populateBoneDropdown();
    
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

        return filteredSpecimens.map(specimen => {
            // Handle both old format (hardcoded) and new format (API data)
            if (specimen.name && specimen.file) {
                // Old format
                return `
                    <div class="scan-item">
                        <div class="preview-frame">
                            <iframe 
                                src="https://3dviewer.sites.carleton.edu/carcas/html-files/${specimen.name}-${specimen.file}.html?" 
                                loading="lazy"
                                class="preview-iframe"
                                title="${specimen.name.charAt(0).toUpperCase() + specimen.name.slice(1)} ${specimen.file}"
                            ></iframe>
                        </div>
                        <div class="scan-info">
                            <h4>${specimen.name.charAt(0).toUpperCase() + specimen.name.slice(1)}</h4>
                            <button class="scan-button" data-model="${specimen.name}-${specimen.file}.html">View Model</button>
                        </div>
                    </div>
                `;
            } else {
                // New format from API
                const modelId = specimen['Link to 3D Viewer'];
                const animalName = specimen['Common Name'] || 'Unknown';
                const boneName = specimen['Bone name'] || '';
                
                return `
                    <div class="scan-item">
                        <div class="preview-frame">
                            <iframe 
                                src="https://3dviewer.sites.carleton.edu/carcas/html-files/${modelId}.html?" 
                                loading="lazy"
                                class="preview-iframe"
                                title="${animalName} ${boneName}"
                            ></iframe>
                        </div>
                        <div class="scan-info">
                            <h4>${animalName}</h4>
                            <p class="bone-name">${boneName}</p>
                            <button class="scan-button" data-model="${modelId}">View Model</button>
                        </div>
                    </div>
                `;
            }
        }).join('');
    };

    const setupSearch = () => {
        const searchInput = document.getElementById('specimen-search');
        const specimensGrid = document.getElementById('specimens-grid');

        const performSearch = (searchTerm) => {
            const normalizedTerm = searchTerm.toLowerCase().trim();
            const filteredSpecimens = allSpecimens.filter(specimen => {
                const animalName = specimen['Common Name'] ? specimen['Common Name'].toLowerCase() : '';
                const boneName = specimen['Bone name'] ? specimen['Bone name'].toLowerCase() : '';
                return animalName.includes(normalizedTerm) || boneName.includes(normalizedTerm);
            });
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
    const loadModelViewer = (modelId) => {
        // Remove .html extension if it exists
        const cleanModelId = modelId.replace('.html', '');
        
        // Find the specimen data to get proper name and details
        const specimen = allSpecimens.find(s => s['Link to 3D Viewer'] === cleanModelId);
        
        let modelName = cleanModelId;
        if (specimen) {
            modelName = `${specimen['Common Name']} ${specimen['Bone name'] || ''}`.trim();
        } else {
            // Fallback to formatting the model ID
            modelName = cleanModelId.split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        loadContent(`
            <div class="scan-viewer-section">
                <h1 class="model-title">${modelName}</h1>
                <div class="model-viewer-container">
                    <button class="back-button" onclick="window.history.back()">← Back</button>
                    <iframe src="https://3dviewer.sites.carleton.edu/carcas/html-files/${cleanModelId}.html" 
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

    // Load Animal Search Page
    const loadAnimalSearchPage = () => {
        loadContent(`
            <div class="scans-section">
                <h2>Animal-Specific Search</h2>
                <p class="collection-description">Search through our animal specimens:</p>
                <div class="search-container">
                    <div class="search-wrapper">
                        <i class="fas fa-search search-icon"></i>
                        <input type="text" id="specimen-search" placeholder="Search specimens..." class="search-input">
                    </div>
                </div>
                <div class="grid" id="specimens-grid">
                    ${renderSpecimens(allSpecimens)}
                </div>
            </div>
        `);
    };

    // Load Bone Search Page  
    const loadBoneSearchPage = () => {
        loadContent(`
            <div class="scans-section">
                <h2>Bone-Specific Search</h2>
                <p class="collection-description">Search through our bone specimens:</p>
                <div class="search-container">
                    <div class="search-wrapper">
                        <i class="fas fa-search search-icon"></i>
                        <input type="text" id="specimen-search" placeholder="Search specimens..." class="search-input">
                    </div>
                </div>
                <div class="grid" id="specimens-grid">
                    ${renderSpecimens(allSpecimens)}
                </div>
            </div>
        `);
    };

    // Load Specimens Grid
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


    // Animal Search Dropdown Handler
    const animalSearchLink = document.getElementById("animal-search-link");
    const animalDropdown = animalSearchLink.parentElement;
    
    animalSearchLink.addEventListener("click", (e) => {
        e.preventDefault();
        
        // Check if clicking on the dropdown arrow or span with text
        if (e.target.classList.contains('dropdown-icon') || e.target.closest('.dropdown-icon')) {
            animalDropdown.classList.toggle("active");
        } else if (e.target.tagName === 'SPAN' || e.target.classList.contains('fas')) {
            // Clicking on the text or paw icon - go to search page
            loadAnimalSearchPage();
        } else {
            // Default - toggle dropdown for safety
            animalDropdown.classList.toggle("active");
        }
    });

    // Bone Search Dropdown Handler
    const boneSearchLink = document.getElementById("bone-search-link");
    const boneDropdown = boneSearchLink.parentElement;
    
    boneSearchLink.addEventListener("click", (e) => {
        e.preventDefault();
        
        // Check if clicking on the dropdown arrow
        if (e.target.classList.contains('dropdown-icon') || e.target.closest('.dropdown-icon')) {
            boneDropdown.classList.toggle("active");
        } else if (e.target.tagName === 'SPAN' || e.target.classList.contains('fas')) {
            // Clicking on the text or bone icon - go to search page
            loadBoneSearchPage();
        } else {
            // Default - toggle dropdown for safety
            boneDropdown.classList.toggle("active");
        }
    });

    // Handle dropdown interactions and model clicks
    document.addEventListener('click', (e) => {
        // Handle submenu item clicks (bone/specimen selection)
        if (e.target.classList.contains('submenu-item')) {
            e.preventDefault();
            const model = e.target.dataset.model;
            if (model) {
                loadModelViewer(model);
            }
        }
        
        // Handle animal/bone item clicks (toggle submenu)
        else if (e.target.classList.contains('animal-item') || e.target.classList.contains('bone-item')) {
            e.preventDefault();
            const submenu = e.target.nextElementSibling;
            const parentLi = e.target.parentElement;
            
            // Toggle submenu
            parentLi.classList.toggle('active');
        }
        
        // Handle grid view model button clicks
        else if (e.target.classList.contains('scan-button')) {
            e.preventDefault();
            const model = e.target.dataset.model;
            loadModelViewer(model);
        }
        
        // Close dropdowns when clicking outside
        else if (!animalDropdown.contains(e.target) && 
                 !boneDropdown.contains(e.target) && 
                 !e.target.classList.contains('scan-button') && 
                 !e.target.closest('.scan-viewer-section')) {
            animalDropdown.classList.remove('active');
            boneDropdown.classList.remove('active');
            // Close all submenus
            document.querySelectorAll('.dropdown-submenu.active').forEach(submenu => {
                submenu.classList.remove('active');
            });
        }
    });

    // Make loadSpecimensGrid available globally
    window.loadSpecimensGrid = loadSpecimensGrid;

    // Load home page initially
    loadHomePage();
});