const MODEL_BASE_URL = 'https://3dviewer.sites.carleton.edu/carcas/carcas-models/models/';
import { initDimensionLines } from './addDimLines.js';

// KNOWN_GLB_FILES and local index removed in favor of dynamic API data

document.addEventListener("DOMContentLoaded", async () => {
    const contentArea = document.getElementById("content-area");
    const getGlbFileName = (item) => {
        // Priority 1: Check if there's an explicit GLB Filename column
        if (item['GLB Filename']) {
            let fileName = item['GLB Filename'].trim();
            if (!fileName.toLowerCase().endsWith('.glb')) {
                fileName += '.glb';
            }
            return fileName;
        }

        // Priority 2: Fallback to deriving from Link to 3D Viewer
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
        return fileName;
    };

    // Helper to get the grouping prefix for a bone
    const getBonePrefix = (specimen) => {
        // Priority 1: First word of the Element field
        let element = specimen["Element"];
        if (element && element.trim()) {
            // Standardize: "skull" -> "Skull"
            let word = element.trim().split(/\s+/)[0];
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }

        // Priority 2: Extract from Link to 3D Viewer filename
        const link = specimen["Link to 3D Viewer"];
        if (link) {
            // Remove common prefixes/suffixes and get first keyword
            const parts = link.split('-');
            const animalName = (specimen["Common Name"] || "").toLowerCase();

            const part = parts.find(p => p.toLowerCase() !== animalName && p.length > 2 && isNaN(p));
            if (part) return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }
        return "Other";
    };

    // Global variables for specimen data
    let allSpecimens = [];
    let animalGroups = {};

    // Fetch and process specimen data from API
    const fetchSpecimenData = async () => {
        try {
            // sessionStorage cache: avoid re-fetching on logo/back navigation (5-min TTL)
            let data;
            const cached = sessionStorage.getItem('carcas_data');
            if (cached) {
                const { ts, rows } = JSON.parse(cached);
                if (Date.now() - ts < 300_000) data = rows;
            }
            if (!data) {
                const fetchUrl = `${url}?sheet=${sheet}`;
                const result = await (await fetch(fetchUrl)).json();
                data = result.data || [];
                sessionStorage.setItem('carcas_data', JSON.stringify({ ts: Date.now(), rows: data }));
            }


            console.log('Raw data from SpreadAPI (first row):', data[0]);

            // Filter only specimens that are live on website and have valid data
            allSpecimens = data.filter(specimen =>
                specimen.Status === "live on website" &&
                specimen["Common Name"] &&
                specimen["Link to 3D Viewer"]
            );

            // Group by animals -> bone prefix categories
            animalGroups = {};
            allSpecimens.forEach(specimen => {
                const animalName = specimen["Common Name"];
                const prefix = getBonePrefix(specimen);
                animalGroups[animalName] ??= {};
                animalGroups[animalName][prefix] ??= [];
                animalGroups[animalName][prefix].push(specimen);
            });

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
            const categories = animalGroups[animalName];

            const animalItem = document.createElement('li');
            animalItem.className = 'dropdown-submenu';

            let submenuHtml = '';
            Object.keys(categories).sort().forEach(prefix => {
                const specimens = categories[prefix];

                if (specimens.length > 1) {
                    // Level 2 Submenu for prefixes with multiple items
                    submenuHtml += `
                        <li class="dropdown-submenu level-2">
                            <a href="#" class="dropdown-item bone-item nested-item" data-prefix="${prefix}">
                                ${prefix}
                                <i class="fas fa-chevron-right submenu-icon"></i>
                            </a>
                            <ul class="submenu">
                                ${specimens.map(s => {
                        const fileName = getGlbFileName(s);
                        // Label priority: Bone Display Name > Element > Filename Keyword
                        let label = s['Bone Display Name'] || s['Element'];
                        if (!label || label.toLowerCase() === prefix.toLowerCase()) {
                            label = s['Link to 3D Viewer'].replace(`${animalName.toLowerCase()}-`, '').replace(/-/g, ' ');
                        }
                        return `
                                        <li>
                                            <a href="#" class="submenu-item" 
                                               data-common="${s['Common Name']}" 
                                               data-filename="${fileName}">
                                               ${label}
                                            </a>
                                        </li>
                                    `;
                    }).join('')}
                            </ul>
                        </li>
                    `;
                } else {
                    // Direct link for single item bones
                    const s = specimens[0];
                    const fileName = getGlbFileName(s);
                    // Use Element or Prefix for the link label
                    const label = s['Element'] || prefix;
                    submenuHtml += `
                        <li>
                            <a href="#" class="submenu-item" 
                               data-common="${s['Common Name']}" 
                               data-filename="${fileName}">
                               ${label}
                            </a>
                        </li>
                    `;
                }
            });

            animalItem.innerHTML = `
                <a href="#" class="dropdown-item animal-item" data-animal="${animalName}">
                    ${animalName}
                    <i class="fas fa-chevron-right submenu-icon"></i>
                </a>
                <ul class="submenu">
                    ${submenuHtml}
                </ul>
            `;
            animalDropdown.appendChild(animalItem);
        });
    };

    const populateBoneDropdown = () => {
        const boneDropdown = document.getElementById('bone-dropdown');
        boneDropdown.innerHTML = '';

        // Build prefix groups by flattening all specimens from animalGroups
        // (boneGroups is never separately populated, so we derive from animalGroups)
        const prefixGroups = {};
        Object.values(animalGroups).forEach(categories => {
            Object.keys(categories).forEach(prefix => {
                if (prefix === "Other" || prefix === "") return;
                prefixGroups[prefix] ??= [];
                prefixGroups[prefix].push(...categories[prefix]);
            });
        });

        Object.keys(prefixGroups).sort().forEach(prefix => {
            const specimens = prefixGroups[prefix];

            const boneItem = document.createElement('li');
            boneItem.className = 'dropdown-submenu';

            if (specimens.length > 1) {
                boneItem.innerHTML = `
                    <a href="#" class="dropdown-item bone-item level-2-toggle" data-bone="${prefix}">
                        ${prefix}
                        <i class="fas fa-chevron-right submenu-icon"></i>
                    </a>
                    <ul class="submenu">
                        ${specimens.map(specimen => {
                    const fileName = getGlbFileName(specimen);
                    return `
                                <li>
                                    <a href="#" class="submenu-item" 
                                       data-common="${specimen['Common Name'] || ''}" 
                                       data-filename="${fileName || ''}">
                                       ${specimen['Common Name']}
                                    </a>
                                </li>
                            `;
                }).join('')}
                    </ul>
                `;
            } else {
                const s = specimens[0];
                const fileName = getGlbFileName(s);
                boneItem.innerHTML = `
                    <a href="#" class="submenu-item" 
                       data-common="${s['Common Name'] || ''}" 
                       data-filename="${fileName || ''}">
                       ${prefix} (${s['Common Name']})
                    </a>
                `;
            }
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
        const fileName = decodeURIComponent(src);
        const modelUrl = MODEL_BASE_URL + encodeURIComponent(fileName);
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
                const animalName = (specimen['Common Name'] || '').toLowerCase();
                const element = (specimen['Element'] || '').toLowerCase();
                const displayName = (specimen['Bone Display Name'] || '').toLowerCase();
                const dbName = (specimen['Name as stored in database'] || '').toLowerCase();

                return animalName.includes(normalizedTerm) ||
                    element.includes(normalizedTerm) ||
                    displayName.includes(normalizedTerm) ||
                    dbName.includes(normalizedTerm);
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
    // Logo / Home Link — clicking returns to the default search page
    const homeLink = document.getElementById("home-link");
    homeLink.style.cursor = "pointer";
    homeLink.addEventListener("click", () => {
        // Clear any URL params (e.g. ?src=...) and navigate to base page
        window.location.href = window.location.pathname;
    });

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

    // --- Active filter helper ---
    // Sets .active-filter on the given element, clearing any previous highlights
    // across BOTH sidebars so only one filter is active at a time.
    const setActiveFilter = (el) => {
        document.querySelectorAll('.active-filter').forEach(x => x.classList.remove('active-filter'));
        if (el) el.classList.add('active-filter');
    };

    // Helper: toggle a dropdown-submenu li open/closed, closing siblings at same level
    const toggleSubmenu = (toggleEl) => {
        const parentLi = toggleEl.parentElement;
        const siblings = parentLi.parentElement.querySelectorAll(':scope > .dropdown-submenu.active');
        siblings.forEach(sib => { if (sib !== parentLi) sib.classList.remove('active'); });
        parentLi.classList.toggle('active');
    };

    // Handle dropdown interactions and model clicks
    document.addEventListener('click', (e) => {

        // ── 1. Individual specimen link → load 3D viewer ──────────────────────
        if (e.target.classList.contains('submenu-item')) {
            e.preventDefault();
            e.stopPropagation(); // prevent parent animal/bone handlers from firing
            const filename = e.target.dataset.filename;
            if (filename) {
                window.location.href = `?src=${encodeURIComponent(filename)}`;
            } else {
                console.error('Missing GLB file for this item');
            }
            return;
        }

        // ── 2. Bone category inside an animal submenu (.nested-item) ─────────
        //    e.g. Alligator > Skull  →  filter grid to Alligator Skull specimens
        const nestedEl = e.target.closest('.nested-item');
        if (nestedEl) {
            e.preventDefault();
            e.stopPropagation(); // prevent .animal-item handler below from firing

            const prefix = nestedEl.dataset.prefix;
            // Walk up to find the parent animal link
            const animalLink = nestedEl.closest('.dropdown-submenu')?.parentElement?.closest('.dropdown-submenu')?.querySelector('.animal-item');
            const animal = animalLink?.dataset.animal;

            let filtered = [];
            if (animal && prefix && animalGroups[animal]?.[prefix]) {
                filtered = animalGroups[animal][prefix];
                setActiveFilter(nestedEl);
                loadSearchPage(
                    `Animal: ${animal} › ${prefix}`,
                    `Showing ${prefix} specimens for ${animal}`,
                    filtered
                );
            }

            toggleSubmenu(nestedEl);
            return;
        }

        // ── 3. Animal name click (.animal-item) ──────────────────────────────
        //    e.g. Alligator  →  filter grid to all Alligator specimens
        const animalEl = e.target.closest('.animal-item');
        if (animalEl) {
            e.preventDefault();

            const animal = animalEl.dataset.animal;
            if (animal && animalGroups[animal]) {
                const filtered = Object.values(animalGroups[animal]).flat();
                setActiveFilter(animalEl);
                loadSearchPage(
                    `Animal: ${animal}`,
                    `Showing all ${animal} specimens`,
                    filtered
                );
            }

            toggleSubmenu(animalEl);
            return;
        }

        // ── 4. Bone prefix in the Bone sidebar (.level-2-toggle) ─────────────
        //    e.g. Skull  →  filter grid to Skull specimens across all animals
        const boneToggleEl = e.target.closest('.level-2-toggle');
        if (boneToggleEl) {
            e.preventDefault();
            const prefix = boneToggleEl.dataset.bone;
            if (prefix) {
                const filtered = Object.values(animalGroups).flatMap(cats => cats[prefix] || []);
                setActiveFilter(boneToggleEl);
                loadSearchPage(`Bone: ${prefix}`, `Showing all ${prefix} specimens`, filtered);
            }
            const toggleElement = e.target.closest('.animal-item, .bone-item, .nested-item, .level-2-toggle');
            const parentLi = toggleElement.parentElement;
            const siblings = parentLi.parentElement.querySelectorAll(':scope > .dropdown-submenu.active');
            siblings.forEach(sib => { if (sib !== parentLi) sib.classList.remove('active'); });
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
            setActiveFilter(null);
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
