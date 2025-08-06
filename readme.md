# Canvas Editor - Drag & Drop Designer

A powerful web-based canvas editor that allows users to create, edit, and export visual designs with drag-and-drop functionality. Perfect for creating custom graphics, layouts, and generating clean JavaScript canvas code.

![Canvas Editor Demo](https://github.com/davolu/canvas-editor/blob/main/screencapture-demo.png)

## ✨ Features

### 🎨 Design Tools
- **Text Elements**: Add customizable text with multiple fonts, sizes, and styles
- **Image Upload**: Upload and resize images with maintained aspect ratios
- **Drawing Tools**: Create lines, rectangles, and circles with custom colors
- **Drag & Drop**: Intuitive element positioning and manipulation
- **Layer Management**: Visual layer panel with show/hide controls

### 🖼️ Canvas Controls
- **Adjustable Canvas Size**: Custom width and height settings
- **Background Colors**: Customizable canvas background
- **Element Selection**: Click to select and edit properties
- **Real-time Preview**: Instant visual feedback for all changes

### 📤 Export Options
- **PNG Export**: High-quality image download
- **JavaScript Code Export**: Clean, executable canvas code generation
- **Helper Functions**: Includes text fitting and wrapping utilities

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (XAMPP, MAMP, or similar) or live server extension

### Installation
1. Clone or download this repository
2. Place files in your web server directory
3. Open `index.html` in your browser
4. Start creating!

### Usage
1. **Select a Tool**: Choose from text, image, line, rectangle, or circle tools
2. **Create Elements**: Click on the canvas to add new elements
3. **Edit Properties**: Use the right sidebar to customize selected elements
4. **Position Elements**: Drag elements around the canvas
5. **Manage Layers**: Use the layers panel to control visibility and order
6. **Export**: Save as PNG or generate JavaScript code

## 🎯 Element Types

### Text Elements
- **Fonts**: Poppins, Inter, Roboto, Arial, Serif, Monospace
- **Sizes**: 8px to 200px
- **Weights**: Light, Normal, Semi-Bold, Bold
- **Colors**: Full color picker support
- **Alignment**: Left, center, right

### Images
- **Upload**: Support for all common image formats
- **Resize**: Maintain aspect ratio or custom dimensions
- **Position**: Drag and drop placement

### Shapes
- **Lines**: Customizable color, width, and positioning
- **Rectangles**: Filled or outline with custom colors
- **Circles**: Filled or outline with adjustable radius

## 💻 Code Export

The application generates clean JavaScript canvas code in this format:

```javascript
// Canvas drawing code (800x600)
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Set background color
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Helper functions
function fitTextToWidth(ctx, text, maxWidth, minSize, fontFamily, maxSize) {
    let size = maxSize;
    do {
        ctx.font = size + 'px ' + fontFamily;
        size--;
    } while (ctx.measureText(text).width > maxWidth && size > minSize);
    return size + 1;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
}

// Example elements
ctx.beginPath();
ctx.moveTo(200, 80);
ctx.lineTo(200, 550);
ctx.strokeStyle = '#000000';
ctx.lineWidth = 1;
ctx.stroke();

ctx.font = 'normal 18px Poppins';
ctx.fillStyle = '#000000';
ctx.textAlign = 'left';
ctx.fillText('Your text here', 300, 100);
```

## 🎨 Interface Overview

### Left Sidebar - Tools
- Element creation tools (Text, Image, Line, Rectangle, Circle)
- Background color controls
- Quick image upload

### Main Canvas Area
- Interactive drawing surface
- Element selection and manipulation
- Visual feedback with selection highlights

### Right Sidebar - Properties & Layers
- **Properties Panel**: Edit selected element attributes
- **Layers Panel**: Manage element visibility and order

### Header Controls
- Canvas size adjustment
- Clear all elements
- Export options (PNG and Code)

## 🔧 Technical Details

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### File Structure
```
canvas-js/
├── index.html          # Main application structure
├── styles.css          # Modern CSS styling
├── script.js           # Core application logic
└── readme.md          # This documentation
```

### Key Technologies
- **HTML5 Canvas**: Core drawing functionality
- **Vanilla JavaScript**: No external dependencies
- **CSS Grid/Flexbox**: Responsive layout
- **Web Fonts**: Google Fonts integration

## 📱 Responsive Design

The application adapts to different screen sizes:
- **Desktop**: Full three-panel layout
- **Tablet**: Stacked sidebar layout
- **Mobile**: Collapsed sidebars with touch-friendly controls

## 🤝 Contributing

Feel free to contribute to this project by:
1. Reporting bugs or issues
2. Suggesting new features
3. Submitting pull requests
4. Improving documentation

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues or have questions:
1. Check the browser console for error messages
2. Ensure you're using a modern browser
3. Verify that JavaScript is enabled
4. Make sure you're running the app from a web server (not file://)

---

**Happy designing!** 🎨✨
