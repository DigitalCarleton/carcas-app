export function initDimensionLines(modelViewer) {
  // 2. Original Logic (Now guaranteed to find elements)
  const checkbox = modelViewer.parentElement.querySelector("#show-dimensions");
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
    setVisibility(modelViewer.querySelector("#dimLines"));
    modelViewer.querySelectorAll("button").forEach((hotspot) => {
      setVisibility(hotspot);
    });
  });

  // Give each line a start and end point,
  // Use the midpoint to check for visibility

  // update svg
  function drawLine(svgLine, dotHotspot1, dotHotspot2, dimensionHotspot) {
    if (!svgLine) return;
    
    // check for empty values
    if (dotHotspot1 && dotHotspot2 && dotHotspot1.canvasPosition && dotHotspot2.canvasPosition) {
      svgLine.setAttribute("x1", dotHotspot1.canvasPosition.x);
      svgLine.setAttribute("y1", dotHotspot1.canvasPosition.y);
      svgLine.setAttribute("x2", dotHotspot2.canvasPosition.x);
      svgLine.setAttribute("y2", dotHotspot2.canvasPosition.y);
      
      // force to draw
      svgLine.style.stroke = "white";
      svgLine.style.strokeWidth = "2";
      svgLine.style.display = "block";

      if (dimensionHotspot && !dimensionHotspot.facingCamera) {
        svgLine.classList.add("hide");
      } else {
        svgLine.classList.remove("hide");
      }
    } else {
      svgLine.style.display = "none";
    }
  }

 const dimLines = document.querySelectorAll("#dimLines line");

  const renderSVG = () => {
    drawLine(
      dimLines[0],
      modelViewer.querySelector('button[slot="hotspot-dot+X-Y+Z"]'),
      modelViewer.querySelector('button[slot="hotspot-dot+X-Y-Z"]'),
      modelViewer.querySelector('button[slot="hotspot-dim+X-Y"]'),
    );
    drawLine(
      dimLines[1],
      modelViewer.querySelector('button[slot="hotspot-dot+X-Y-Z"]'),
      modelViewer.querySelector('button[slot="hotspot-dot+X+Y-Z"]'),
      modelViewer.querySelector('button[slot="hotspot-dim+X-Z"]'),  
    );
    // drawLine(dimLines[2], modelViewer.queryHotspot('hotspot-dot+X+Y-Z'), modelViewer.queryHotspot('hotspot-dot-X+Y-Z')); // always visible
    drawLine(
      dimLines[2],
      modelViewer.querySelector('button[slot="hotspot-dot+X+Y-Z"]'),
      modelViewer.querySelector('button[slot="hotspot-dot-X+Y-Z"]'),
      modelViewer.querySelector('button[slot="hotspot-dim+Y-Z"]'),
    );
    drawLine(
      dimLines[3],
      modelViewer.querySelector('button[slot="hotspot-dot-X-Y+Z"]'),
      modelViewer.querySelector('button[slot="hotspot-dot+X-Y+Z"]'),
      modelViewer.querySelector('button[slot="hotspot-dim-Y+Z"]'),
    );
    drawLine(
      dimLines[4],
      modelViewer.querySelector('button[slot="hotspot-dot-X+Y-Z"]'),
      modelViewer.querySelector('button[slot="hotspot-dot-X-Y-Z"]'),
      modelViewer.querySelector('button[slot="hotspot-dim-X-Z"]'),
    );
    drawLine(
      dimLines[5],
      modelViewer.querySelector('button[slot="hotspot-dot-X-Y-Z"]'),
      modelViewer.querySelector('button[slot="hotspot-dot-X-Y+Z"]'),
      modelViewer.querySelector('button[slot="hotspot-dim-X-Y"]'),
    );
  };

  modelViewer.addEventListener("camera-change", renderSVG);

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
      { name: "hotspot-dim+X-Y",   pos: `${center.x + x2} ${center.y - y2} ${center.z}` },
      { name: "hotspot-dot+X-Y-Z", pos: `${center.x + x2} ${center.y - y2} ${center.z - z2}` },
      { name: "hotspot-dim+X-Z",   pos: `${center.x + x2} ${center.y} ${center.z - z2}` },
      { name: "hotspot-dot+X+Y-Z", pos: `${center.x + x2} ${center.y + y2} ${center.z - z2}` },
      { name: "hotspot-dim+Y-Z",   pos: `${center.x} ${center.y + y2} ${center.z - z2}` },
      { name: "hotspot-dot-X+Y-Z", pos: `${center.x - x2} ${center.y + y2} ${center.z - z2}` },
      { name: "hotspot-dim-X-Z",   pos: `${center.x - x2} ${center.y} ${center.z - z2}` },
      { name: "hotspot-dot-X-Y-Z", pos: `${center.x - x2} ${center.y - y2} ${center.z - z2}` },
      { name: "hotspot-dim-X-Y",   pos: `${center.x - x2} ${center.y - y2} ${center.z}` },
      { name: "hotspot-dot-X-Y+Z", pos: `${center.x - x2} ${center.y - y2} ${center.z + z2}` },
      { name: "hotspot-dim-Y+Z",   pos: `${center.x} ${center.y - y2} ${center.z + z2}` }
    ];

    // 3. 循环更新每一个 Hotspot
    hotspots.forEach(hs => {
      const el = modelViewer.querySelector(`button[slot="${hs.name}"]`);
      if (el) {
        // 更新数据集中的位置属性
        el.dataset.position = hs.pos;
        // 关键：显式调用 API 通知组件更新热点，从而产生投影坐标
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

    // 6. 延迟执行渲染，确保 canvasPosition 已经计算出来
    setTimeout(() => {
      renderSVG();
    }, 100);
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
