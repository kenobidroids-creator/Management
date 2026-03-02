// This handles the transformation math and input listeners for both Mouse and Touch.

const Camera = {
    x: 0,
    y: 0,
    zoom: 1,
    isDragging: false,
    hasMoved: false,
    dragDistance: 0,
    lastPos: { x: 0, y: 0 },
    isLocked: false, // Set true when dragging furniture so the camera won't pan

    init(canvas) {
        // ── Mouse Events ──────────────────────────────────────────────────────
        canvas.addEventListener('mousedown', e => {
            this.isDragging = true;
            this.hasMoved = false;
            this.dragDistance = 0;
            this.lastPos = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mousemove', e => {
            // BUG FIX: Respect isLocked so furniture drags don't also pan the camera
            if (this.isDragging && !this.isLocked) {
                const dx = e.clientX - this.lastPos.x;
                const dy = e.clientY - this.lastPos.y;

                this.dragDistance += Math.sqrt(dx * dx + dy * dy);

                if (this.dragDistance > 5) {
                    this.hasMoved = true;
                    this.x -= dx / this.zoom;
                    this.y -= dy / this.zoom;
                }
            }
            // Always update lastPos (even when locked) so there's no jump when unlocking
            if (this.isDragging) {
                this.lastPos = { x: e.clientX, y: e.clientY };
            }
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;

            if (this.hasMoved) {
                this.hasMoved = false;
                return;
            }
        });

        // ── Touch Events ──────────────────────────────────────────────────────
        canvas.addEventListener('touchstart', e => {
            const touch = e.touches[0];
            this.isDragging = true;
            this.dragDistance = 0;
            this.lastPos = { x: touch.clientX, y: touch.clientY };
        }, { passive: false });

        window.addEventListener('touchmove', e => {
            if (this.isDragging && !this.isLocked) {
                const touch = e.touches[0];
                const dx = touch.clientX - this.lastPos.x;
                const dy = touch.clientY - this.lastPos.y;

                this.dragDistance += Math.sqrt(dx * dx + dy * dy);

                if (this.dragDistance > 10) {
                    this.hasMoved = true;
                    this.x -= dx / this.zoom;
                    this.y -= dy / this.zoom;
                }
            }
            if (this.isDragging) {
                const touch = e.touches[0];
                this.lastPos = { x: touch.clientX, y: touch.clientY };
            }
        }, { passive: false });

        window.addEventListener('touchend', () => {
            this.isDragging = false;
            // Note: We intentionally don't reset dragDistance here so index.html can read it
        });
    },

    screenToWorld(screenX, screenY, canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = (screenX - rect.left - canvas.width / 2) / this.zoom + this.x;
        const y = (screenY - rect.top - canvas.height / 2) / this.zoom + this.y;
        return { x, y };
    },

    // Manual start/move helpers (called externally if needed)
    start(x, y) {
        this.isDragging = true;
        this.lastPos = { x, y };
    },

    move(x, y) {
        if (!this.isDragging || this.isLocked) return;
        this.x -= (x - this.lastPos.x) / this.zoom;
        this.y -= (y - this.lastPos.y) / this.zoom;
        this.lastPos = { x, y };
    },

    apply(ctx, canvas) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    },

    detach(ctx) {
        ctx.restore();
    },

    zoomAt(delta, centerX, centerY) {
        const oldZoom = this.zoom;
        this.zoom = Math.min(Math.max(0.5, this.zoom + delta), 2);

        const zoomRatio = this.zoom / oldZoom;
        this.x = centerX - (centerX - this.x) / zoomRatio;
        this.y = centerY - (centerY - this.y) / zoomRatio;
    },

    wasSignificantDrag() {
        return this.dragDistance > 10;
    }
};
