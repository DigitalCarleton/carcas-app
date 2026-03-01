document.addEventListener("DOMContentLoaded", async () => {
    const contentArea = document.getElementById("content-area");

    // Global variables for specimen data
    let allSpecimens = [];
    let animalGroups = {};
    let boneGroups = {};

    // Fetch and process specimen data from API
    const fetchSpecimenData = async () => {
        try {
            // Use URL and Sheet from spreadapi.js
            const fetchUrl = `${url}?sheet=${sheet}`;
            const response = await fetch(fetchUrl);
            const result = await response.json();
            const data = result.data || [];

            console.log('Raw data from SpreadAPI (first row):', data[0]);

            // Filter only specimens that are live on website and have valid data
            // Note: In SpreadAPI, column names are exactly as in the header row
            allSpecimens = data.filter(specimen =>
                specimen["Status"] === "live on website" &&
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
                const boneName = specimen["Element"] || "Other";
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
                        <li><a href="#" class="submenu-item" data-model="${bone['Link to 3D Viewer']}">${bone['Element'] || 'Bone'}</a></li>
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
                const boneName = specimen['Bone Display Name'] || '';

                return `
                    <div class="scan-item">
                        <div class="preview-frame">
                            <img src="https://3dviewer.sites.carleton.edu/carcas/carcas-models/posters/${modelId}-poster.webp?" 
                                 alt="${animalName} ${boneName}"
                                 class="preview-iframe"
                            />
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
                const boneName = specimen['Element'] ? specimen['Element'].toLowerCase() : '';
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
            modelName = `${specimen['Common Name']} ${specimen['Bone Display Name'] || ''}`.trim();
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
                    <button class="back-button">← Back</button>
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

    // Consolidated Search Page Function
    const loadSearchPage = (title, description, specimenData = allSpecimens) => {
        loadContent(`
            <div class="scans-section">
                <h2>${title}</h2>
                <p class="collection-description">${description}</p>
                <div class="search-container">
                    <div class="search-wrapper">
                        <i class="fas fa-search search-icon"></i>
                        <input type="text" id="specimen-search" placeholder="Search specimens..." class="search-input">
                    </div>
                </div>
                <div class="grid" id="specimens-grid">
                    ${renderSpecimens(specimenData)}
                </div>
            </div>
        `);
    };

    // Animal Dropdown Handler - Just toggle, don't reload page
    const animalSearchLink = document.getElementById("animal-search-link");
    const animalDropdown = animalSearchLink.parentElement;

    animalSearchLink.addEventListener("click", (e) => {
        e.preventDefault();
        // Only toggle dropdown, don't reload page
        animalDropdown.classList.toggle("active");
    });

    // Bone Dropdown Handler - Just toggle, don't reload page
    const boneSearchLink = document.getElementById("bone-search-link");
    const boneDropdown = boneSearchLink.parentElement;

    boneSearchLink.addEventListener("click", (e) => {
        e.preventDefault();
        // Only toggle dropdown, don't reload page
        boneDropdown.classList.toggle("active");
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

        // Handle toggle submenu
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

        // Handle back button clicks
        else if (e.target.classList.contains('back-button')) {
            e.preventDefault();
            loadSearchPage("Search", "Search through our specimen collection:");
        }

        // Close dropdowns when clicking outside
        else if (!animalDropdown.contains(e.target) &&
            !boneDropdown.contains(e.target) &&
            !e.target.classList.contains('scan-button') &&
            !e.target.closest('.scan-viewer-section') &&
            !e.target.closest('.search-container') &&
            !e.target.classList.contains('search-input')) {
            animalDropdown.classList.remove('active');
            boneDropdown.classList.remove('active');
            // Close all submenus
            document.querySelectorAll('.dropdown-submenu.active').forEach(submenu => {
                submenu.classList.remove('active');
            });
        }
    });

    // Load search page by default after everything is set up
    loadSearchPage("Search", "Search through our specimen collection:");

    // Make loadSearchPage available globally if needed
    window.loadSearchPage = loadSearchPage;
});