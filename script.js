const MODEL_BASE_URL = 'https://3dviewer.sites.carleton.edu/carcas/carcas-models/models/';
import { initDimensionLines } from './addDimLines.js';

// KNOWN_GLB_FILES and local index removed in favor of dynamic API data

document.addEventListener("DOMContentLoaded", async () => {
    const contentArea = document.getElementById("content-area");
    const getGlbFileName = (item) => {
        const link = item['Link to 3D Viewer'];
        if (!link) return null;
        
        // 1. Remove .html extension and trim
        let fileName = link.trim().replace(/\.html?$/i, '');
        
        // 2. Replace hyphens with spaces
        fileName = fileName.replace(/-/g, ' ');
        
        // 3. Title Case: Capitalize first letter of each word
        // Also capitalize letter immediately after an opening parenthesis
        fileName = fileName.replace(/(?:^|\s|\()\w/g, (match) => {
            return match.toUpperCase();
        });
        
        // 4. Ensure .glb suffix
        if (!fileName.toLowerCase().endsWith('.glb')) {
            fileName += '.glb';
        }
        //this part will be removed after the dynamic API data is fixed
        return fileName;
    };

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
                const boneName = specimen["Element"] || "Other";
                if (!boneGroups[boneName]) {
                    boneGroups[boneName] = [];
                }
                boneGroups[boneName].push(specimen);
            });
            
            console.log('Loaded specimens:', allSpecimens.length);
            console.log('Animal groups:', Object.keys(animalGroups));
            console.log('Bone groups:', Object.keys(boneGroups));
            
            populateAnimalDropdown();
            populateBoneDropdown();
            
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
                    ${bones.map(bone => {
                        const fileName = getGlbFileName(bone);
                        const disabledClass = fileName ? '' : 'disabled';
                        return `
                            <li>
                                <a href="#" 
                                   class="submenu-item ${disabledClass}" 
                                   data-common="${bone['Common Name'] || animalName}" 
                                   data-element="${bone['Bone Display Name'] || bone['Element'] || ''}" 
                                   data-link="${bone['Link to 3D Viewer'] || ''}"
                                   data-filename="${fileName || ''}">
                                   ${bone['Element'] || 'Bone'}
                                </a>
                            </li>
                        `;
                    }).join('')}
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
                    ${specimens.map(specimen => {
                        const fileName = getGlbFileName(specimen);
                        const disabledClass = fileName ? '' : 'disabled';
                        return `
                            <li>
                                <a href="#" 
                                   class="submenu-item ${disabledClass}" 
                                   data-common="${specimen['Common Name'] || ''}" 
                                   data-element="${specimen['Bone Display Name'] || specimen['Element'] || ''}" 
                                   data-link="${specimen['Link to 3D Viewer'] || ''}"
                                   data-filename="${fileName || ''}">
                                   ${specimen['Common Name']}
                                </a>
                            </li>
                        `;
                    }).join('')}
                </ul>
            `;
            boneDropdown.appendChild(boneItem);
        });
    };

    // Initialize data and populate dropdowns
    // buildFileIndex() removed
    await fetchSpecimenData();
    // Dropdowns are populated inside fetchSpecimenData on success

    const loadContent = (html) => {
        return new Promise((resolve) => {
            contentArea.style.opacity = '0';
            setTimeout(() => {
                contentArea.innerHTML = html;
                contentArea.style.opacity = '1';
                
                // If this is the specimens page, set up the search functionality
                const searchInput = document.getElementById('specimen-search');
                if (searchInput) {
                    setupSearch();
                }
                resolve();
            }, 300);
        });
    };


    const loadGlbViewerFromSrc = async (src) => {
    const baseUrl = 'https://3dviewer.sites.carleton.edu/carcas/carcas-models/models/';
    const fileName = decodeURIComponent(src);
    const modelUrl = baseUrl + encodeURIComponent(fileName);
    const title = fileName.replace(/\.glb$/i, '');
    
    await loadContent(`
        <div class="scan-viewer-section">
            <h1 class="model-title">${title}</h1>
            <div class="model-viewer-container" style="position: relative;">
                    <button onclick="window.history.back()">Back</button>
                    <model-viewer
                        src="${modelUrl}"
                        alt="${title}"
                        camera-controls
                        auto-rotate
                        shadow-intensity="1"
                        style="width: 100%; height: 80vh;">
                        <button name="hotspot-dot+X-Y+Z" slot="hotspot-dot+X-Y+Z" class="dot" data-position="1 -1 1" data-normal="1 0 0"></button>
                        <button name="hotspot-dim+X-Y" slot="hotspot-dim+X-Y" class="dim" data-position="1 -1 0" data-normal="1 0 0"></button>
                        <button name="hotspot-dot+X-Y-Z" slot="hotspot-dot+X-Y-Z" class="dot" data-position="1 -1 -1" data-normal="1 0 0"></button>
                        <button name="hotspot-dim+X-Z" slot="hotspot-dim+X-Z" class="dim" data-position="1 0 -1" data-normal="1 0 0"></button>
                        <button name="hotspot-dot+X+Y-Z" slot="hotspot-dot+X+Y-Z" class="dot" data-position="1 1 -1" data-normal="0 1 0"></button>
                        <button name="hotspot-dim+Y-Z" slot="hotspot-dim+Y-Z" class="dim" data-position="0 1 -1" data-normal="0 1 0"></button>
                        <button name="hotspot-dim-Y+Z" slot="hotspot-dim-Y+Z" class="dim" data-position="0 -1 1" data-normal="0 -1 0"></button>
                        <button name="hotspot-dot-X+Y-Z" slot="hotspot-dot-X+Y-Z" class="dot" data-position="-1 1 -1" data-normal="0 1 0"></button>
                        <button name="hotspot-dim-X-Z" slot="hotspot-dim-X-Z" class="dim" data-position="-1 0 -1" data-normal="-1 0 0"></button>
                        <button name="hotspot-dot-X-Y-Z" slot="hotspot-dot-X-Y-Z" class="dot" data-position="-1 -1 -1" data-normal="-1 0 0"></button>
                        <button name="hotspot-dim-X-Y" slot="hotspot-dim-X-Y" class="dim" data-position="-1 -1 0" data-normal="-1 0 0"></button>
                        <button name="hotspot-dot-X-Y+Z" slot="hotspot-dot-X-Y+Z" class="dot" data-position="-1 -1 1" data-normal="-1 0 0"></button>
                    </model-viewer>
                    <svg id="dimLines" xmlns="http://www.w3.org/2000/svg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;" class="dimensionLineContainer">
                        <line class="dimensionLine"></line>
                        <line class="dimensionLine"></line>
                        <line class="dimensionLine"></line>
                        <line class="dimensionLine"></line>
                        <line class="dimensionLine"></line>
                        <line class="dimensionLine"></line>
                        <line class="dimensionLine"></line>
                        <line class="dimensionLine"></line>
                        <line class="dimensionLine"></line>
                        <line class="dimensionLine"></line>
                        <line class="dimensionLine"></line>
                        <line class="dimensionLine"></line>
                    </svg>
                    <div id="controlContainer" style="position: absolute; top: 8px; left: 8px; width: 100%; pointer-events: none; z-index: 20; text-align: left;">
                      <div id="controls" class="dim" style="pointer-events: auto; display: inline-block; background: rgba(255,255,255,0.9); padding: 10px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.25);">
                         <label style="margin-right: 10px; cursor: pointer;"><input type="radio" id="cms" name="user-units" value="cms" checked> Centimeters</label>
                         <label style="margin-right: 10px; cursor: pointer;"><input type="radio" id="inches" name="user-units" value="inches"> Inches</label>
                         <div style="margin-top: 5px;">
                           <label style="cursor: pointer;"><input id="show-dimensions" type="checkbox" checked> Show Dimensions</label>
                         </div>
                      </div>
                    </div>
                </div>
        </div>
    `);
    
    
    const modelViewer = document.querySelector('model-viewer');
    
 
    initDimensionLines(modelViewer);
};
window.loadGlbViewerFromSrc = loadGlbViewerFromSrc;

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
            // New format from API
            const modelId = specimen['Link to 3D Viewer'];
            const animalName = specimen['Common Name'] || 'Unknown';
            const boneName = specimen['Bone Display Name'] || '';
            const fileName = getGlbFileName(specimen);
            
            return `
                <div class="scan-item">
                    <div class="preview-frame">
                        <img src="https://3dviewer.sites.carleton.edu/carcas/carcas-models/posters/${modelId}-poster.webp?" 
                                alt="${animalName} ${boneName}"
                                class="preview-iframe"
                                onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\'no-preview\'>No Preview</div>'"
                        />
                        </div>
                    <div class="scan-info">
                        <h4>${animalName}</h4>
                        <p class="bone-name">${boneName}</p>
                        <button class="scan-button ${fileName ? '' : 'disabled'}" 
                                data-common="${animalName}" 
                                data-element="${boneName}" 
                                data-link="${modelId}"
                                data-filename="${fileName || ''}">
                            View Model
                        </button>
                    </div>
                </div>
            `;
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
            const filename = e.target.dataset.filename;
            if (filename) {
                window.location.href = `?src=${encodeURIComponent(filename)}`;
            } else {
                console.error("Missing GLB file for this item");
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
            const filename = e.target.dataset.filename;
            if (filename) {
                window.location.href = `?src=${encodeURIComponent(filename)}`;
            } else {
                console.error("Missing GLB file for this item");
            }
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

    // Check for URL parameters to load a specific model directly
    const urlParams = new URLSearchParams(window.location.search);
    const srcParam = urlParams.get('src');
    
    if (srcParam) {
      // If ?src=xxx exists, load the model viewer directly
      // decodeURIComponent handles spaces/special characters (e.g. "Alligator Skull.glb")
      loadGlbViewerFromSrc(srcParam);
    } else {
      // Otherwise, load the default search page
      loadSearchPage("Search", "Search through our specimen collection:");
    }
    
    // Keep the global exposure for debugging
    window.loadGlbViewerFromSrc = loadGlbViewerFromSrc;
});
