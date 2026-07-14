// Konva 畫布：照片背景 + 手繪 + Emoji + 文字
const Editor = (() => {
  let stage, bgLayer, drawLayer, objectLayer, stampLayer, transformer;
  let tool = 'pen';
  let color = '#e53935';
  let currentLine = null;
  let undoStack = []; // { layer, node }
  let bgMeta = null;  // 匯出 JSON 用

  const BRUSH_SIZE = 6;
  const ERASER_SIZE = 24;

  function init(container) {
    const width = container.clientWidth;
    const height = Math.round(width * 4 / 3);

    stage = new Konva.Stage({ container, width, height });
    bgLayer = new Konva.Layer({ listening: false });
    drawLayer = new Konva.Layer();
    objectLayer = new Konva.Layer();
    stampLayer = new Konva.Layer({ listening: false });
    stage.add(bgLayer, drawLayer, objectLayer, stampLayer);

    transformer = new Konva.Transformer({
      rotateEnabled: true,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
    });
    objectLayer.add(transformer);

    bindDrawing();
    bindSelection();
  }

  function reset() {
    bgLayer.destroyChildren();
    drawLayer.destroyChildren();
    objectLayer.destroyChildren();
    objectLayer.add(transformer);
    transformer.nodes([]);
    undoStack = [];
    bgMeta = null;
    stage.draw();
  }

  // 在畫布左下角燒入地點/小孩/日期標籤，匯出時一併保留
  function setStamp(text) {
    stampLayer.destroyChildren();
    const label = new Konva.Label({ x: 12, listening: false });
    label.add(new Konva.Tag({ fill: 'rgba(0,0,0,0.55)', cornerRadius: 8 }));
    label.add(new Konva.Text({
      text,
      fontSize: 16,
      fontFamily: '"Noto Sans TC", sans-serif',
      fill: '#ffffff',
      padding: 10
    }));
    label.y(stage.height() - label.height() - 12);
    stampLayer.add(label);
    stampLayer.draw();
  }

  function setBackground(imageSrc) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // cover 填滿畫布
        const scale = Math.max(stage.width() / img.width, stage.height() / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const node = new Konva.Image({
          image: img,
          x: (stage.width() - w) / 2,
          y: (stage.height() - h) / 2,
          width: w,
          height: h
        });
        bgLayer.destroyChildren();
        bgLayer.add(node);
        bgLayer.draw();
        bgMeta = { width: img.width, height: img.height };
        resolve();
      };
      img.onerror = reject;
      img.src = imageSrc;
    });
  }

  function bindDrawing() {
    stage.on('pointerdown', () => {
      if (tool !== 'pen' && tool !== 'eraser') return;
      const pos = stage.getPointerPosition();
      currentLine = new Konva.Line({
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: color,
        strokeWidth: tool === 'eraser' ? ERASER_SIZE : BRUSH_SIZE,
        lineCap: 'round',
        lineJoin: 'round',
        globalCompositeOperation: tool === 'eraser' ? 'destination-out' : 'source-over',
        listening: false
      });
      drawLayer.add(currentLine);
    });

    stage.on('pointermove', () => {
      if (!currentLine) return;
      const pos = stage.getPointerPosition();
      currentLine.points(currentLine.points().concat([pos.x, pos.y]));
      drawLayer.batchDraw();
    });

    stage.on('pointerup pointercancel', () => {
      if (!currentLine) return;
      undoStack.push({ node: currentLine });
      currentLine = null;
    });
  }

  function bindSelection() {
    stage.on('click tap', (e) => {
      if (tool === 'pen' || tool === 'eraser') return;
      if (e.target === stage || e.target.getLayer() === bgLayer) {
        transformer.nodes([]);
        objectLayer.draw();
        return;
      }
      if (e.target.getLayer() === objectLayer && e.target !== transformer) {
        transformer.nodes([e.target]);
        objectLayer.draw();
      }
    });
  }

  function addObject(node) {
    node.draggable(true);
    objectLayer.add(node);
    transformer.nodes([node]);
    undoStack.push({ node });
    objectLayer.draw();
  }

  function addEmoji(char) {
    addObject(new Konva.Text({
      text: char,
      fontSize: 64,
      x: stage.width() / 2 - 32,
      y: stage.height() / 2 - 32,
      name: 'emoji'
    }));
  }

  function addText(str) {
    addObject(new Konva.Text({
      text: str,
      fontSize: 32,
      fontFamily: '"Noto Sans TC", sans-serif',
      fill: color,
      stroke: '#ffffff',
      strokeWidth: 1,
      x: stage.width() / 2 - 60,
      y: stage.height() / 2,
      name: 'text'
    }));
  }

  function undo() {
    const last = undoStack.pop();
    if (!last) return;
    if (transformer.nodes().includes(last.node)) transformer.nodes([]);
    last.node.destroy();
    stage.draw();
  }

  function setTool(next) {
    tool = next;
    if (tool === 'pen' || tool === 'eraser') {
      transformer.nodes([]);
      objectLayer.draw();
    }
  }

  function setColor(next) { color = next; }

  function toJSON() {
    const objects = objectLayer.getChildren()
      .filter(n => n !== transformer)
      .map(n => ({
        type: n.name(),
        text: n.text(),
        x: n.x(), y: n.y(),
        rotation: n.rotation(),
        scaleX: n.scaleX(), scaleY: n.scaleY(),
        fontSize: n.fontSize(),
        fill: n.fill()
      }));
    const strokes = drawLayer.getChildren().map(l => ({
      points: l.points(),
      stroke: l.stroke(),
      strokeWidth: l.strokeWidth(),
      erase: l.globalCompositeOperation() === 'destination-out'
    }));
    return { canvas: { width: stage.width(), height: stage.height() }, background: bgMeta, strokes, objects };
  }

  function toPNG() {
    transformer.nodes([]);
    objectLayer.draw();
    const pixelRatio = Math.min(CONFIG.exportMaxSize / Math.max(stage.width(), stage.height()), 3);
    return stage.toDataURL({ mimeType: 'image/png', pixelRatio });
  }

  return { init, reset, setBackground, setStamp, addEmoji, addText, undo, setTool, setColor, toJSON, toPNG };
})();
