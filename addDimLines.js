const DIMENSION_HOTSPOTS_MARKUP = `
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
`;

const DIMENSION_LINES_MARKUP = `
  <svg id="dimLines" xmlns="http://www.w3.org/2000/svg" class="dimensionLineContainer">
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
`;

function ensureDimensionMarkup(modelViewer) {
  if (!modelViewer.querySelector('button[slot="hotspot-dot+X-Y+Z"]')) {
    modelViewer.insertAdjacentHTML("beforeend", DIMENSION_HOTSPOTS_MARKUP);
  }

  const container = modelViewer.parentElement;
  if (container && !container.querySelector("#dimLines")) {
    modelViewer.insertAdjacentHTML("afterend", DIMENSION_LINES_MARKUP);
  }
}

export function initDimensionLines(modelViewer) {
  const checkbox = modelViewer.parentElement.querySelector("#show-dimensions");
  ensureDimensionMarkup(modelViewer);
  const dimensionLineContainer = modelViewer.parentElement.querySelector("#dimLines");

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
    setVisibility(dimensionLineContainer);
    modelViewer.querySelectorAll("button").forEach((hotspot) => {
      setVisibility(hotspot);
    });
    renderSVG();
  });

  // Give each line a start and end point,
  // Use the midpoint to check for visibility

  // update svg
  function drawLine(svgLine, hotspot1Name, hotspot2Name, dimensionHotspotName) {
    if (!svgLine) return;

    // Use queryHotspot to get real-time 2D positions and visibility
    const hotspot1 = modelViewer.queryHotspot(hotspot1Name);
    const hotspot2 = modelViewer.queryHotspot(hotspot2Name);
    const dimensionHotspot = dimensionHotspotName ? modelViewer.queryHotspot(dimensionHotspotName) : null;
    const dimHotspotEl = dimensionHotspotName ? modelViewer.querySelector(`button[slot="${dimensionHotspotName}"]`) : null;

    if (hotspot1 && hotspot2 && hotspot1.canvasPosition && hotspot2.canvasPosition) {
      svgLine.setAttribute("x1", hotspot1.canvasPosition.x);
      svgLine.setAttribute("y1", hotspot1.canvasPosition.y);
      svgLine.setAttribute("x2", hotspot2.canvasPosition.x);
      svgLine.setAttribute("y2", hotspot2.canvasPosition.y);

      // Manage visibility based on camera facing and checkbox state
      const isVisible = checkbox.checked && (!dimensionHotspot || dimensionHotspot.facingCamera);

      if (isVisible) {
        svgLine.classList.remove("hide");
        if (dimHotspotEl) dimHotspotEl.classList.add("visible");
      } else {
        svgLine.classList.add("hide");
        if (dimHotspotEl) dimHotspotEl.classList.remove("visible");
      }
    } else {
      svgLine.classList.add("hide");
      if (dimHotspotEl) dimHotspotEl.classList.remove("visible");
    }
  }

  const dimLines = modelViewer.parentElement.querySelectorAll("#dimLines line");

  const renderSVG = () => {
    drawLine(dimLines[0], "hotspot-dot+X-Y+Z", "hotspot-dot+X-Y-Z", "hotspot-dim+X-Y");
    drawLine(dimLines[1], "hotspot-dot+X-Y-Z", "hotspot-dot+X+Y-Z", "hotspot-dim+X-Z");
    drawLine(dimLines[2], "hotspot-dot+X+Y-Z", "hotspot-dot-X+Y-Z", "hotspot-dim+Y-Z");
    drawLine(dimLines[3], "hotspot-dot-X-Y+Z", "hotspot-dot+X-Y+Z", "hotspot-dim-Y+Z");
    drawLine(dimLines[4], "hotspot-dot-X+Y-Z", "hotspot-dot-X-Y-Z", "hotspot-dim-X-Z");
    drawLine(dimLines[5], "hotspot-dot-X-Y-Z", "hotspot-dot-X-Y+Z", "hotspot-dim-X-Y");
  };

  // Continuous rendering loop for smooth synchronization (including auto-rotate)
  const tick = () => {
    if (checkbox.checked) {
      renderSVG();
    }
    requestAnimationFrame(tick);
  };

  // Set the positions of all the hotspots on page load
  modelViewer.addEventListener("load", () => {
    // 1. 使用 3.4.0 推荐的 API 获取尺寸和中心点
    const center = modelViewer.getBoundingBoxCenter();
    const size = modelViewer.getDimensions();
    const x2 = size.x / 2;
    const y2 = size.y / 2;
    const z2 = size.z / 2;

    // 2. 定义所有热点的新位置映射
    const hotspots = [
      { name: "hotspot-dot+X-Y+Z", pos: `${center.x + x2} ${center.y - y2} ${center.z + z2}` },
      { name: "hotspot-dim+X-Y", pos: `${center.x + x2} ${center.y - y2} ${center.z}` },
      { name: "hotspot-dot+X-Y-Z", pos: `${center.x + x2} ${center.y - y2} ${center.z - z2}` },
      { name: "hotspot-dim+X-Z", pos: `${center.x + x2} ${center.y} ${center.z - z2}` },
      { name: "hotspot-dot+X+Y-Z", pos: `${center.x + x2} ${center.y + y2} ${center.z - z2}` },
      { name: "hotspot-dim+Y-Z", pos: `${center.x} ${center.y + y2} ${center.z - z2}` },
      { name: "hotspot-dot-X+Y-Z", pos: `${center.x - x2} ${center.y + y2} ${center.z - z2}` },
      { name: "hotspot-dim-X-Z", pos: `${center.x - x2} ${center.y} ${center.z - z2}` },
      { name: "hotspot-dot-X-Y-Z", pos: `${center.x - x2} ${center.y - y2} ${center.z - z2}` },
      { name: "hotspot-dim-X-Y", pos: `${center.x - x2} ${center.y - y2} ${center.z}` },
      { name: "hotspot-dot-X-Y+Z", pos: `${center.x - x2} ${center.y - y2} ${center.z + z2}` },
      { name: "hotspot-dim-Y+Z", pos: `${center.x} ${center.y - y2} ${center.z + z2}` }
    ];

    // 3. 循环更新每一个 Hotspot
    hotspots.forEach(hs => {
      const el = modelViewer.querySelector(`button[slot="${hs.name}"]`);
      if (el) {
        el.dataset.position = hs.pos;
        modelViewer.updateHotspot({
          name: hs.name,
          position: hs.pos
        });
      }
    });

    // 4. 更新文本标签内容
    drawLabels(size);

    // 5. 显示线容器
    dimensionLineContainer.classList.add("loaded");

    // 6. 启动动画帧同步循环
    requestAnimationFrame(tick);
  });

  // Add the text in appropriate units based off of the radio button
  const toInchesConversion = 39.3701;

  function drawLabels(size) {
    if (document.getElementById("cms").checked == true) {
      modelViewer.querySelector('button[slot="hotspot-dim+X-Y"]').textContent = `${(size.z * 100).toFixed(1)} cm`;
      modelViewer.querySelector('button[slot="hotspot-dim+X-Z"]').textContent = `${(size.y * 100).toFixed(1)} cm`;
      modelViewer.querySelector('button[slot="hotspot-dim+Y-Z"]').textContent = `${(size.x * 100).toFixed(1)} cm`;
      modelViewer.querySelector('button[slot="hotspot-dim-X-Z"]').textContent = `${(size.y * 100).toFixed(1)} cm`;
      modelViewer.querySelector('button[slot="hotspot-dim-X-Y"]').textContent = `${(size.z * 100).toFixed(1)} cm`;
      modelViewer.querySelector('button[slot="hotspot-dim-Y+Z"]').textContent = `${(size.x * 100).toFixed(1)} cm`;
    } else {
      modelViewer.querySelector('button[slot="hotspot-dim+X-Y"]').textContent = `${(size.z * toInchesConversion).toFixed(1)} in`;
      modelViewer.querySelector('button[slot="hotspot-dim+X-Z"]').textContent = `${(size.y * toInchesConversion).toFixed(1)} in`;
      modelViewer.querySelector('button[slot="hotspot-dim+Y-Z"]').textContent = `${(size.x * toInchesConversion).toFixed(1)} in`;
      modelViewer.querySelector('button[slot="hotspot-dim-X-Z"]').textContent = `${(size.y * toInchesConversion).toFixed(1)} in`;
      modelViewer.querySelector('button[slot="hotspot-dim-X-Y"]').textContent = `${(size.z * toInchesConversion).toFixed(1)} in`;
      modelViewer.querySelector('button[slot="hotspot-dim-Y+Z"]').textContent = `${(size.x * toInchesConversion).toFixed(1)} in`;
    }
  }

  // Update labels if dimensions change manually or via radio toggle
  const updateDimensionLabels = () => drawLabels(modelViewer.getDimensions());

  modelViewer.addEventListener("change", updateDimensionLabels);

  const cmsRadio = modelViewer.parentElement.querySelector("#cms");
  const inchesRadio = modelViewer.parentElement.querySelector("#inches");
  if (cmsRadio) cmsRadio.addEventListener("change", updateDimensionLabels);
  if (inchesRadio) inchesRadio.addEventListener("change", updateDimensionLabels);
}
