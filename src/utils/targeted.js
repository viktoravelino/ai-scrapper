/**
 * DO NOT USE import someModule from '...';
 *
 * @issue-url https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/issues/160
 *
 * Chrome extensions don't support modules in content scripts.
 * If you want to use other modules in content scripts, you need to import them via these files.
 *
 */
import('@pages/content/injected/toggleTheme');

let isTargetMode = false;
let hoveredElement: HTMLElement | null = null;
let overlayElement: HTMLElement | null = null;

// Create and insert the toggle button
const toggleButton = document.createElement('button');
toggleButton.textContent = 'Target Mode ' + (isTargetMode ? 'ON' : 'OFF');
toggleButton.style.position = 'fixed';
toggleButton.style.top = '10px';
toggleButton.style.right = '10px';
toggleButton.style.zIndex = '99999999';
document.body.appendChild(toggleButton);

// Toggle target mode when the button is clicked
toggleButton.addEventListener('click', toggleTargetMode);

let elementProcessed = false; // Step 1: Define a flag

function toggleTargetMode() {
  isTargetMode = !isTargetMode;
  toggleButton.textContent = 'Target Mode ' + (isTargetMode ? 'ON' : 'OFF');
  elementProcessed = false; // Reset the flag when toggling the mode

  if (!isTargetMode) {
    removeOverlay();
    document.removeEventListener('click', preventDefaultClick, true);
    document.removeEventListener('mousedown', preventDefaultClick, true);
    document.removeEventListener('mouseup', preventDefaultClick, true);
  } else {
    document.addEventListener('click', preventDefaultClick, true);
    document.addEventListener('mousedown', preventDefaultClick, true);
    document.addEventListener('mouseup', preventDefaultClick, true);
  }
}

function preventDefaultClick(event: MouseEvent) {
  if (!elementProcessed && isTargetMode) {
    event.preventDefault();
    event.stopPropagation();
    // Step 2: Check the flag
    console.log('Selected Element:', event.target);
    removeOverlay();
    isTargetMode = false;
    toggleButton.textContent = 'Target Mode ' + (isTargetMode ? 'ON' : 'OFF');
    elementProcessed = true; // Mark as processed
  }
}

document.addEventListener('mouseover', handleMouseOver);
document.addEventListener('mouseout', handleMouseOut);
document.addEventListener('mousedown', handleMouseDown);

function handleMouseOver(event: MouseEvent) {
  if (isTargetMode) {
    const target = event.composedPath()[0] as HTMLElement;
    hoveredElement = target;
    renderOverlay(hoveredElement);
  }
}

function handleMouseOut(event: MouseEvent) {
  if (isTargetMode) {
    const target = event.composedPath()[0] as HTMLElement;
    if (target === hoveredElement) {
      removeOverlay();
      hoveredElement = null;
    }
  }
}

function handleMouseDown(event: MouseEvent) {
  if (isTargetMode && event.button === 0 && hoveredElement) {
    console.log('Selected Element:', hoveredElement);
    removeOverlay();
    toggleTargetMode();
    hoveredElement = null;
  }
}

function renderOverlay(element: HTMLElement) {
  removeOverlay();
  overlayElement = document.createElement('div');
  overlayElement.style.position = 'absolute';

  const rect = element.getBoundingClientRect();
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;

  overlayElement.style.top = `${rect.top + scrollY}px`;
  overlayElement.style.left = `${rect.left + scrollX}px`;
  overlayElement.style.width = `${rect.width}px`;
  overlayElement.style.height = `${rect.height}px`;
  overlayElement.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
  overlayElement.style.zIndex = '9999';
  overlayElement.style.pointerEvents = 'none';
  document.body.appendChild(overlayElement);
}

function removeOverlay() {
  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }
}
