export function initDimensionLines(modelViewer) {
  // 1. Inject HTML with Inline Styles (Fixes missing elements & blocking issues)
  const htmlContent = `
    <svg id="dimLines" xmlns="http://www.w3.org/2000/svg" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;" class="dimensionLineContainer">
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

    <!-- Hotspots for dimension lines -->
    <button slot="hotspot-dot+X-Y+Z" class="dot" data-position="1 -1 1" data-normal="1 0 0"></button>
    <button slot="hotspot-dim+X-Y" class="dim" data-position="1 -1 0" data-normal="1 0 0"></button>
    <button slot="hotspot-dot+X-Y-Z" class="dot" data-position="1 -1 -1" data-normal="1 0 0"></button>
    <button slot="hotspot-dim+X-Z" class="dim" data-position="1 0 -1" data-normal="1 0 0"></button>
    <button slot="hotspot-dot+X+Y-Z" class="dot" data-position="1 1 -1" data-normal="0 1 0"></button>
    <button slot="hotspot-dim+Y-Z" class="dim" data-position="0 1 -1" data-normal="0 1 0"></button>
    <button slot="hotspot-dim-Y+Z" class="dim" data-position="0 -1 1" data-normal="0 -1 0"></button>
    <button slot="hotspot-dot-X+Y-Z" class="dot" data-position="-1 1 -1" data-normal="0 1 0"></button>
    <button slot="hotspot-dim-X-Z" class="dim" data-position="-1 0 -1" data-normal="-1 0 0"></button>
    <button slot="hotspot-dot-X-Y-Z" class="dot" data-position="-1 -1 -1" data-normal="-1 0 0"></button>
    <button slot="hotspot-dim-X-Y" class="dim" data-position="-1 -1 0" data-normal="-1 0 0"></button>
    <button slot="hotspot-dot-X-Y+Z" class="dot" data-position="-1 -1 1" data-normal="-1 0 0"></button>
    `;

  modelViewer.insertAdjacentHTML('beforeend', htmlContent);

  // 2. Original Logic (Now guaranteed to find elements)
  const checkbox = modelViewer.querySelector("#show-dimensions");
  const dimensionLineContainer = modelViewer.querySelector("#dimLines");

  function setVisibility(element) {
    if (checkbox.checked) {
      element.classList.remove("hide");
      dimensionLineContainer.classList.add("loaded"); // show the lines
    } else {
      element.classList.add("hide");
      dimensionLineContainer.classList.remove("loaded"); // hide the lines
    }
  }

  checkbox.addEventListener("change", () => {
    setVisibility(modelViewer.querySelector("#dimLines"));
    modelViewer.querySelectorAll("button").forEach((hotspot) => {
      setVisibility(hotspot);
    });
  });

  // Give each line a start and end point,
  // Use the midpoint to check for visibility

  // update svg
  function drawLine(svgLine, dotHotspot1, dotHotspot2, dimensionHotspot) {
    if (dotHotspot1 && dotHotspot2) {
      svgLine.setAttribute("x1", dotHotspot1.canvasPosition.x);
      svgLine.setAttribute("y1", dotHotspot1.canvasPosition.y);
      svgLine.setAttribute("x2", dotHotspot2.canvasPosition.x);
      svgLine.setAttribute("y2", dotHotspot2.canvasPosition.y);

      // use provided optional hotspot to tie visibility of this svg line to
      if (dimensionHotspot && !dimensionHotspot.facingCamera) {
        svgLine.classList.add("hide");
      } else {
        svgLine.classList.remove("hide");
      }
    }
  }

  const dimLines = modelViewer.querySelectorAll("line");

  const renderSVG = () => {
    drawLine(
      dimLines[0],
      modelViewer.queryHotspot("hotspot-dot+X-Y+Z"),
      modelViewer.queryHotspot("hotspot-dot+X-Y-Z"),
      modelViewer.queryHotspot("hotspot-dim+X-Y"),
    );
    drawLine(
      dimLines[1],
      modelViewer.queryHotspot("hotspot-dot+X-Y-Z"),
      modelViewer.queryHotspot("hotspot-dot+X+Y-Z"),
      modelViewer.queryHotspot("hotspot-dim+X-Z"),
    );
    // drawLine(dimLines[2], modelViewer.queryHotspot('hotspot-dot+X+Y-Z'), modelViewer.queryHotspot('hotspot-dot-X+Y-Z')); // always visible
    drawLine(
      dimLines[2],
      modelViewer.queryHotspot("hotspot-dot+X+Y-Z"),
      modelViewer.queryHotspot("hotspot-dot-X+Y-Z"),
      modelViewer.queryHotspot("hotspot-dim+Y-Z"),
    );
    drawLine(
      dimLines[3],
      modelViewer.queryHotspot("hotspot-dot-X-Y+Z"),
      modelViewer.queryHotspot("hotspot-dot+X-Y+Z"),
      modelViewer.queryHotspot("hotspot-dim-Y+Z"),
    );
    drawLine(
      dimLines[4],
      modelViewer.queryHotspot("hotspot-dot-X+Y-Z"),
      modelViewer.queryHotspot("hotspot-dot-X-Y-Z"),
      modelViewer.queryHotspot("hotspot-dim-X-Z"),
    );
    drawLine(
      dimLines[5],
      modelViewer.queryHotspot("hotspot-dot-X-Y-Z"),
      modelViewer.queryHotspot("hotspot-dot-X-Y+Z"),
      modelViewer.queryHotspot("hotspot-dim-X-Y"),
    );
  };

  modelViewer.addEventListener("camera-change", renderSVG);

  // Set the positions of all the hotspots on page load

  modelViewer.addEventListener("load", () => {
    const center = modelViewer.getBoundingBoxCenter();
    const size = modelViewer.getDimensions();
    const x2 = size.x / 2;
    const y2 = size.y / 2;
    const z2 = size.z / 2;

    modelViewer.updateHotspot({
      name: "hotspot-dot+X-Y+Z",
      position: `${center.x + x2} ${center.y - y2} ${center.z + z2}`,
    });

    modelViewer.updateHotspot({
      name: "hotspot-dim+X-Y",
      position: `${center.x + x2} ${center.y - y2} ${center.z}`,
    });

    modelViewer.updateHotspot({
      name: "hotspot-dot+X-Y-Z",
      position: `${center.x + x2} ${center.y - y2} ${center.z - z2}`,
    });

    modelViewer.updateHotspot({
      name: "hotspot-dim+X-Z",
      position: `${center.x + x2} ${center.y} ${center.z - z2}`,
    });

    modelViewer.updateHotspot({
      name: "hotspot-dot+X+Y-Z",
      position: `${center.x + x2} ${center.y + y2} ${center.z - z2}`,
    });

    modelViewer.updateHotspot({
      name: "hotspot-dim+Y-Z",
      position: `${center.x} ${center.y + y2} ${center.z - z2}`,
    });

    modelViewer.updateHotspot({
      name: "hotspot-dot-X+Y-Z",
      position: `${center.x - x2} ${center.y + y2} ${center.z - z2}`,
    });

    modelViewer.updateHotspot({
      name: "hotspot-dim-X-Z",
      position: `${center.x - x2} ${center.y} ${center.z - z2}`,
    });

    modelViewer.updateHotspot({
      name: "hotspot-dot-X-Y-Z",
      position: `${center.x - x2} ${center.y - y2} ${center.z - z2}`,
    });

    modelViewer.updateHotspot({
      name: "hotspot-dim-X-Y",
      position: `${center.x - x2} ${center.y - y2} ${center.z}`,
    });

    modelViewer.updateHotspot({
      name: "hotspot-dot-X-Y+Z",
      position: `${center.x - x2} ${center.y - y2} ${center.z + z2}`,
    });

    modelViewer.updateHotspot({
      name: "hotspot-dim-Y+Z",
      position: `${center.x} ${center.y - y2} ${center.z + z2}`,
    });

    renderSVG();
    
    // Also trigger label update on load
    drawLabels(size);
    
    // Show lines
    dimensionLineContainer.classList.add("loaded");
  });

  // Add the text in appropriate units based off of the radio button
  // The load event sets the text upon page load
  // The change event reruns the code every time a user selects a different
  // choice on any of the menu/radio/checkbox.

  // size of model viewer is in meters by default

  const toInchesConversion = 39.3701; // Add more decimal places for higher precision!

  function drawLabels(size) {
    if (document.getElementById("cms").checked == true) {
      modelViewer.querySelector('button[slot="hotspot-dim+X-Y"]').textContent =
        `${(size.z * 100).toFixed(1)} cm`;

      modelViewer.querySelector('button[slot="hotspot-dim+X-Z"]').textContent =
        `${(size.y * 100).toFixed(1)} cm`;

      modelViewer.querySelector('button[slot="hotspot-dim+Y-Z"]').textContent =
        `${(size.x * 100).toFixed(1)} cm`;

      modelViewer.querySelector('button[slot="hotspot-dim-X-Z"]').textContent =
        `${(size.y * 100).toFixed(1)} cm`;

      modelViewer.querySelector('button[slot="hotspot-dim-X-Y"]').textContent =
        `${(size.z * 100).toFixed(1)} cm`;

      modelViewer.querySelector('button[slot="hotspot-dim-Y+Z"]').textContent =
        `${(size.x * 100).toFixed(1)} cm`;
    } else {
      modelViewer.querySelector('button[slot="hotspot-dim+X-Y"]').textContent =
        `${(size.z * toInchesConversion).toFixed(1)} in`;

      modelViewer.querySelector('button[slot="hotspot-dim+X-Z"]').textContent =
        `${(size.y * toInchesConversion).toFixed(1)} in`;

      modelViewer.querySelector('button[slot="hotspot-dim-Y+Z"]').textContent =
        `${(size.x * toInchesConversion).toFixed(1)} in`;

      modelViewer.querySelector('button[slot="hotspot-dim-X-Z"]').textContent =
        `${(size.y * toInchesConversion).toFixed(1)} in`;

      modelViewer.querySelector('button[slot="hotspot-dim-X-Y"]').textContent =
        `${(size.z * toInchesConversion).toFixed(1)} in`;

      modelViewer.querySelector('button[slot="hotspot-dim-Y+Z"]').textContent =
        `${(size.x * toInchesConversion).toFixed(1)} in`;
    }
  }

  modelViewer.addEventListener("change", () => {
    // const center = modelViewer.getBoundingBoxCenter();
    const size = modelViewer.getDimensions();
    // const x2 = size.x / 2;
    // const y2 = size.y / 2;
    // const z2 = size.z / 2;

    drawLabels(size);
  });
}
