// Canvas Editor - Main Application
class CanvasEditor {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.elements = [];
        this.selectedElement = null;
        this.currentTool = 'select';
        this.isDrawing = false;
        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = null;
        this.dragStart = { x: 0, y: 0 };
        this.elementIdCounter = 0;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCanvasEvents();
        this.render();
        this.updateLayersList();
    }

    setupEventListeners() {
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectTool(e.target.dataset.tool);
            });
        });

        // Canvas size controls
        document.getElementById('resizeCanvas').addEventListener('click', () => {
            this.resizeCanvas();
        });

        // Background color
        document.getElementById('setBgColor').addEventListener('click', () => {
            this.setBackgroundColor();
        });

        // Export buttons
        document.getElementById('exportPNG').addEventListener('click', () => {
            this.exportToPNG();
        });

        document.getElementById('exportCode').addEventListener('click', () => {
            this.exportToCode();
        });

        // Clear canvas
        document.getElementById('clearCanvas').addEventListener('click', () => {
            this.clearCanvas();
        });

        // Image upload
        document.getElementById('uploadImageBtn').addEventListener('click', () => {
            document.getElementById('imageUpload').click();
        });

        document.getElementById('imageUpload').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        // Modal controls
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('copyCode').addEventListener('click', () => {
            this.copyCodeToClipboard();
        });

        // Click outside modal to close
        document.getElementById('codeModal').addEventListener('click', (e) => {
            if (e.target.id === 'codeModal') {
                this.closeModal();
            }
        });
    }

    setupCanvasEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    selectTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');

        // Set appropriate cursor for each tool
        if (tool === 'select') {
            this.canvas.style.cursor = 'default';
        } else if (tool === 'text') {
            this.canvas.style.cursor = 'text';
        } else {
            this.canvas.style.cursor = 'crosshair';
        }
    }

    handleMouseDown(e) {
        const pos = this.getMousePos(e);

        // Check if clicking on resize handle first
        if (this.selectedElement) {
            const handle = this.getResizeHandle(pos.x, pos.y);
            if (handle) {
                this.isResizing = true;
                this.resizeHandle = handle;
                this.dragStart = { x: pos.x, y: pos.y };
                return;
            }
        }

        // Check if clicking on existing element
        const clickedElement = this.getElementAtPosition(pos.x, pos.y);

        if (clickedElement) {
            this.selectedElement = clickedElement;
            this.isDragging = true;
            this.dragStart = { x: pos.x, y: pos.y };
            this.updatePropertiesPanel();
            this.updateLayersList();
        } else {
            this.selectedElement = null;
            // Only create new elements if we're not using the select tool
            if (this.currentTool !== 'select') {
                this.createNewElement(pos);
            }
        }

        this.render();
    }

    handleMouseMove(e) {
        const pos = this.getMousePos(e);

        if (this.isResizing && this.selectedElement && this.resizeHandle) {
            this.handleResize(pos);
        } else if (this.isDragging && this.selectedElement) {
            const dx = pos.x - this.dragStart.x;
            const dy = pos.y - this.dragStart.y;

            // Move the element's position
            this.selectedElement.x += dx;
            this.selectedElement.y += dy;

            // For lines, also move the end point to maintain the line's shape
            if (this.selectedElement.type === 'line') {
                this.selectedElement.endX += dx;
                this.selectedElement.endY += dy;
            }

            this.dragStart = { x: pos.x, y: pos.y };
            this.render();
        } else if (this.currentTool === 'select') {
            // Update cursor based on what's under the mouse when using select tool
            if (this.selectedElement) {
                const handle = this.getResizeHandle(pos.x, pos.y);
                if (handle) {
                    this.canvas.style.cursor = this.getResizeCursor(handle);
                } else if (this.getElementAtPosition(pos.x, pos.y)) {
                    this.canvas.style.cursor = 'move';
                } else {
                    this.canvas.style.cursor = 'default';
                }
            } else {
                // Show appropriate cursor when hovering over elements
                const hoveredElement = this.getElementAtPosition(pos.x, pos.y);
                if (hoveredElement) {
                    this.canvas.style.cursor = 'pointer';
                } else {
                    this.canvas.style.cursor = 'default';
                }
            }
        }
    }

    handleMouseUp(e) {
        this.isDragging = false;
        this.isDrawing = false;
        this.isResizing = false;
        this.resizeHandle = null;

        // Reset cursor based on current tool
        if (this.currentTool === 'select') {
            this.canvas.style.cursor = 'default';
        } else if (this.currentTool === 'text') {
            this.canvas.style.cursor = 'text';
        } else {
            this.canvas.style.cursor = 'crosshair';
        }
    }

    handleDoubleClick(e) {
        const pos = this.getMousePos(e);
        const clickedElement = this.getElementAtPosition(pos.x, pos.y);

        if (clickedElement && clickedElement.type === 'text') {
            this.editTextElement(clickedElement);
        }
    }

    createNewElement(pos) {
        if (!this.currentTool || this.currentTool === 'select') return;

        const element = {
            id: ++this.elementIdCounter,
            type: this.currentTool,
            x: pos.x,
            y: pos.y,
            visible: true,
            name: `${this.currentTool} ${this.elementIdCounter}`
        };

        switch (this.currentTool) {
            case 'text':
                Object.assign(element, {
                    text: 'Sample Text',
                    fontSize: 18,
                    fontFamily: 'Poppins',
                    color: '#000000',
                    textAlign: 'left',
                    fontWeight: 'normal',
                    width: 200,
                    lineHeight: 1.4
                });
                break;

            case 'line':
                Object.assign(element, {
                    endX: pos.x + 100,
                    endY: pos.y,
                    strokeColor: '#000000',
                    lineWidth: 2
                });
                break;

            case 'rectangle':
                Object.assign(element, {
                    width: 100,
                    height: 60,
                    fillColor: '#ffffff',
                    strokeColor: '#000000',
                    lineWidth: 2,
                    filled: false
                });
                break;

            case 'circle':
                Object.assign(element, {
                    radius: 40,
                    fillColor: '#ffffff',
                    strokeColor: '#000000',
                    lineWidth: 2,
                    filled: false
                });
                break;

            case 'image':
                // Image will be handled by upload
                return;
        }

        this.elements.push(element);
        this.selectedElement = element;
        this.updatePropertiesPanel();
        this.updateLayersList();
        this.render();
    }

    getElementAtPosition(x, y) {
        // Check elements in reverse order (top to bottom)
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const element = this.elements[i];
            if (!element.visible) continue;

            if (this.isPointInElement(x, y, element)) {
                return element;
            }
        }
        return null;
    }

    isPointInElement(x, y, element) {
        switch (element.type) {
            case 'text':
                // Approximate text bounds
                this.ctx.font = `${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
                const textWidth = this.ctx.measureText(element.text).width;
                const textHeight = element.fontSize;
                return x >= element.x && x <= element.x + textWidth &&
                    y >= element.y - textHeight && y <= element.y;

            case 'rectangle':
                return x >= element.x && x <= element.x + element.width &&
                    y >= element.y && y <= element.y + element.height;

            case 'circle':
                const dx = x - element.x;
                const dy = y - element.y;
                return Math.sqrt(dx * dx + dy * dy) <= element.radius;

            case 'line':
                // Simple line hit detection (within 5 pixels)
                const lineDistance = this.distanceFromPointToLine(
                    x, y, element.x, element.y, element.endX, element.endY
                );
                return lineDistance <= 5;

            case 'image':
                return x >= element.x && x <= element.x + element.width &&
                    y >= element.y && y <= element.y + element.height;

            default:
                return false;
        }
    }

    distanceFromPointToLine(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    render() {
        // Clear canvas with background color
        const bgColor = document.getElementById('bgColor').value;
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render all elements
        this.elements.forEach(element => {
            if (element.visible) {
                this.renderElement(element);
            }
        });

        // Highlight selected element
        if (this.selectedElement) {
            this.highlightElement(this.selectedElement);
        }
    }

    renderElement(element) {
        this.ctx.save();

        switch (element.type) {
            case 'text':
                this.ctx.font = `${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
                this.ctx.fillStyle = element.color;
                this.ctx.textAlign = element.textAlign;
                this.renderWrappedText(element);
                break;

            case 'line':
                this.ctx.beginPath();
                this.ctx.moveTo(element.x, element.y);
                this.ctx.lineTo(element.endX, element.endY);
                this.ctx.strokeStyle = element.strokeColor;
                this.ctx.lineWidth = element.lineWidth;
                this.ctx.stroke();
                break;

            case 'rectangle':
                if (element.filled) {
                    this.ctx.fillStyle = element.fillColor;
                    this.ctx.fillRect(element.x, element.y, element.width, element.height);
                }
                this.ctx.strokeStyle = element.strokeColor;
                this.ctx.lineWidth = element.lineWidth;
                this.ctx.strokeRect(element.x, element.y, element.width, element.height);
                break;

            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(element.x, element.y, element.radius, 0, 2 * Math.PI);
                if (element.filled) {
                    this.ctx.fillStyle = element.fillColor;
                    this.ctx.fill();
                }
                this.ctx.strokeStyle = element.strokeColor;
                this.ctx.lineWidth = element.lineWidth;
                this.ctx.stroke();
                break;

            case 'image':
                if (element.img && element.img.complete) {
                    this.ctx.drawImage(element.img, element.x, element.y, element.width, element.height);
                }
                break;
        }

        this.ctx.restore();
    }

    renderWrappedText(element) {
        const words = element.text.split(' ');
        let line = '';
        let y = element.y;
        const lineHeight = element.fontSize * element.lineHeight;
        const maxWidth = element.width;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
                this.ctx.fillText(line.trim(), element.x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        this.ctx.fillText(line.trim(), element.x, y);
    }

    getResizeHandle(x, y) {
        if (!this.selectedElement) return null;

        const handles = this.getResizeHandles(this.selectedElement);
        const handleSize = 8;

        for (let handle of handles) {
            if (x >= handle.x - handleSize && x <= handle.x + handleSize &&
                y >= handle.y - handleSize && y <= handle.y + handleSize) {
                return handle.type;
            }
        }
        return null;
    }

    getResizeHandles(element) {
        const handles = [];

        switch (element.type) {
            case 'line':
                handles.push(
                    { type: 'start', x: element.x, y: element.y },
                    { type: 'end', x: element.endX, y: element.endY }
                );
                break;

            case 'text':
                const textBounds = this.getTextBounds(element);
                handles.push(
                    { type: 'nw', x: textBounds.x, y: textBounds.y },
                    { type: 'ne', x: textBounds.x + textBounds.width, y: textBounds.y },
                    { type: 'sw', x: textBounds.x, y: textBounds.y + textBounds.height },
                    { type: 'se', x: textBounds.x + textBounds.width, y: textBounds.y + textBounds.height },
                    { type: 'e', x: textBounds.x + textBounds.width, y: textBounds.y + textBounds.height / 2 }
                );
                break;

            case 'rectangle':
                handles.push(
                    { type: 'nw', x: element.x, y: element.y },
                    { type: 'ne', x: element.x + element.width, y: element.y },
                    { type: 'sw', x: element.x, y: element.y + element.height },
                    { type: 'se', x: element.x + element.width, y: element.y + element.height },
                    { type: 'n', x: element.x + element.width / 2, y: element.y },
                    { type: 's', x: element.x + element.width / 2, y: element.y + element.height },
                    { type: 'w', x: element.x, y: element.y + element.height / 2 },
                    { type: 'e', x: element.x + element.width, y: element.y + element.height / 2 }
                );
                break;

            case 'circle':
                handles.push(
                    { type: 'n', x: element.x, y: element.y - element.radius },
                    { type: 's', x: element.x, y: element.y + element.radius },
                    { type: 'w', x: element.x - element.radius, y: element.y },
                    { type: 'e', x: element.x + element.radius, y: element.y }
                );
                break;

            case 'image':
                handles.push(
                    { type: 'nw', x: element.x, y: element.y },
                    { type: 'ne', x: element.x + element.width, y: element.y },
                    { type: 'sw', x: element.x, y: element.y + element.height },
                    { type: 'se', x: element.x + element.width, y: element.y + element.height },
                    { type: 'n', x: element.x + element.width / 2, y: element.y },
                    { type: 's', x: element.x + element.width / 2, y: element.y + element.height },
                    { type: 'w', x: element.x, y: element.y + element.height / 2 },
                    { type: 'e', x: element.x + element.width, y: element.y + element.height / 2 }
                );
                break;
        }

        return handles;
    }

    getTextBounds(element) {
        this.ctx.font = `${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
        const words = element.text.split(' ');
        let line = '';
        let maxWidth = 0;
        let lineCount = 1;
        const lineHeight = element.fontSize * element.lineHeight;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > element.width && n > 0) {
                maxWidth = Math.max(maxWidth, this.ctx.measureText(line.trim()).width);
                line = words[n] + ' ';
                lineCount++;
            } else {
                line = testLine;
            }
        }
        maxWidth = Math.max(maxWidth, this.ctx.measureText(line.trim()).width);

        return {
            x: element.x,
            y: element.y - element.fontSize,
            width: Math.min(maxWidth, element.width),
            height: lineCount * lineHeight
        };
    }

    getResizeCursor(handleType) {
        const cursors = {
            'nw': 'nw-resize', 'ne': 'ne-resize', 'sw': 'sw-resize', 'se': 'se-resize',
            'n': 'n-resize', 's': 's-resize', 'w': 'w-resize', 'e': 'e-resize',
            'start': 'grab', 'end': 'grab'
        };
        return cursors[handleType] || 'grab';
    }

    handleResize(pos) {
        const dx = pos.x - this.dragStart.x;
        const dy = pos.y - this.dragStart.y;
        const element = this.selectedElement;

        switch (element.type) {
            case 'line':
                if (this.resizeHandle === 'start') {
                    element.x = pos.x;
                    element.y = pos.y;
                } else if (this.resizeHandle === 'end') {
                    element.endX = pos.x;
                    element.endY = pos.y;
                }
                break;

            case 'text':
                if (this.resizeHandle === 'e') {
                    element.width = Math.max(50, element.width + dx);
                } else if (this.resizeHandle.includes('e')) {
                    element.width = Math.max(50, element.width + dx);
                }
                if (this.resizeHandle.includes('s')) {
                    // Height is calculated automatically based on content
                }
                break;

            case 'rectangle':
                this.resizeRectangle(element, this.resizeHandle, dx, dy);
                break;

            case 'circle':
                if (this.resizeHandle === 'n' || this.resizeHandle === 's') {
                    element.radius = Math.max(10, Math.abs(pos.y - element.y));
                } else if (this.resizeHandle === 'w' || this.resizeHandle === 'e') {
                    element.radius = Math.max(10, Math.abs(pos.x - element.x));
                }
                break;

            case 'image':
                this.resizeRectangle(element, this.resizeHandle, dx, dy);
                break;
        }

        this.dragStart = { x: pos.x, y: pos.y };
        this.render();
        this.updatePropertiesPanel();
    }

    resizeRectangle(element, handle, dx, dy) {
        switch (handle) {
            case 'nw':
                element.x += dx;
                element.y += dy;
                element.width -= dx;
                element.height -= dy;
                break;
            case 'ne':
                element.y += dy;
                element.width += dx;
                element.height -= dy;
                break;
            case 'sw':
                element.x += dx;
                element.width -= dx;
                element.height += dy;
                break;
            case 'se':
                element.width += dx;
                element.height += dy;
                break;
            case 'n':
                element.y += dy;
                element.height -= dy;
                break;
            case 's':
                element.height += dy;
                break;
            case 'w':
                element.x += dx;
                element.width -= dx;
                break;
            case 'e':
                element.width += dx;
                break;
        }

        // Ensure minimum size
        if (element.width < 20) {
            element.width = 20;
        }
        if (element.height < 20) {
            element.height = 20;
        }
    }

    highlightElement(element) {
        this.ctx.save();
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        let bounds = this.getElementBounds(element);
        this.ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);

        // Draw resize handles
        this.drawResizeHandles(element);

        this.ctx.restore();
    }

    drawResizeHandles(element) {
        const handles = this.getResizeHandles(element);
        const handleSize = 8;

        this.ctx.fillStyle = '#3b82f6';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([]);

        handles.forEach(handle => {
            this.ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
            this.ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
        });
    }

    getElementBounds(element) {
        switch (element.type) {
            case 'text':
                return this.getTextBounds(element);

            case 'rectangle':
                return {
                    x: element.x,
                    y: element.y,
                    width: element.width,
                    height: element.height
                };

            case 'circle':
                return {
                    x: element.x - element.radius,
                    y: element.y - element.radius,
                    width: element.radius * 2,
                    height: element.radius * 2
                };

            case 'line':
                return {
                    x: Math.min(element.x, element.endX),
                    y: Math.min(element.y, element.endY),
                    width: Math.abs(element.endX - element.x),
                    height: Math.abs(element.endY - element.y)
                };

            case 'image':
                return {
                    x: element.x,
                    y: element.y,
                    width: element.width,
                    height: element.height
                };

            default:
                return { x: element.x, y: element.y, width: 0, height: 0 };
        }
    }

    updatePropertiesPanel() {
        const propertiesContent = document.getElementById('propertiesContent');

        if (!this.selectedElement) {
            propertiesContent.innerHTML = '<p class="no-selection">Select an element to edit properties</p>';
            return;
        }

        const element = this.selectedElement;
        let html = '';

        // Common properties
        html += `
            <div class="property-group">
                <label>Name:</label>
                <input type="text" id="elementName" value="${element.name}" onchange="canvasEditor.updateElementProperty('name', this.value)">
            </div>
            <div class="property-row">
                <div class="property-group">
                    <label>X:</label>
                    <input type="number" id="elementX" value="${Math.round(element.x)}" onchange="canvasEditor.updateElementProperty('x', parseFloat(this.value))">
                </div>
                <div class="property-group">
                    <label>Y:</label>
                    <input type="number" id="elementY" value="${Math.round(element.y)}" onchange="canvasEditor.updateElementProperty('y', parseFloat(this.value))">
                </div>
            </div>
        `;

        // Type-specific properties
        switch (element.type) {
            case 'text':
                html += `
                    <div class="property-group">
                        <label>Text:</label>
                        <textarea id="elementText" onchange="canvasEditor.updateElementProperty('text', this.value)">${element.text}</textarea>
                    </div>
                    <div class="property-row">
                        <div class="property-group">
                            <label>Font Size:</label>
                            <input type="number" id="fontSize" value="${element.fontSize}" min="8" max="200" onchange="canvasEditor.updateElementProperty('fontSize', parseInt(this.value))">
                        </div>
                        <div class="property-group">
                            <label>Width:</label>
                            <input type="number" id="textWidth" value="${Math.round(element.width)}" min="50" max="800" onchange="canvasEditor.updateElementProperty('width', parseInt(this.value))">
                        </div>
                    </div>
                    <div class="property-group">
                        <label>Font Family:</label>
                        <select id="fontFamily" onchange="canvasEditor.updateElementProperty('fontFamily', this.value)">
                            <option value="Poppins" ${element.fontFamily === 'Poppins' ? 'selected' : ''}>Poppins</option>
                            <option value="Inter" ${element.fontFamily === 'Inter' ? 'selected' : ''}>Inter</option>
                            <option value="Roboto" ${element.fontFamily === 'Roboto' ? 'selected' : ''}>Roboto</option>
                            <option value="Arial" ${element.fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
                            <option value="serif" ${element.fontFamily === 'serif' ? 'selected' : ''}>Serif</option>
                            <option value="monospace" ${element.fontFamily === 'monospace' ? 'selected' : ''}>Monospace</option>
                        </select>
                    </div>
                    <div class="property-row">
                        <div class="property-group">
                            <label>Color:</label>
                            <input type="color" id="textColor" value="${element.color}" onchange="canvasEditor.updateElementProperty('color', this.value)">
                        </div>
                        <div class="property-group">
                            <label>Weight:</label>
                            <select id="fontWeight" onchange="canvasEditor.updateElementProperty('fontWeight', this.value)">
                                <option value="normal" ${element.fontWeight === 'normal' ? 'selected' : ''}>Normal</option>
                                <option value="bold" ${element.fontWeight === 'bold' ? 'selected' : ''}>Bold</option>
                                <option value="300" ${element.fontWeight === '300' ? 'selected' : ''}>Light</option>
                                <option value="600" ${element.fontWeight === '600' ? 'selected' : ''}>Semi Bold</option>
                            </select>
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-group">
                            <label>Line Height:</label>
                            <input type="number" id="lineHeight" value="${element.lineHeight}" min="1" max="3" step="0.1" onchange="canvasEditor.updateElementProperty('lineHeight', parseFloat(this.value))">
                        </div>
                        <div class="property-group">
                            <label>Text Align:</label>
                            <select id="textAlign" onchange="canvasEditor.updateElementProperty('textAlign', this.value)">
                                <option value="left" ${element.textAlign === 'left' ? 'selected' : ''}>Left</option>
                                <option value="center" ${element.textAlign === 'center' ? 'selected' : ''}>Center</option>
                                <option value="right" ${element.textAlign === 'right' ? 'selected' : ''}>Right</option>
                            </select>
                        </div>
                    </div>
                `;
                break;

            case 'line':
                html += `
                    <div class="property-row">
                        <div class="property-group">
                            <label>End X:</label>
                            <input type="number" id="lineEndX" value="${Math.round(element.endX)}" onchange="canvasEditor.updateElementProperty('endX', parseFloat(this.value))">
                        </div>
                        <div class="property-group">
                            <label>End Y:</label>
                            <input type="number" id="lineEndY" value="${Math.round(element.endY)}" onchange="canvasEditor.updateElementProperty('endY', parseFloat(this.value))">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-group">
                            <label>Color:</label>
                            <input type="color" id="strokeColor" value="${element.strokeColor}" onchange="canvasEditor.updateElementProperty('strokeColor', this.value)">
                        </div>
                        <div class="property-group">
                            <label>Width:</label>
                            <input type="number" id="lineWidth" value="${element.lineWidth}" min="1" max="20" onchange="canvasEditor.updateElementProperty('lineWidth', parseInt(this.value))">
                        </div>
                    </div>
                `;
                break;

            case 'rectangle':
                html += `
                    <div class="property-row">
                        <div class="property-group">
                            <label>Width:</label>
                            <input type="number" id="rectWidth" value="${Math.round(element.width)}" onchange="canvasEditor.updateElementProperty('width', parseFloat(this.value))">
                        </div>
                        <div class="property-group">
                            <label>Height:</label>
                            <input type="number" id="rectHeight" value="${Math.round(element.height)}" onchange="canvasEditor.updateElementProperty('height', parseFloat(this.value))">
                        </div>
                    </div>
                    <div class="property-group">
                        <label>
                            <input type="checkbox" id="filled" ${element.filled ? 'checked' : ''} onchange="canvasEditor.updateElementProperty('filled', this.checked)">
                            Filled
                        </label>
                    </div>
                    <div class="property-row">
                        <div class="property-group">
                            <label>Fill Color:</label>
                            <input type="color" id="fillColor" value="${element.fillColor}" onchange="canvasEditor.updateElementProperty('fillColor', this.value)">
                        </div>
                        <div class="property-group">
                            <label>Stroke Color:</label>
                            <input type="color" id="strokeColor" value="${element.strokeColor}" onchange="canvasEditor.updateElementProperty('strokeColor', this.value)">
                        </div>
                    </div>
                `;
                break;

            case 'circle':
                html += `
                    <div class="property-group">
                        <label>Radius:</label>
                        <input type="number" id="radius" value="${Math.round(element.radius)}" min="1" onchange="canvasEditor.updateElementProperty('radius', parseFloat(this.value))">
                    </div>
                    <div class="property-group">
                        <label>
                            <input type="checkbox" id="filled" ${element.filled ? 'checked' : ''} onchange="canvasEditor.updateElementProperty('filled', this.checked)">
                            Filled
                        </label>
                    </div>
                    <div class="property-row">
                        <div class="property-group">
                            <label>Fill Color:</label>
                            <input type="color" id="fillColor" value="${element.fillColor}" onchange="canvasEditor.updateElementProperty('fillColor', this.value)">
                        </div>
                        <div class="property-group">
                            <label>Stroke Color:</label>
                            <input type="color" id="strokeColor" value="${element.strokeColor}" onchange="canvasEditor.updateElementProperty('strokeColor', this.value)">
                        </div>
                    </div>
                `;
                break;

            case 'image':
                html += `
                    <div class="property-row">
                        <div class="property-group">
                            <label>Width:</label>
                            <input type="number" id="imgWidth" value="${Math.round(element.width)}" onchange="canvasEditor.updateElementProperty('width', parseFloat(this.value))">
                        </div>
                        <div class="property-group">
                            <label>Height:</label>
                            <input type="number" id="imgHeight" value="${Math.round(element.height)}" onchange="canvasEditor.updateElementProperty('height', parseFloat(this.value))">
                        </div>
                    </div>
                `;
                break;
        }

        // Delete button
        html += `
            <div class="property-group" style="margin-top: 20px;">
                <button class="btn btn-secondary" onclick="canvasEditor.deleteSelectedElement()" style="width: 100%;">Delete Element</button>
            </div>
        `;

        propertiesContent.innerHTML = html;
    }

    updateElementProperty(property, value) {
        if (this.selectedElement) {
            this.selectedElement[property] = value;
            this.render();
            this.updateLayersList();
        }
    }

    deleteSelectedElement() {
        if (this.selectedElement) {
            const index = this.elements.indexOf(this.selectedElement);
            if (index > -1) {
                this.elements.splice(index, 1);
                this.selectedElement = null;
                this.updatePropertiesPanel();
                this.updateLayersList();
                this.render();
            }
        }
    }

    updateLayersList() {
        const layersList = document.getElementById('layersList');

        if (this.elements.length === 0) {
            layersList.innerHTML = '<p class="no-selection">No elements added yet</p>';
            return;
        }

        let html = '';
        this.elements.forEach(element => {
            const isSelected = this.selectedElement && this.selectedElement.id === element.id;
            html += `
                <div class="layer-item ${isSelected ? 'selected' : ''}" onclick="canvasEditor.selectElementById(${element.id})">
                    <div class="layer-info">
                        <div class="layer-name">${element.name}</div>
                        <div class="layer-type">${element.type}</div>
                    </div>
                    <div class="layer-actions">
                        <button class="layer-action" onclick="event.stopPropagation(); canvasEditor.toggleElementVisibility(${element.id})" title="Toggle visibility">
                            ${element.visible ? '👁️' : '🚫'}
                        </button>
                        <button class="layer-action" onclick="event.stopPropagation(); canvasEditor.deleteElementById(${element.id})" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        });

        layersList.innerHTML = html;
    }

    selectElementById(id) {
        this.selectedElement = this.elements.find(el => el.id === id);
        this.updatePropertiesPanel();
        this.updateLayersList();
        this.render();
    }

    toggleElementVisibility(id) {
        const element = this.elements.find(el => el.id === id);
        if (element) {
            element.visible = !element.visible;
            this.updateLayersList();
            this.render();
        }
    }

    deleteElementById(id) {
        const index = this.elements.findIndex(el => el.id === id);
        if (index > -1) {
            this.elements.splice(index, 1);
            if (this.selectedElement && this.selectedElement.id === id) {
                this.selectedElement = null;
                this.updatePropertiesPanel();
            }
            this.updateLayersList();
            this.render();
        }
    }

    resizeCanvas() {
        const width = parseInt(document.getElementById('canvasWidth').value);
        const height = parseInt(document.getElementById('canvasHeight').value);

        this.canvas.width = width;
        this.canvas.height = height;
        this.render();
    }

    setBackgroundColor() {
        this.render();
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear all elements?')) {
            this.elements = [];
            this.selectedElement = null;
            this.updatePropertiesPanel();
            this.updateLayersList();
            this.render();
        }
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const element = {
                        id: ++this.elementIdCounter,
                        type: 'image',
                        x: 50,
                        y: 50,
                        width: Math.min(img.width, 200),
                        height: Math.min(img.height, 200),
                        img: img,
                        visible: true,
                        name: `Image ${this.elementIdCounter}`
                    };

                    // Maintain aspect ratio
                    const aspectRatio = img.width / img.height;
                    if (element.width / element.height > aspectRatio) {
                        element.width = element.height * aspectRatio;
                    } else {
                        element.height = element.width / aspectRatio;
                    }

                    this.elements.push(element);
                    this.selectedElement = element;
                    this.updatePropertiesPanel();
                    this.updateLayersList();
                    this.render();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
        // Clear the input
        e.target.value = '';
    }

    exportToPNG() {
        // Create a temporary canvas with white background
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // Set white background
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw the current canvas content
        tempCtx.drawImage(this.canvas, 0, 0);

        // Create download link
        const link = document.createElement('a');
        link.download = 'canvas-export.png';
        link.href = tempCanvas.toDataURL();
        link.click();
    }

    exportToCode() {
        let code = `// Canvas drawing code (${this.canvas.width}x${this.canvas.height})\n`;
        code += `const canvas = document.getElementById('canvas');\n`;
        code += `const ctx = canvas.getContext('2d');\n`;
        code += `canvas.width = ${this.canvas.width};\n`;
        code += `canvas.height = ${this.canvas.height};\n\n`;

        // Background color
        const bgColor = document.getElementById('bgColor').value;
        code += `// Set background color\n`;
        code += `ctx.fillStyle = '${bgColor}';\n`;
        code += `ctx.fillRect(0, 0, canvas.width, canvas.height);\n\n`;

        // Helper functions
        code += `// Helper functions\n`;
        code += `function fitTextToWidth(ctx, text, maxWidth, minSize, fontFamily, maxSize) {\n`;
        code += `    let size = maxSize;\n`;
        code += `    do {\n`;
        code += `        ctx.font = size + 'px ' + fontFamily;\n`;
        code += `        size--;\n`;
        code += `    } while (ctx.measureText(text).width > maxWidth && size > minSize);\n`;
        code += `    return size + 1;\n`;
        code += `}\n\n`;

        code += `function wrapText(ctx, text, x, y, maxWidth, lineHeight) {\n`;
        code += `    const words = text.split(' ');\n`;
        code += `    let line = '';\n`;
        code += `    let currentY = y;\n`;
        code += `    \n`;
        code += `    for (let n = 0; n < words.length; n++) {\n`;
        code += `        const testLine = line + words[n] + ' ';\n`;
        code += `        const metrics = ctx.measureText(testLine);\n`;
        code += `        const testWidth = metrics.width;\n`;
        code += `        \n`;
        code += `        if (testWidth > maxWidth && n > 0) {\n`;
        code += `            ctx.fillText(line, x, currentY);\n`;
        code += `            line = words[n] + ' ';\n`;
        code += `            currentY += lineHeight;\n`;
        code += `        } else {\n`;
        code += `            line = testLine;\n`;
        code += `        }\n`;
        code += `    }\n`;
        code += `    ctx.fillText(line, x, currentY);\n`;
        code += `}\n\n`;

        // Draw elements
        this.elements.forEach((element, index) => {
            if (!element.visible) return;

            code += `// ${element.name}\n`;

            switch (element.type) {
                case 'text':
                    code += `ctx.font = '${element.fontWeight} ${element.fontSize}px ${element.fontFamily}';\n`;
                    code += `ctx.fillStyle = '${element.color}';\n`;
                    code += `ctx.textAlign = '${element.textAlign}';\n`;
                    code += `ctx.fillText('${element.text.replace(/'/g, "\\'")}', ${element.x}, ${element.y});\n\n`;
                    break;

                case 'line':
                    code += `ctx.beginPath();\n`;
                    code += `ctx.moveTo(${element.x}, ${element.y});\n`;
                    code += `ctx.lineTo(${element.endX}, ${element.endY});\n`;
                    code += `ctx.strokeStyle = '${element.strokeColor}';\n`;
                    code += `ctx.lineWidth = ${element.lineWidth};\n`;
                    code += `ctx.stroke();\n\n`;
                    break;

                case 'rectangle':
                    if (element.filled) {
                        code += `ctx.fillStyle = '${element.fillColor}';\n`;
                        code += `ctx.fillRect(${element.x}, ${element.y}, ${element.width}, ${element.height});\n`;
                    }
                    code += `ctx.strokeStyle = '${element.strokeColor}';\n`;
                    code += `ctx.lineWidth = ${element.lineWidth};\n`;
                    code += `ctx.strokeRect(${element.x}, ${element.y}, ${element.width}, ${element.height});\n\n`;
                    break;

                case 'circle':
                    code += `ctx.beginPath();\n`;
                    code += `ctx.arc(${element.x}, ${element.y}, ${element.radius}, 0, 2 * Math.PI);\n`;
                    if (element.filled) {
                        code += `ctx.fillStyle = '${element.fillColor}';\n`;
                        code += `ctx.fill();\n`;
                    }
                    code += `ctx.strokeStyle = '${element.strokeColor}';\n`;
                    code += `ctx.lineWidth = ${element.lineWidth};\n`;
                    code += `ctx.stroke();\n\n`;
                    break;

                case 'image':
                    code += `// Note: Image element requires the image to be loaded first\n`;
                    code += `// const img${index} = new Image();\n`;
                    code += `// img${index}.onload = function() {\n`;
                    code += `//     ctx.drawImage(img${index}, ${element.x}, ${element.y}, ${element.width}, ${element.height});\n`;
                    code += `// };\n`;
                    code += `// img${index}.src = 'path/to/your/image';\n\n`;
                    break;
            }
        });

        document.getElementById('codeOutput').value = code;
        document.getElementById('codeModal').style.display = 'block';
    }

    copyCodeToClipboard() {
        const codeOutput = document.getElementById('codeOutput');
        codeOutput.select();
        document.execCommand('copy');

        const button = document.getElementById('copyCode');
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 1000);
    }

    closeModal() {
        document.getElementById('codeModal').style.display = 'none';
    }
}

// Initialize the application
let canvasEditor;
document.addEventListener('DOMContentLoaded', () => {
    canvasEditor = new CanvasEditor();
});