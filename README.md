# Screen Annotation Tool

A desktop application for Windows that allows you to capture your screen and add annotations like arrows, circles, rectangles, and text.

## Features

- Capture your screen or any active window
- Add annotations with easy keyboard shortcuts:
  - `A` key: Arrow tool
  - `C` key: Circle tool
  - `R` key: Rectangle tool
  - `T` key: Text tool
- Choose from multiple colors with number keys (`1-8`)
- Undo annotations with `Ctrl+Z`
- Save annotated screenshots with `Ctrl+S`

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open a new terminal and start the Electron app:
   ```
   npm start
   ```

### Build

To build the application for Windows:

```
npm run package
```

The packaged application will be available in the `dist/electron` directory.

## Usage

1. Launch the application
2. Select a screen or window to capture
3. Use keyboard shortcuts or toolbar buttons to select annotation tools
4. Draw on the screen using your mouse:
   - Arrow: Click and drag from start to end
   - Circle: Click on center and drag to set radius
   - Rectangle: Click and drag from one corner to another
   - Text: Click where you want to add text, then type and press Enter
5. Use number keys (`1-8`) to change colors
6. Press `Ctrl+S` to save your annotated screenshot

## License

MIT
