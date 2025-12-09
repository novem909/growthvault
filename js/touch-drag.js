/**
 * GrowthVault - Touch Drag Handler
 * Mobile-friendly drag and drop using touch events
 * "Effortless. Intuitive. Delightful."
 */

export class TouchDragHandler {
    constructor(options = {}) {
        this.container = options.container ? document.querySelector(options.container) : document.body;
        this.draggableSelector = options.draggable || '.draggable';
        this.handleSelector = options.handle || null;
        this.dropTargetSelector = options.dropTargets || options.draggable;
        this.holdDuration = options.holdDuration || 200;
        this.scrollThreshold = options.scrollThreshold || 50;
        this.scrollSpeed = options.scrollSpeed || 10;
        
        // Callbacks
        this.onDragStart = options.onDragStart || (() => {});
        this.onDragMove = options.onDragMove || (() => {});
        this.onDrop = options.onDrop || (() => {});
        this.onCancel = options.onCancel || (() => {});
        
        // State
        this.isDragging = false;
        this.draggedElement = null;
        this.ghostElement = null;
        this.placeholder = null;
        this.holdTimer = null;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scrollInterval = null;
        this.currentDropTarget = null;
        this.originalIndex = -1;
        
        // Bind methods
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleTouchCancel = this.handleTouchCancel.bind(this);
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize touch event listeners
     */
    init() {
        if (!this.container) return;
        
        this.container.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.container.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.container.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        this.container.addEventListener('touchcancel', this.handleTouchCancel, { passive: false });
        
        console.log('📱 TouchDragHandler initialized');
    }
    
    /**
     * Destroy and cleanup
     */
    destroy() {
        if (!this.container) return;
        
        this.container.removeEventListener('touchstart', this.handleTouchStart);
        this.container.removeEventListener('touchmove', this.handleTouchMove);
        this.container.removeEventListener('touchend', this.handleTouchEnd);
        this.container.removeEventListener('touchcancel', this.handleTouchCancel);
        
        this.cancelDrag();
        console.log('📱 TouchDragHandler destroyed');
    }
    
    /**
     * Handle touch start - begin hold detection
     */
    handleTouchStart(e) {
        // Only handle single touch
        if (e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const target = e.target;
        
        // Find the draggable element
        const draggable = this.findDraggable(target);
        if (!draggable) return;
        
        // If handle is specified, check if touch is on handle
        if (this.handleSelector) {
            const handle = target.closest(this.handleSelector);
            if (!handle || !draggable.contains(handle)) return;
        }
        
        // Store initial position
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.draggedElement = draggable;
        
        // Calculate offset from touch point to element top-left
        const rect = draggable.getBoundingClientRect();
        this.offsetX = touch.clientX - rect.left;
        this.offsetY = touch.clientY - rect.top;
        
        // Store original index for potential cancel
        this.originalIndex = this.getElementIndex(draggable);
        
        // Start hold timer
        this.holdTimer = setTimeout(() => {
            this.startDrag(touch.clientX, touch.clientY);
        }, this.holdDuration);
    }
    
    /**
     * Handle touch move - update drag position or cancel hold
     */
    handleTouchMove(e) {
        if (!this.draggedElement) return;
        
        const touch = e.touches[0];
        this.currentX = touch.clientX;
        this.currentY = touch.clientY;
        
        // If not yet dragging, check if moved too far (cancel hold)
        if (!this.isDragging) {
            const deltaX = Math.abs(touch.clientX - this.startX);
            const deltaY = Math.abs(touch.clientY - this.startY);
            
            // If moved more than 10px, cancel hold (user is scrolling)
            if (deltaX > 10 || deltaY > 10) {
                this.cancelHold();
            }
            return;
        }
        
        // Prevent scrolling while dragging
        e.preventDefault();
        
        // Update ghost position
        this.updateGhostPosition(touch.clientX, touch.clientY);
        
        // Find drop target
        this.updateDropTarget(touch.clientX, touch.clientY);
        
        // Auto-scroll if near edges
        this.handleAutoScroll(touch.clientY);
        
        // Call move callback
        this.onDragMove(this.draggedElement, touch.clientX, touch.clientY);
    }
    
    /**
     * Handle touch end - complete or cancel drag
     */
    handleTouchEnd(e) {
        if (!this.draggedElement) return;
        
        // Clear hold timer if still waiting
        this.cancelHold();
        
        if (this.isDragging) {
            this.completeDrag();
        }
        
        this.cleanup();
    }
    
    /**
     * Handle touch cancel - abort everything
     */
    handleTouchCancel(e) {
        this.cancelDrag();
    }
    
    /**
     * Start the drag operation
     */
    startDrag(x, y) {
        if (!this.draggedElement) return;
        
        this.isDragging = true;
        
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
        
        // Create ghost element
        this.createGhost();
        
        // Create placeholder
        this.createPlaceholder();
        
        // Add dragging class to original
        this.draggedElement.classList.add('touch-dragging');
        
        // Position ghost
        this.updateGhostPosition(x, y);
        
        // Call start callback
        this.onDragStart(this.draggedElement);
        
        console.log('📱 Drag started');
    }
    
    /**
     * Create ghost element that follows finger
     */
    createGhost() {
        const rect = this.draggedElement.getBoundingClientRect();
        
        // Clone the element
        this.ghostElement = this.draggedElement.cloneNode(true);
        this.ghostElement.classList.add('touch-drag-ghost');
        this.ghostElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: ${rect.width}px;
            height: ${rect.height}px;
            pointer-events: none;
            z-index: 10000;
            opacity: 0.9;
            transform: scale(1.05) rotate(2deg);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            transition: transform 0.1s ease, box-shadow 0.1s ease;
            will-change: transform;
        `;
        
        document.body.appendChild(this.ghostElement);
    }
    
    /**
     * Create placeholder in original position
     */
    createPlaceholder() {
        const rect = this.draggedElement.getBoundingClientRect();
        
        this.placeholder = document.createElement('div');
        this.placeholder.classList.add('touch-drag-placeholder');
        this.placeholder.style.cssText = `
            width: ${rect.width}px;
            height: ${rect.height}px;
            background: var(--color-primary-light, rgba(180, 83, 9, 0.1));
            border: 2px dashed var(--color-primary, #B45309);
            border-radius: var(--radius-lg, 12px);
            box-sizing: border-box;
        `;
        
        this.draggedElement.parentNode.insertBefore(this.placeholder, this.draggedElement);
    }
    
    /**
     * Update ghost element position
     */
    updateGhostPosition(x, y) {
        if (!this.ghostElement) return;
        
        requestAnimationFrame(() => {
            if (this.ghostElement) {
                this.ghostElement.style.transform = `translate(${x - this.offsetX}px, ${y - this.offsetY}px) scale(1.05) rotate(2deg)`;
            }
        });
    }
    
    /**
     * Find and update current drop target
     */
    updateDropTarget(x, y) {
        // Temporarily hide ghost to get element underneath
        if (this.ghostElement) {
            this.ghostElement.style.display = 'none';
        }
        
        const elementBelow = document.elementFromPoint(x, y);
        
        if (this.ghostElement) {
            this.ghostElement.style.display = '';
        }
        
        if (!elementBelow) {
            this.clearDropTarget();
            return;
        }
        
        // Find drop target
        const dropTarget = elementBelow.closest(this.dropTargetSelector);
        
        if (dropTarget && dropTarget !== this.draggedElement && dropTarget !== this.placeholder) {
            if (this.currentDropTarget !== dropTarget) {
                this.clearDropTarget();
                this.currentDropTarget = dropTarget;
                this.currentDropTarget.classList.add('touch-drag-over');
                
                // Move placeholder to indicate drop position
                this.updatePlaceholderPosition(dropTarget, y);
            } else {
                // Update placeholder position as we move
                this.updatePlaceholderPosition(dropTarget, y);
            }
        } else {
            this.clearDropTarget();
        }
    }
    
    /**
     * Update placeholder position relative to drop target
     */
    updatePlaceholderPosition(target, y) {
        if (!this.placeholder || !target) return;
        
        const targetRect = target.getBoundingClientRect();
        const targetMiddle = targetRect.top + targetRect.height / 2;
        
        // Determine if we should insert before or after
        if (y < targetMiddle) {
            // Insert before target
            if (target.previousElementSibling !== this.placeholder) {
                target.parentNode.insertBefore(this.placeholder, target);
            }
        } else {
            // Insert after target
            if (target.nextElementSibling !== this.placeholder) {
                target.parentNode.insertBefore(this.placeholder, target.nextElementSibling);
            }
        }
    }
    
    /**
     * Clear current drop target highlight
     */
    clearDropTarget() {
        if (this.currentDropTarget) {
            this.currentDropTarget.classList.remove('touch-drag-over');
            this.currentDropTarget = null;
        }
    }
    
    /**
     * Handle auto-scroll when dragging near edges
     */
    handleAutoScroll(y) {
        // Clear existing scroll interval
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
            this.scrollInterval = null;
        }
        
        // Find scrollable parent
        const scrollParent = this.findScrollParent(this.container);
        if (!scrollParent) return;
        
        const rect = scrollParent.getBoundingClientRect();
        
        // Check if near top or bottom
        if (y < rect.top + this.scrollThreshold) {
            // Scroll up
            this.scrollInterval = setInterval(() => {
                scrollParent.scrollTop -= this.scrollSpeed;
            }, 16);
        } else if (y > rect.bottom - this.scrollThreshold) {
            // Scroll down
            this.scrollInterval = setInterval(() => {
                scrollParent.scrollTop += this.scrollSpeed;
            }, 16);
        }
    }
    
    /**
     * Complete the drag operation
     */
    completeDrag() {
        if (!this.draggedElement || !this.placeholder) return;
        
        // Move element to placeholder position
        this.placeholder.parentNode.insertBefore(this.draggedElement, this.placeholder);
        
        // Get new index
        const newIndex = this.getElementIndex(this.draggedElement);
        
        // Animate element into place
        this.animateDropComplete();
        
        // Call drop callback with position info
        this.onDrop(this.draggedElement, this.currentDropTarget, {
            oldIndex: this.originalIndex,
            newIndex: newIndex
        });
        
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(5);
        }
        
        console.log('📱 Drag completed');
    }
    
    /**
     * Animate the drop completion
     */
    animateDropComplete() {
        if (!this.draggedElement) return;
        
        // Add animation class
        this.draggedElement.classList.add('touch-drop-complete');
        
        // Remove after animation
        setTimeout(() => {
            if (this.draggedElement) {
                this.draggedElement.classList.remove('touch-drop-complete');
            }
        }, 300);
    }
    
    /**
     * Cancel the drag operation
     */
    cancelDrag() {
        if (this.isDragging && this.draggedElement) {
            // Call cancel callback
            this.onCancel(this.draggedElement);
            
            console.log('📱 Drag cancelled');
        }
        
        this.cleanup();
    }
    
    /**
     * Cancel the hold timer
     */
    cancelHold() {
        if (this.holdTimer) {
            clearTimeout(this.holdTimer);
            this.holdTimer = null;
        }
    }
    
    /**
     * Clean up all drag state
     */
    cleanup() {
        // Cancel hold timer
        this.cancelHold();
        
        // Stop auto-scroll
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
            this.scrollInterval = null;
        }
        
        // Remove ghost
        if (this.ghostElement) {
            this.ghostElement.remove();
            this.ghostElement = null;
        }
        
        // Remove placeholder
        if (this.placeholder) {
            this.placeholder.remove();
            this.placeholder = null;
        }
        
        // Remove classes from dragged element
        if (this.draggedElement) {
            this.draggedElement.classList.remove('touch-dragging');
        }
        
        // Clear drop target
        this.clearDropTarget();
        
        // Reset state
        this.isDragging = false;
        this.draggedElement = null;
        this.originalIndex = -1;
    }
    
    /**
     * Find draggable parent of target element
     */
    findDraggable(element) {
        return element.closest(this.draggableSelector);
    }
    
    /**
     * Find scrollable parent
     */
    findScrollParent(element) {
        if (!element) return null;
        
        const style = getComputedStyle(element);
        if (style.overflow === 'auto' || style.overflow === 'scroll' ||
            style.overflowY === 'auto' || style.overflowY === 'scroll') {
            return element;
        }
        
        return this.findScrollParent(element.parentElement);
    }
    
    /**
     * Get element index among siblings
     */
    getElementIndex(element) {
        if (!element || !element.parentNode) return -1;
        return Array.from(element.parentNode.children).indexOf(element);
    }
    
    /**
     * Check if device supports touch
     */
    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
}

export default TouchDragHandler;
