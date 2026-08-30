window.__studio_markers = [];
window.__studio_capture_complete = false;

const logMarker = (name) => {
    window.__studio_markers.push({ name, time: Date.now() });
    console.log(`[Studio] Marker: ${name}`);
};

class StudioInteractionEngine {
    constructor() {
        this.cursor = document.createElement('div');
        this.cursor.id = '__studio_cursor';
        this.cursor.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 24px; height: 24px;
            border-radius: 50%;
            border: 2px solid cyan;
            background-color: transparent;
            pointer-events: none;
            z-index: 2147483647;
            transform: translate(-50%, -50%);
            transition: background-color 0.1s, transform 0.1s;
            box-shadow: 0 0 8px cyan;
        `;
        document.body.appendChild(this.cursor);
        this.x = window.innerWidth / 2;
        this.y = window.innerHeight / 2;
        this.updateCursor();
    }

    updateCursor() {
        this.cursor.style.left = this.x + 'px';
        this.cursor.style.top = this.y + 'px';
    }

    setCursorActive(active) {
        if (active) {
            this.cursor.style.backgroundColor = 'rgba(255, 165, 0, 0.5)';
            this.cursor.style.border = '2px solid orange';
            this.cursor.style.boxShadow = '0 0 12px orange';
            this.cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
        } else {
            this.cursor.style.backgroundColor = 'transparent';
            this.cursor.style.border = '2px solid cyan';
            this.cursor.style.boxShadow = '0 0 8px cyan';
            this.cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        }
    }

    hideCursor() {
        this.cursor.style.display = 'none';
    }

    async moveTo(targetX, targetY, duration = 1000) {
        const startX = this.x;
        const startY = this.y;
        const startTime = performance.now();

        return new Promise(resolve => {
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                this.x = startX + (targetX - startX) * ease;
                this.y = startY + (targetY - startY) * ease;
                this.updateCursor();

                this.dispatchPointerEvent('pointermove', this.x, this.y, 0, 0, 0);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }

    findButton(txt) {
        return Array.from(document.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes(txt.toLowerCase()));
    }

    async moveToElementText(txt, duration = 1000) {
        const el = this.findButton(txt);
        if (!el) {
            console.warn('Button not found:', txt);
            return null;
        }

        const rect = el.getBoundingClientRect();
        const targetX = rect.left + rect.width / 2;
        const targetY = rect.top + rect.height / 2;
        await this.moveTo(targetX, targetY, duration);
        return el;
    }

    dispatchPointerEvent(type, x, y, button = 0, buttons = 0, pressure = 0) {
        const target = document.elementFromPoint(x, y) || document.body;
        const eventInit = {
            bubbles: true, cancelable: true, view: window,
            clientX: x, clientY: y,
            pointerId: 1, pointerType: 'mouse', isPrimary: true,
            button, buttons, pressure
        };
        target.dispatchEvent(new PointerEvent(type, eventInit));
        
        const mouseType = type.replace('pointer', 'mouse');
        if (['mousedown', 'mousemove', 'mouseup'].includes(mouseType)) {
            target.dispatchEvent(new MouseEvent(mouseType, eventInit));
        }
    }

    async click(buttonElement = null) {
        this.setCursorActive(true);
        this.dispatchPointerEvent('pointerdown', this.x, this.y, 0, 1, 0.5);
        await new Promise(r => setTimeout(r, 100));
        this.setCursorActive(false);
        this.dispatchPointerEvent('pointerup', this.x, this.y, 0, 0, 0);
        
        const target = document.elementFromPoint(this.x, this.y);
        if (target) {
            target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX: this.x, clientY: this.y }));
            const btn = target.closest('button');
            if (btn) btn.click();
        }
        
        if (buttonElement && buttonElement !== target && !buttonElement.contains(target)) {
             buttonElement.click();
        }
    }

    async drag(targetX, targetY, duration = 1000) {
        this.setCursorActive(true);
        this.dispatchPointerEvent('pointerdown', this.x, this.y, 0, 1, 0.5);
        await new Promise(r => setTimeout(r, 50));
        
        await this.moveTo(targetX, targetY, duration);
        
        this.setCursorActive(false);
        this.dispatchPointerEvent('pointerup', this.x, this.y, 0, 0, 0);
        await new Promise(r => setTimeout(r, 50));
    }

    findSlider(labelTxt) {
        const l = Array.from(document.querySelectorAll('*')).filter(e => e.tagName === 'LABEL' || e.tagName === 'SPAN' || e.tagName === 'DIV').find(el => el.children.length === 0 && el.textContent.trim().toLowerCase() === labelTxt.toLowerCase());
        if (!l) return null;
        const container = l.closest('div').parentElement;
        if (!container) return null;
        return container.querySelector('input[type="range"]');
    }

    async dragSliderNative(labelTxt, targetValue, duration = 1000) {
        let l = Array.from(document.querySelectorAll('label, span, div')).find(el => el.textContent.trim().toLowerCase() === labelTxt.toLowerCase() && el.children.length === 0);
        if (!l) l = Array.from(document.querySelectorAll('*')).find(el => el.textContent.toLowerCase().includes(labelTxt.toLowerCase()) && el.children.length === 0);

        if (!l) {
            console.warn('Slider label not found:', labelTxt);
            return;
        }
        
        let slider = l.parentElement ? l.parentElement.querySelector('input[type="range"]') : null;
        if (!slider) {
            let curr = l;
            while(curr && curr !== document.body) {
                slider = curr.querySelector('input[type="range"]');
                if(slider) break;
                curr = curr.parentElement;
            }
        }
        
        if (!slider) {
             console.warn('Slider not found for:', labelTxt);
             return;
        }

        const rect = slider.getBoundingClientRect();
        
        const min = parseFloat(slider.min || 0);
        const max = parseFloat(slider.max || 100);
        const startVal = parseFloat(slider.value);
        const currentPercentage = (startVal - min) / (max - min);
        
        await this.moveTo(rect.left + rect.width * currentPercentage, rect.top + rect.height / 2, 500);
        
        this.setCursorActive(true);
        this.dispatchPointerEvent('pointerdown', this.x, this.y, 0, 1, 0.5);
        await new Promise(r => setTimeout(r, 50));
        
        const targetPercentage = (targetValue - min) / (max - min);
        const targetX = rect.left + rect.width * targetPercentage;
        
        const startX = this.x;
        const startY = this.y;
        const startTime = performance.now();

        await new Promise(resolve => {
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                this.x = startX + (targetX - startX) * ease;
                this.updateCursor();

                const currentVal = startVal + (targetValue - startVal) * ease;
                Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(slider, currentVal);
                slider.dispatchEvent(new Event('input', { bubbles: true }));
                slider.dispatchEvent(new Event('change', { bubbles: true }));

                this.dispatchPointerEvent('pointermove', this.x, this.y, 0, 0, 0);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
        
        this.setCursorActive(false);
        this.dispatchPointerEvent('pointerup', this.x, this.y, 0, 0, 0);
        await new Promise(r => setTimeout(r, 50));
    }

    async wheelZoom(deltaY, duration = 1000) {
        const steps = 10;
        const stepTime = duration / steps;
        const stepDelta = deltaY / steps;
        
        const target = document.elementFromPoint(this.x, this.y) || document.body;
        for (let i = 0; i < steps; i++) {
            target.dispatchEvent(new WheelEvent('wheel', {
                bubbles: true, cancelable: true, view: window,
                clientX: this.x, clientY: this.y,
                deltaY: stepDelta, deltaMode: 0
            }));
            await new Promise(r => setTimeout(r, stepTime));
        }
    }
}

async function runChoreography() {
    const engine = new StudioInteractionEngine();
    
    logMarker('scene_01_start');
    const calmBtn = await engine.moveToElementText('Calm', 1000);
    await engine.click(calmBtn);
    await new Promise(r => setTimeout(r, 3000));
    logMarker('scene_01_end');
    
    logMarker('scene_02_start');
    const singBtn = await engine.moveToElementText('Singularity', 1000);
    await engine.click(singBtn);
    await new Promise(r => setTimeout(r, 600));
    
    await engine.dragSliderNative('SPIRAL TWIST', 0.6, 1000);
    await engine.dragSliderNative('GLOW INTENSITY', 2.5, 1000);
    
    const canvas = document.querySelector('canvas');
    if (canvas) {
        const rect = canvas.getBoundingClientRect();
        await engine.moveTo(rect.left + rect.width / 2, rect.top + rect.height / 2 + 100, 1000);
        await engine.drag(engine.x, engine.y - 200, 1500);
        await engine.wheelZoom(-800, 1500);
    }
    logMarker('scene_02_end');
    
    logMarker('scene_03_start');
    const warpBtn = await engine.moveToElementText('Engage Warp', 1000);
    await engine.click(warpBtn);
    
    await engine.moveTo(window.innerWidth / 2 - 200, window.innerHeight / 2 - 100, 1500);
    await engine.moveTo(window.innerWidth / 2 + 200, window.innerHeight / 2 + 100, 1500);
    await engine.moveTo(window.innerWidth / 2, window.innerHeight / 2, 1500);
    logMarker('scene_03_end');
    
    logMarker('scene_04_start');
    let disengageBtn = await engine.moveToElementText('Disengage', 1000);
    if(!disengageBtn) {
         disengageBtn = engine.findButton('Engage Warp');
         if (disengageBtn) {
             const rect = disengageBtn.getBoundingClientRect();
             await engine.moveTo(rect.left + rect.width / 2, rect.top + rect.height / 2, 1000);
         }
    }
    await engine.click(disengageBtn);
    await new Promise(r => setTimeout(r, 3500));
    engine.hideCursor();
    logMarker('scene_04_end');
    
    window.__studio_capture_complete = true;
}

if (document.readyState === 'complete') {
    setTimeout(runChoreography, 1000);
} else {
    window.addEventListener('load', () => setTimeout(runChoreography, 1000));
}
