const MODEL_BASE_URL = 'https://3dviewer.sites.carleton.edu/carcas/carcas-models/models/';


document.addEventListener("DOMContentLoaded", async () => {
    const contentArea = document.getElementById("content-area");
    
    const formatFileName = (rawName) => {
        if (!rawName) return null;
        
        // 1. Remove extension and replace hyphens with spaces
        let cleanName = rawName
            .replace(/\.html?$/i, '')
            .replace(/\.glb$/i, '')
            .replace(/-/g, ' ');
            
        // 2. Convert to Title Case with special handling for L/R
        cleanName = cleanName.split(' ').map(word => {
            const lowerWord = word.toLowerCase();
            // Special handling for isolated 'l' or 'r' (Left/Right indicators)
            if (lowerWord === 'l') return 'L';
            if (lowerWord === 'r') return 'R';
            // Title Case for other words
            return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
        }).join(' ');
        
        // 3. Capitalize letter after opening parenthesis (e.g., "(t4)" -> "(T4)")
        cleanName = cleanName.replace(/\(([a-z])/g, (match, p1) => `(${p1.toUpperCase()}`);
        
        return `${cleanName}.glb`;
    };

    const getGlbFileName = (item) => {
        const rawName = item['Link to 3D Viewer'];
        return formatFileName(rawName);
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
    await fetchSpecimenData();
    populateAnimalDropdown();
    populateBoneDropdown();

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

    // Dimension Lines Integration
    const initDimensionLines = (modelViewer) => {
        if (!modelViewer) return;

        const checkbox = modelViewer.querySelector("#show-dimensions");
        const dimLines = modelViewer.querySelectorAll("line");
        const dimensionLineContainer = modelViewer.querySelector(".dimensionLineContainer");
        const cmsRadio = modelViewer.querySelector("#cms");
        const inchesRadio = modelViewer.querySelector("#inches");

        if (!checkbox || !dimensionLineContainer) return;

        function setVisibility(element) {
            if (checkbox.checked) {
                element.classList.remove("hide");
                dimensionLineContainer.classList.add("loaded");
            } else {
                element.classList.add("hide");
                dimensionLineContainer.classList.remove("loaded");
            }
        }

        checkbox.addEventListener("change", () => {
            setVisibility(modelViewer.querySelector("#dimLines"));
            // Force re-render to update dim visibility based on current camera
            renderSVG();
        });

        const toInchesConversion = 39.3701;

        function drawLabels(size) {
            const isCms = cmsRadio && cmsRadio.checked;
            const factor = isCms ? 100 : toInchesConversion;
            const unit = isCms ? 'cm' : 'in';

            const updateLabel = (slot, value) => {
                const btn = modelViewer.querySelector(`button[slot="${slot}"]`);
                if (btn) btn.textContent = `${(value * factor).toFixed(1)} ${unit}`;
            };

            // Update all 12 edge labels
            // Parallel to X (Y, Z fixed) -> size.x
            ['+', '-'].forEach(y => {
                ['+', '-'].forEach(z => {
                    updateLabel(`hotspot-dim${y}Y${z}Z`, size.x);
                });
            });

            // Parallel to Y (X, Z fixed) -> size.y
            ['+', '-'].forEach(x => {
                ['+', '-'].forEach(z => {
                    updateLabel(`hotspot-dim${x}X${z}Z`, size.y);
                });
            });

            // Parallel to Z (X, Y fixed) -> size.z
            ['+', '-'].forEach(x => {
                ['+', '-'].forEach(y => {
                    updateLabel(`hotspot-dim${x}X${y}Y`, size.z);
                });
            });
        }

        // Update units on radio change
        const handleUnitChange = () => {
             const size = modelViewer.getDimensions();
             drawLabels(size);
        };
        if(cmsRadio) cmsRadio.addEventListener("change", handleUnitChange);
        if(inchesRadio) inchesRadio.addEventListener("change", handleUnitChange);

        function drawLine(svgLine, dotHotspot1, dotHotspot2) {
            if (dotHotspot1 && dotHotspot2 && svgLine) {
                svgLine.setAttribute("x1", dotHotspot1.canvasPosition.x);
                svgLine.setAttribute("y1", dotHotspot1.canvasPosition.y);
                svgLine.setAttribute("x2", dotHotspot2.canvasPosition.x);
                svgLine.setAttribute("y2", dotHotspot2.canvasPosition.y);
                svgLine.classList.remove("hide");
            }
        }

        const renderSVG = () => {
            if (!checkbox.checked) {
                 modelViewer.querySelectorAll('button.dim').forEach(btn => btn.classList.remove('visible'));
                 return;
            }

            const orbit = modelViewer.getCameraOrbit();
            const theta = orbit.theta;
            const phi = orbit.phi;
            
            // Calculate signs based on camera position relative to center
            // theta=0 -> +Z, theta=PI/2 -> +X
            // phi=0 -> +Y
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            
            const sx = (sinTheta * sinPhi) >= 0 ? '+' : '-';
            const sy = cosPhi >= 0 ? '+' : '-';
            const sz = (cosTheta * sinPhi) >= 0 ? '+' : '-';
            
            const cornerName = `hotspot-dot${sx}X${sy}Y${sz}Z`;
            
            // 3 Connected Edges
            // Edge 1: Parallel to X (connects to flipped X). Name uses Y and Z signs.
            const dimX = `hotspot-dim${sy}Y${sz}Z`;
            const cornerX = `hotspot-dot${sx==='+'?'-':'+'}X${sy}Y${sz}Z`;
            
            // Edge 2: Parallel to Y. Name uses X and Z signs.
            const dimY = `hotspot-dim${sx}X${sz}Z`;
            const cornerY = `hotspot-dot${sx}X${sy==='+'?'-':'+'}Y${sz}Z`;
            
            // Edge 3: Parallel to Z. Name uses X and Y signs.
            const dimZ = `hotspot-dim${sx}X${sy}Y`;
            const cornerZ = `hotspot-dot${sx}X${sy}Y${sz==='+'?'-':'+'}Z`;
            
            // Draw lines
            drawLine(dimLines[0], modelViewer.queryHotspot(cornerName), modelViewer.queryHotspot(cornerX));
            drawLine(dimLines[1], modelViewer.queryHotspot(cornerName), modelViewer.queryHotspot(cornerY));
            drawLine(dimLines[2], modelViewer.queryHotspot(cornerName), modelViewer.queryHotspot(cornerZ));
            
            // Manage visibility of dimension label buttons
            modelViewer.querySelectorAll('button.dim').forEach(btn => btn.classList.remove('visible'));
            [dimX, dimY, dimZ].forEach(name => {
                const labelBtn = modelViewer.querySelector(`button[slot="${name}"]`);
                if (labelBtn) labelBtn.classList.add('visible');
            });
        };

        modelViewer.addEventListener("camera-change", renderSVG);

        modelViewer.addEventListener("load", () => {
            const center = modelViewer.getBoundingBoxCenter();
            const size = modelViewer.getDimensions();
            const x2 = size.x / 2;
            const y2 = size.y / 2;
            const z2 = size.z / 2;

            const updateHotspot = (name, x, y, z) => {
                 modelViewer.updateHotspot({ name, position: `${x} ${y} ${z}` });
            };

            // Initialize all 20 hotspots
            // 8 Corners
            [-1, 1].forEach(xSig => {
                [-1, 1].forEach(ySig => {
                    [-1, 1].forEach(zSig => {
                        const name = `hotspot-dot${xSig>0?'+':'-'}X${ySig>0?'+':'-'}Y${zSig>0?'+':'-'}Z`;
                        updateHotspot(name, center.x + xSig*x2, center.y + ySig*y2, center.z + zSig*z2);
                    });
                });
            });

            // 12 Edges
            // Parallel to X (Y, Z fixed)
            [-1, 1].forEach(ySig => {
                [-1, 1].forEach(zSig => {
                    const name = `hotspot-dim${ySig>0?'+':'-'}Y${zSig>0?'+':'-'}Z`;
                    updateHotspot(name, center.x, center.y + ySig*y2, center.z + zSig*z2);
                });
            });
            // Parallel to Y (X, Z fixed)
            [-1, 1].forEach(xSig => {
                [-1, 1].forEach(zSig => {
                    const name = `hotspot-dim${xSig>0?'+':'-'}X${zSig>0?'+':'-'}Z`;
                    updateHotspot(name, center.x + xSig*x2, center.y, center.z + zSig*z2);
                });
            });
            // Parallel to Z (X, Y fixed)
            [-1, 1].forEach(xSig => {
                [-1, 1].forEach(ySig => {
                    const name = `hotspot-dim${xSig>0?'+':'-'}X${ySig>0?'+':'-'}Y`;
                    updateHotspot(name, center.x + xSig*x2, center.y + ySig*y2, center.z);
                });
            });

            drawLabels(size);
            renderSVG();
            
            // Show dimensions on load
            dimensionLineContainer.classList.add("loaded");
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
            <div class="model-viewer-container">
                <button onclick="window.history.back()">Back</button>
                <model-viewer
                    src="${modelUrl}"
                    alt="${title}"
                    camera-controls
                    ar
                    interaction-prompt="auto"
                    auto-rotate
                    shadow-intensity="1"
                    style="width: 100%; height: 80vh;">
                    
                    <!-- 8 Corners (Dots) -->
                    <button slot="hotspot-dot+X+Y+Z" class="dot" data-position="1 1 1" data-normal="0 1 0"></button>
                    <button slot="hotspot-dot+X+Y-Z" class="dot" data-position="1 1 -1" data-normal="0 1 0"></button>
                    <button slot="hotspot-dot+X-Y+Z" class="dot" data-position="1 -1 1" data-normal="0 -1 0"></button>
                    <button slot="hotspot-dot+X-Y-Z" class="dot" data-position="1 -1 -1" data-normal="0 -1 0"></button>
                    <button slot="hotspot-dot-X+Y+Z" class="dot" data-position="-1 1 1" data-normal="0 1 0"></button>
                    <button slot="hotspot-dot-X+Y-Z" class="dot" data-position="-1 1 -1" data-normal="0 1 0"></button>
                    <button slot="hotspot-dot-X-Y+Z" class="dot" data-position="-1 -1 1" data-normal="0 -1 0"></button>
                    <button slot="hotspot-dot-X-Y-Z" class="dot" data-position="-1 -1 -1" data-normal="0 -1 0"></button>

                    <!-- 12 Edges (Dims) -->
                    <!-- Parallel to X (YZ plane) -->
                    <button slot="hotspot-dim+Y+Z" class="dim" data-position="0 1 1" data-normal="0 1 0"></button>
                    <button slot="hotspot-dim+Y-Z" class="dim" data-position="0 1 -1" data-normal="0 1 0"></button>
                    <button slot="hotspot-dim-Y+Z" class="dim" data-position="0 -1 1" data-normal="0 -1 0"></button>
                    <button slot="hotspot-dim-Y-Z" class="dim" data-position="0 -1 -1" data-normal="0 -1 0"></button>

                    <!-- Parallel to Y (XZ plane) -->
                    <button slot="hotspot-dim+X+Z" class="dim" data-position="1 0 1" data-normal="1 0 0"></button>
                    <button slot="hotspot-dim+X-Z" class="dim" data-position="1 0 -1" data-normal="1 0 0"></button>
                    <button slot="hotspot-dim-X+Z" class="dim" data-position="-1 0 1" data-normal="-1 0 0"></button>
                    <button slot="hotspot-dim-X-Z" class="dim" data-position="-1 0 -1" data-normal="-1 0 0"></button>

                    <!-- Parallel to Z (XY plane) -->
                    <button slot="hotspot-dim+X+Y" class="dim" data-position="1 1 0" data-normal="1 0 0"></button>
                    <button slot="hotspot-dim+X-Y" class="dim" data-position="1 -1 0" data-normal="1 0 0"></button>
                    <button slot="hotspot-dim-X+Y" class="dim" data-position="-1 1 0" data-normal="-1 0 0"></button>
                    <button slot="hotspot-dim-X-Y" class="dim" data-position="-1 -1 0" data-normal="-1 0 0"></button>

                    <svg id="dimLines" style="pointer-events: none;" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="dimensionLineContainer">
                        <line class="dimensionLine"></line> 
                        <line class="dimensionLine"></line> 
                        <line class="dimensionLine"></line> 
                    </svg>
            
                    <div id="controlContainer" style="pointer-events: none;">
                        <div id="controls" class="dim" style="pointer-events: auto;">
                            <input type="radio" id="cms" name="user-units" value="cms" checked>
                            <label for="cms">Centimeters</label>

                            <input type="radio" id="inches" name="user-units" value="inches">
                            <label for="inches">Inches</label><br>

                            <label for="show-dimensions">Show Dimensions:</label>
                            <input id="show-dimensions" type="checkbox" checked>
                        </div>
                    </div>
                </model-viewer>
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
